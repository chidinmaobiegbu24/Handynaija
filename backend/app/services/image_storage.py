"""Profile-picture image storage.

Images are uploaded to Cloudinary, an external image-storage service. MongoDB
only ever stores the returned URL and small metadata (public id, dimensions,
format, byte size) - never the image bytes themselves.

Configuration is read from backend environment variables only:

    CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET,
    CLOUDINARY_UPLOAD_FOLDER (optional),
    PROFILE_IMAGE_MAX_BYTES (optional, default 5 MB),
    PROFILE_IMAGE_ALLOWED_TYPES (optional, comma-separated MIME types).

Secrets are never sent to the browser. When the service is not configured the
upload endpoint answers with a clear "NOT CONFIGURED" error instead of failing
unpredictably.
"""

import logging
import os
from uuid import uuid4

logger = logging.getLogger("handynaija.image_storage")

try:  # The SDK is optional so the API still imports without it installed.
    import cloudinary
    import cloudinary.uploader

    _SDK_AVAILABLE = True
except ImportError:  # pragma: no cover - exercised only when the SDK is absent
    cloudinary = None  # type: ignore[assignment]
    _SDK_AVAILABLE = False


# MIME type -> canonical file extension.
SUPPORTED_IMAGE_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}

DEFAULT_ALLOWED_TYPES = ",".join(SUPPORTED_IMAGE_TYPES)
DEFAULT_MAX_BYTES = 5 * 1024 * 1024  # 5 MB
DEFAULT_FOLDER = "handynaija/profile-pictures"
PROVIDER_NOT_CONFIGURED = "cloudinary"

# Magic-byte signatures used to confirm the file really is the image it claims.
_MAGIC_SIGNATURES = {
    "image/jpeg": (b"\xff\xd8\xff",),
    "image/png": (b"\x89PNG\r\n\x1a\n",),
    "image/webp": (b"RIFF",),
}


class ImageStorageError(Exception):
    """Base class for image-storage failures that are safe to show to users."""


class ImageStorageNotConfigured(ImageStorageError):
    """Raised when no Cloudinary credentials are present."""


class InvalidImageError(ImageStorageError):
    """Raised when the uploaded file fails format or size validation."""


def _env(name: str) -> str:
    return os.getenv(name, "").strip()


def get_upload_folder() -> str:
    return _env("CLOUDINARY_UPLOAD_FOLDER") or DEFAULT_FOLDER


def get_allowed_types() -> dict[str, str]:
    """Return the accepted MIME types -> extension map.

    The environment can only narrow the built-in safe list, never add an
    unsupported type.
    """
    raw = _env("PROFILE_IMAGE_ALLOWED_TYPES")
    if not raw:
        allowed = dict(SUPPORTED_IMAGE_TYPES)
    else:
        allowed = {
            item.strip().lower(): SUPPORTED_IMAGE_TYPES[item.strip().lower()]
            for item in raw.split(",")
            if item.strip().lower() in SUPPORTED_IMAGE_TYPES
        }
    return allowed or dict(SUPPORTED_IMAGE_TYPES)


def get_max_bytes() -> int:
    raw = _env("PROFILE_IMAGE_MAX_BYTES")
    if raw.isdigit() and int(raw) > 0:
        return int(raw)
    return DEFAULT_MAX_BYTES


def is_configured() -> bool:
    """True only when the SDK is installed and all three secrets are set."""
    return _SDK_AVAILABLE and all(
        _env(name)
        for name in (
            "CLOUDINARY_CLOUD_NAME",
            "CLOUDINARY_API_KEY",
            "CLOUDINARY_API_SECRET",
        )
    )


def _configure() -> None:
    cloudinary.config(
        cloud_name=_env("CLOUDINARY_CLOUD_NAME"),
        api_key=_env("CLOUDINARY_API_KEY"),
        api_secret=_env("CLOUDINARY_API_SECRET"),
        secure=True,
    )


def _looks_like(content_type: str, data: bytes) -> bool:
    signatures = _MAGIC_SIGNATURES.get(content_type, ())
    if not signatures:
        return False
    if content_type == "image/webp":
        # WebP is a RIFF container; confirm both markers.
        return data[:4] == b"RIFF" and data[8:12] == b"WEBP"
    return any(data.startswith(signature) for signature in signatures)


def validate_image(data: bytes, content_type: str) -> str:
    """Validate an upload and return its canonical file extension.

    Raises InvalidImageError with a helpful message when the file is empty,
    too large, or not an allowed image format.
    """
    allowed = get_allowed_types()
    normalized = (content_type or "").split(";")[0].strip().lower()

    if not data:
        raise InvalidImageError("The uploaded image is empty. Please choose a photo and try again.")

    if normalized not in allowed:
        readable = ", ".join(sorted(allowed))
        raise InvalidImageError(
            f"Unsupported image format. Allowed formats are: {readable}."
        )

    max_bytes = get_max_bytes()
    if len(data) > max_bytes:
        max_mb = max_bytes / (1024 * 1024)
        raise InvalidImageError(
            f"Image is too large. The maximum size is {max_mb:g} MB."
        )

    if not _looks_like(normalized, data):
        raise InvalidImageError(
            "The file does not look like a valid image. Please upload a real JPEG, PNG or WebP photo."
        )

    return allowed[normalized]


def upload_image(
    data: bytes,
    content_type: str,
    owner_type: str,
    owner_id: str,
) -> dict:
    """Upload validated image bytes to Cloudinary and return storage metadata."""
    extension = validate_image(data, content_type)

    if not is_configured():
        raise ImageStorageNotConfigured(
            "Image storage is NOT CONFIGURED. Set CLOUDINARY_CLOUD_NAME, "
            "CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET on the backend, then "
            "try again."
        )

    _configure()
    public_id = f"{owner_type}-{owner_id}-{uuid4().hex[:10]}"

    try:
        result = cloudinary.uploader.upload(
            data,
            folder=get_upload_folder(),
            public_id=public_id,
            resource_type="image",
            overwrite=False,
            invalidate=True,
            use_filename=False,
            unique_filename=False,
        )
    except Exception as exc:  # noqa: BLE001 - surfaced as a safe 502 to the client
        logger.warning("Cloudinary upload failed for %s %s: %s", owner_type, owner_id, exc)
        raise ImageStorageError(
            "We couldn't save your photo right now. Please try again in a moment."
        ) from exc

    return {
        "profile_image": result.get("secure_url") or result.get("url") or "",
        "profile_image_public_id": result.get("public_id") or "",
        "profile_image_width": result.get("width"),
        "profile_image_height": result.get("height"),
        "profile_image_format": result.get("format") or extension,
        "profile_image_bytes": result.get("bytes") or len(data),
    }


def delete_image(public_id: str) -> bool:
    """Best-effort delete of a previously uploaded image. Never raises."""
    if not public_id or not is_configured():
        return False
    try:
        _configure()
        cloudinary.uploader.destroy(public_id, invalidate=True)
        return True
    except Exception as exc:  # noqa: BLE001 - cleanup must never break a request
        logger.warning("Cloudinary delete failed for %s: %s", public_id, exc)
        return False
