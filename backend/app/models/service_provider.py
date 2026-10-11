"""Helpers for the Service Provider MongoDB collection."""

from app.database import get_database

# The MongoDB collection (like a table) that stores providers.
PROVIDER_COLLECTION = "service_providers"

# Every field a provider document can have.
PROVIDER_FIELDS = [
    "full_name",
    "phone",
    "email",
    "service_category",
    "skills",
    "description",
    "location",
    "state",
    "years_of_experience",
    "price",
    "availability",
    "profile_image",
    "created_at",
]


def get_provider_collection():
    """Return the providers collection so the routes can read and write it."""
    return get_database()[PROVIDER_COLLECTION]


def serialize_provider(doc):
    """Turn a MongoDB document into a JSON-safe dictionary."""
    if doc is None:
        return None

    # Keep only the known provider fields (this drops MongoDB's _id).
    data = {field: doc[field] for field in PROVIDER_FIELDS if field in doc}

    # ObjectId cannot be JSON encoded, so we return it as a plain string.
    data["id"] = str(doc["_id"]) if "_id" in doc else ""
    return data
