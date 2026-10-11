"""API routes for uploading and removing profile pictures.

Ownership rule: a request may only change a customer or provider record when
it can prove possession of that record's `profile_image_token`. The token is
generated when the record is created, returned to its owner once, and verified
here with a constant-time comparison. This is the authorization boundary the
backend enforces today (the frontend "accounts" are still demo accounts); it
can later be replaced by full authentication without changing this endpoint's
contract.

Storage rule: the image is sent to Cloudinary through app.services.image_storage;
MongoDB only ever receives the returned URL and small metadata. The raw bytes
are never written to the database.
"""

import logging
import secrets

from fastapi import APIRouter, File, Form, Header, HTTPException, Query, UploadFile
from pymongo.errors import PyMongoError

from app.models.customer import get_customer_collection, serialize_customer
from app.models.service_provider import get_provider_collection, serialize_provider
from app.services import image_storage

logger = logging.getLogger("handynaija.profile_pictures")

router = APIRouter(tags=["Profile Pictures"])

# The profile-image metadata written back to the owner's Mongo document.
PROFILE_IMAGE_FIELDS = [
    "profile_image",
    "profile_image_public_id",
    "profile_image_width",
    "profile_image_height",
    "profile_image_format",
    "profile_image_bytes",
]

# owner_type -> (collection getter, serializer). Adding a new owner type here
# automatically supports profile pictures for it.
_OWNERS = {
    "customer": (get_customer_collection, serialize_customer),
    "provider": (get_provider_collection, serialize_provider),
}

_READ_CHUNK = 64 * 1024


def _run(action):
    """Run a database action and return a clean JSON error if it fails."""
    try:
        return action()
    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Database unavailable. Please try again later.",
        )


def _owner_parts(owner_type: str):
    """Return (collection getter, serializer) for a valid owner_type."""
    parts = _OWNERS.get((owner_type or "").strip().lower())
    if parts is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid owner_type. Use 'customer' or 'provider'.",
        )
    return parts


def _validate_owner_id(owner_id: str) -> object:
    """Accept only ids that can index into the Mongo collections.

    Uses the same ObjectId rule as the rest of the API (24 character hex).
    Any other value is rejected as 400 before the database is queried, so an
    attacker cannot turn the endpoint into an arbitrary-key lookup.
    """
    from bson.objectid import ObjectId

    if not ObjectId.is_valid(owner_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid owner id. Expected a 24 character MongoDB id.",
        )
    return ObjectId(owner_id)


def _load_owner(owner_type: str, owner_id: str) -> tuple:
    """Return (doc, collection, serializer) for the owner, or raise."""
    collection_getter, serializer = _owner_parts(owner_type)
    collection = collection_getter()
    object_id = _validate_owner_id(owner_id)
    doc = _run(lambda: collection.find_one({"_id": object_id}))
    if doc is None:
        raise HTTPException(status_code=404, detail=f"{owner_type.title()} not found")
    return doc, collection, serializer


def _verify_owner_token(
    doc: dict,
    token: str | None,
    require_storage_configured: bool = True,
) -> None:
    """Raise 401/403 when the request cannot prove it owns the record."""
    expected = doc.get("profile_image_token") or ""
    if not expected:
        raise HTTPException(
            status_code=403,
            detail=(
                "This record does not have profile-picture access yet. "
                "Re-register the account to receive its ownership key, then try again."
            ),
        )
    if not token or not secrets.compare_digest(token, expected):
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing ownership token for this account.",
        )
    if require_storage_configured and not image_storage.is_configured():
        raise HTTPException(
            status_code=503,
            detail={
                "message": (
                    "Image storage is NOT CONFIGURED. Set CLOUDINARY_CLOUD_NAME, "
                    "CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET on the backend, "
                    "then try again."
                ),
                "storage_provider": image_storage.PROVIDER_NOT_CONFIGURED,
            },
        )


