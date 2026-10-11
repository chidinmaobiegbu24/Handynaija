"""Helpers for the Customer MongoDB collection."""

from app.database import get_database

# The MongoDB collection (like a table) that stores customers.
CUSTOMER_COLLECTION = "customers"

# Fields a customer document can have.
# `profile_image_token` is intentionally absent: it is an internal ownership
# secret that must never be serialized in a public response.
CUSTOMER_FIELDS = [
    "full_name",
    "phone",
    "email",
    "location",
    "state",
    "profile_image",
    "profile_image_public_id",
    "profile_image_width",
    "profile_image_height",
    "profile_image_format",
    "profile_image_bytes",
    "created_at",
]


def get_customer_collection():
    """Return the customers collection so the routes can read and write it."""
    return get_database()[CUSTOMER_COLLECTION]


def serialize_customer(doc):
    """Turn a MongoDB document into a JSON-safe dictionary."""
    if doc is None:
        return None

    # Keep only the known customer fields (this drops MongoDB's _id and the
    # internal profile_image_token secret).
    data = {field: doc[field] for field in CUSTOMER_FIELDS if field in doc}

    # ObjectId cannot be JSON encoded, so we return it as a plain string.
    data["id"] = str(doc["_id"]) if "_id" in doc else ""
    return data