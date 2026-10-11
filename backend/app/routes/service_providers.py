"""API routes for registering and managing Service Providers (Artisans)."""

import re
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query
from pymongo.errors import PyMongoError

from app.models.service_provider import (
    PROVIDER_FIELDS,
    get_provider_collection,
    new_profile_image_token,
    serialize_provider,
)
from app.schemas.service_provider import (
    ServiceProviderCreate,
    ServiceProviderCreated,
    ServiceProviderOut,
    ServiceProviderUpdate,
)

# All provider routes live under /api/providers.
router = APIRouter(tags=["Service Providers"])


def _run(action):
    """Run a database action and return a clean JSON error if it fails."""
    try:
        return action()
    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Database unavailable. Please try again later.",
        )


def _object_id(provider_id: str) -> ObjectId:
    """Turn the id from the URL into a MongoDB ObjectId."""
    if not ObjectId.is_valid(provider_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid provider id. Expected a 24 character MongoDB id.",
        )
    return ObjectId(provider_id)


def _find_provider(provider_id: str) -> dict:
    """Load one provider, or raise a 404 error."""
    doc = _run(lambda: get_provider_collection().find_one({"_id": _object_id(provider_id)}))
    if doc is None:
        raise HTTPException(status_code=404, detail="Provider not found")
    return doc


def _ignore_case(value: str) -> dict:
    """Match a value exactly but ignore upper/lower case."""
    return {"$regex": f"^{re.escape(value.strip())}$", "$options": "i"}


@router.post("/api/providers", status_code=201, response_model=ServiceProviderCreated)
def create_provider(payload: ServiceProviderCreate):
    """Register a new service provider."""
    data = payload.model_dump()

    # Every provider gets a creation time and a unique MongoDB ObjectId.
    data["created_at"] = datetime.now(timezone.utc)

    # Only fields that belong to a provider are saved.
    data = {key: value for key, value in data.items() if key in PROVIDER_FIELDS}

    # A fresh ownership secret for future uploads. It is stored but never
    # included in PROVIDER_FIELDS, so public responses cannot leak it.
    data["profile_image_token"] = new_profile_image_token()

    # insert_one() generates the unique _id (ObjectId) for us.
    result = _run(lambda: get_provider_collection().insert_one(data))
    data["_id"] = result.inserted_id

    # The token is returned exactly once, in this create response.
    return {**serialize_provider(data), "profile_image_token": data["profile_image_token"]}


@router.get("/api/providers", response_model=list[ServiceProviderOut])
def list_providers(
    location: str | None = Query(
        default=None,
        description="Filter by location, e.g. Port Harcourt",
    ),
    service_category: str | None = Query(
        default=None,
        description="Filter by service category, e.g. Plumber",
    ),
):
    """Return all providers, optionally filtered by location or category."""
    query: dict = {}

    if location and location.strip():
        query["location"] = _ignore_case(location)

    if service_category and service_category.strip():
        query["service_category"] = _ignore_case(service_category)

    docs = _run(lambda: list(get_provider_collection().find(query).sort("created_at", -1)))
    return [serialize_provider(doc) for doc in docs]


@router.get("/api/providers/{provider_id}", response_model=ServiceProviderOut)
def get_provider(provider_id: str):
    """Return a single service provider."""
    return serialize_provider(_find_provider(provider_id))


@router.put("/api/providers/{provider_id}", response_model=ServiceProviderOut)
def update_provider(provider_id: str, payload: ServiceProviderUpdate):
    """Update a service provider. Only the sent fields are changed."""
    # Make sure the provider exists first (raises 400 or 404).
    _find_provider(provider_id)

    changes = payload.model_dump(exclude_unset=True)

    # Only fields that belong to a provider are saved.
    changes = {key: value for key, value in changes.items() if key in PROVIDER_FIELDS}

    if not changes:
        raise HTTPException(
            status_code=400,
            detail="No fields provided to update. Send at least one provider field.",
        )

    _run(
        lambda: get_provider_collection().update_one(
            {"_id": _object_id(provider_id)},
            {"$set": changes},
        )
    )

    return serialize_provider(_find_provider(provider_id))


@router.delete("/api/providers/{provider_id}")
def delete_provider(provider_id: str):
    """Delete a service provider."""
    doc = _find_provider(provider_id)

    _run(lambda: get_provider_collection().delete_one({"_id": doc["_id"]}))

    return {"success": True, "message": "Provider deleted successfully"}
