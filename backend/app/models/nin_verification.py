"""Helpers for the NIN verification MongoDB collection."""

from app.database import get_database

# The MongoDB collection (like a table) that stores verification requests.
NIN_COLLECTION = "nin_verifications"

# Every field a verification document can have.
# The raw NIN is deliberately absent: it is NEVER saved.
NIN_RECORD_FIELDS = [
    "provider_id",
    "verification_reference",
    "status",
    "masked_nin",
    "verification_provider",
    "submitted_at",
    "verified_at",
    "rejection_reason",
]

# Allowed statuses for a verification record.
NIN_STATUSES = ["pending", "verified", "rejected", "failed"]

# Statuses that block a new request for the same provider.
ACTIVE_STATUSES = ["pending", "verified"]


def get_nin_collection():
    """Return the NIN verification collection so routes can read and write it."""
    return get_database()[NIN_COLLECTION]


def serialize_verification(doc):
    """Turn a MongoDB document into a JSON-safe dictionary.

    Only known fields are kept, so a raw NIN could never travel through here.
    """
    if doc is None:
        return None
    return {field: doc[field] for field in NIN_RECORD_FIELDS if field in doc}