async def _read_upload_limited(file: UploadFile, max_bytes: int) -> bytes:
    """Read the uploaded file without buffering more than max_bytes + 1."""
    chunks = []
    total = 0
    limit = max_bytes + 1
    while total < limit:
        chunk = await file.read(min(_READ_CHUNK, limit - total))
        if not chunk:
            break
        chunks.append(chunk)
        total += len(chunk)
    return b"".join(chunks)


def _update_owner_image(
    collection,
    doc: dict,
    storage: dict,
    old_public_id: str,
) -> None:
    """Write image metadata to the owner, then best-effort delete the old image."""
    update = {field: storage[field] for field in PROFILE_IMAGE_FIELDS if field in storage}
    _run(lambda: collection.update_one({"_id": doc["_id"]}, {"$set": update}))

    if old_public_id and old_public_id != storage.get("profile_image_public_id"):
        image_storage.delete_image(old_public_id)


@router.post("/api/profile-pictures")
async def upload_profile_picture(
    file: UploadFile = File(..., description="The image file (JPEG, PNG or WebP)"),
    owner_type: str = Form(..., description="'customer' or 'provider'"),
    owner_id: str = Form(..., description="The owner's MongoDB ObjectId"),
    x_profile_token: str | None = Header(
        default=None,
        description="Ownership token returned when the account was registered",
    ),
):
    """Upload (or replace) the profile picture for a customer or provider.

    The caller must prove ownership of `owner_id` with X-Profile-Token.
    """
    doc, collection, serializer = _load_owner(owner_type, owner_id)
    _verify_owner_token(doc, x_profile_token)

    content_type = (file.content_type or "application/octet-stream").split(";")[0].strip()
    data = await _read_upload_limited(file, image_storage.get_max_bytes())

    try:
        storage = image_storage.upload_image(data, content_type, owner_type, str(doc["_id"]))
    except image_storage.ImageStorageNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except image_storage.InvalidImageError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except image_storage.ImageStorageError as exc:
        # Upload infrastructure failed (e.g. Cloudinary returned an error).
        logger.warning("Profile picture upload failed for %s %s", owner_type, owner_id)
        raise HTTPException(status_code=502, detail=str(exc))

    old_public_id = doc.get("profile_image_public_id") or ""
    _update_owner_image(collection, doc, storage, old_public_id)

    updated = _run(lambda: collection.find_one({"_id": doc["_id"]}))
    return {
        "success": True,
        "message": "Profile picture updated",
        "owner_type": owner_type,
        "owner_id": owner_id,
        **storage,
        "profile": serializer(updated),
    }


@router.delete("/api/profile-pictures")
def remove_profile_picture(
    owner_type: str = Query(..., description="'customer' or 'provider'"),
    owner_id: str = Query(..., description="The owner's MongoDB ObjectId"),
    x_profile_token: str | None = Header(
        default=None,
        description="Ownership token returned when the account was registered",
    ),
):
    """Remove the profile picture for a customer or provider.

    The stored URL and metadata are cleared and the Cloudinary asset (if any)
    is deleted best-effort. The caller must prove ownership with X-Profile-Token.
    Removal only needs the recorded token, not a live Cloudinary connection.
    """
    doc, collection, serializer = _load_owner(owner_type, owner_id)
    _verify_owner_token(doc, x_profile_token, require_storage_configured=False)

    old_public_id = doc.get("profile_image_public_id") or ""
    metadata_fields = [field for field in PROFILE_IMAGE_FIELDS if field != "profile_image"]
    cleared = {field: "" for field in PROFILE_IMAGE_FIELDS}
    update: dict = {"$set": cleared}
    if metadata_fields:
        update["$unset"] = {field: "" for field in metadata_fields}

    _run(lambda: collection.update_one({"_id": doc["_id"]}, update))
    image_storage.delete_image(old_public_id)

    updated = _run(lambda: collection.find_one({"_id": doc["_id"]}))
    return {
        "success": True,
        "message": "Profile picture removed",
        "owner_type": owner_type,
        "owner_id": owner_id,
        "profile": serializer(updated),
    }