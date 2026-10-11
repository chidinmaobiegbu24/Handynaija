"""Helpers for the Service Provider MongoDB collection.

The profile_image_token below is a private ownership secret used to prove a
client may change this provider's profile picture. It must NEVER be added to
PROVIDER_FIELDS: that list is what serialize_provider() exposes publicly.
"""

import secrets

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
    "profile_image_public_id",
    "profile_image_width",
    "profile_image_height",
    "profile_image_format",
    "profile_image_bytes",
    "created_at",
]

# The internal field that stores the ownership secret. Deliberately NOT part
# of PROVIDER_FIELDS so it never leaves the server in a response.
PROFILE_IMAGE_TOKEN_FIELD = "profile_image_token"


def get_provider_collection():
    """Return the providers collection so the routes can read and write it."""
    return get_database()[PROVIDER_COLLECTION]


def new_profile_image_token() -> str:
    """Generate a fresh random ownership secret for a provider record."""
    return secrets.token_urlsafe(32)


def serialize_provider(doc):
    """Turn a MongoDB document into a JSON-safe dictionary."""
    if doc is None:
        return None

    # Keep only the known provider fields (this drops MongoDB's _id and the
    # internal profile_image_token secret).
    data = {field: doc[field] for field in PROVIDER_FIELDS if field in doc}

    # ObjectId cannot be JSON encoded, so we return it as a plain string.
    data["id"] = str(doc["_id"]) if "_id" in doc else ""
    return data