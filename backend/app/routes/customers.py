"""API routes for registering and managing Customers."""

from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, HTTPException
from pymongo.errors import PyMongoError

from app.models.customer import (
    CUSTOMER_FIELDS,
    get_customer_collection,
    serialize_customer,
)
from app.models.service_provider import new_profile_image_token
from app.schemas.customer import CustomerCreate, CustomerCreated, CustomerOut

# All customer routes live under /api/customers.
router = APIRouter(tags=["Customers"])


def _run(action):
    """Run a database action and return a clean JSON error if it fails."""
    try:
        return action()
    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Database unavailable. Please try again later.",
        )


def _object_id(customer_id: str) -> ObjectId:
    """Turn the id from the URL into a MongoDB ObjectId."""
    if not ObjectId.is_valid(customer_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid customer id. Expected a 24 character MongoDB id.",
        )
    return ObjectId(customer_id)


def _find_customer(customer_id: str) -> dict:
    """Load one customer, or raise a 404 error."""
    doc = _run(lambda: get_customer_collection().find_one({"_id": _object_id(customer_id)}))
    if doc is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return doc


@router.post("/api/customers", status_code=201, response_model=CustomerCreated)
def create_customer(payload: CustomerCreate):
    """Register a new customer."""
    data = payload.model_dump()

    # Only fields that belong to a customer are saved.
    data = {key: value for key, value in data.items() if key in CUSTOMER_FIELDS}
    data["created_at"] = datetime.now(timezone.utc)

    # A fresh ownership secret for future uploads. It is stored but never
    # included in CUSTOMER_FIELDS, so public responses cannot leak it.
    data["profile_image_token"] = new_profile_image_token()

    # insert_one() generates the unique _id (ObjectId) for us.
    result = _run(lambda: get_customer_collection().insert_one(data))
    data["_id"] = result.inserted_id

    # The token is returned exactly once, in this create response.
    return {**serialize_customer(data), "profile_image_token": data["profile_image_token"]}


@router.get("/api/customers/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: str):
    """Return a single customer."""
    return serialize_customer(_find_customer(customer_id))