"""API routes for NIN verification.

Security rules that apply to every route in this file:
- the raw NIN is only ever read from the POST body (never from a URL)
- the raw NIN is never saved to MongoDB, only a masked copy is
- the raw NIN is never logged and never returned in a response
- no verification is reported as done: the provider is NOT CONFIGURED
"""

import secrets
import uuid
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Header, HTTPException, Path as PathParam, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError

from app.models.nin_verification import (
    ACTIVE_STATUSES,
    get_nin_collection,
    serialize_verification,
)
from app.models.service_provider import get_provider_collection
from app.schemas.nin_verification import (
    NINVerificationCreate,
    NINVerificationStatusOut,
    NINVerificationSubmitted,
    NINWebhookResult,
)
from app.services.nin_verification import (
    PROVIDER_NOT_CONFIGURED,
    build_result_update,
    get_webhook_secret,
    mask_nin,
    submit_verification,
)

# All NIN verification routes live under /api/nin-verification.
router = APIRouter(tags=["NIN Verification"])


def _run(action):
    """Run a database action and return a clean JSON error if it fails."""
    try:
        return action()
    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Database unavailable. Please try again later.",
        )


def _object_id_str(provider_id: str) -> str:
    """Check a provider id sent in a body or URL (400 when it is not valid)."""
    if not ObjectId.is_valid(provider_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid provider id. Expected a 24 character MongoDB id.",
        )
    return provider_id


def _find_provider(provider_id: str) -> dict:
    """Load one provider, or raise a 404 error."""
    doc = _run(lambda: get_provider_collection().find_one({"_id": ObjectId(provider_id)}))
    if doc is None:
        raise HTTPException(status_code=404, detail="Provider not found")
    return doc


def _find_record(verification_reference: str) -> dict:
    """Load one verification record, or raise a 404 error."""
    doc = _run(
        lambda: get_nin_collection().find_one(
            {"verification_reference": verification_reference}
        )
    )
    if doc is None:
        raise HTTPException(status_code=404, detail="Verification request not found")
    return doc


def _new_reference() -> str:
    """Generate a unique verification reference. It is safe to return."""
    return f"NIN-{uuid.uuid4().hex.upper()}"


async def nin_validation_error_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    """Return validation errors without echoing the raw NIN back.

    FastAPI normally repeats the submitted value in every validation error.
    For the nin field that value is removed, so a NIN can never leave this
    API inside an error message.
    """
    errors = []
    for error in exc.errors():
        item = dict(error)
        location = [str(part) for part in item.get("loc", ())]
        if "nin" in location:
            # 'input' holds exactly what the client sent - drop it.
            item.pop("input", None)
            item.pop("ctx", None)
        errors.append(item)

    return JSONResponse(
        status_code=422,
        content=jsonable_encoder({"detail": errors}),
    )


@router.post(
    "/api/nin-verification",
    status_code=201,
    response_model=NINVerificationSubmitted,
)
def create_nin_verification(payload: NINVerificationCreate):
    """Create a NIN verification request for a service provider."""
    provider_id = _object_id_str(payload.provider_id)

    # The provider must exist (raises 400 or 404).
    _find_provider(provider_id)

    # One active request at a time: block duplicates and re-checks.
    existing = _run(
        lambda: get_nin_collection().find_one(
            {"provider_id": provider_id, "status": {"$in": ACTIVE_STATUSES}}
        )
    )
    if existing is not None:
        already_verified = existing.get("status") == "verified"
        raise HTTPException(
            status_code=409,
            detail={
                "message": (
                    "This provider is already verified."
                    if already_verified
                    else "A pending NIN verification already exists for this provider."
                ),
                "verification_reference": existing.get("verification_reference"),
                "status": existing.get("status"),
            },
        )

    reference = _new_reference()

    # The raw NIN is handed to the service layer only. It is not saved.
    outcome = submit_verification(
        nin=payload.nin,
        provider_id=provider_id,
        verification_reference=reference,
    )

    now = datetime.now(timezone.utc)
    status = outcome.get("status", "pending")

    # The record is built field by field, so the raw NIN cannot end up in it.
    record = {
        "provider_id": provider_id,
        "verification_reference": reference,
        "status": status,
        "masked_nin": mask_nin(payload.nin),
        "verification_provider": outcome.get(
            "verification_provider", PROVIDER_NOT_CONFIGURED
        ),
        "submitted_at": now,
        "verified_at": now if status in ("verified", "rejected", "failed") else None,
        "rejection_reason": outcome.get("rejection_reason"),
    }

    _run(lambda: get_nin_collection().insert_one(dict(record)))

    return {
        "success": True,
        "message": "NIN verification request submitted",
        "verification_reference": reference,
        "status": status,
    }


@router.get(
    "/api/nin-verification/{verification_reference}",
    response_model=NINVerificationStatusOut,
)
def get_nin_verification(
    verification_reference: str = PathParam(..., min_length=1, max_length=64),
):
    """Return the status of one verification request. Never the NIN."""
    doc = _find_record(verification_reference)
    return {"success": True, **serialize_verification(doc)}


@router.get(
    "/api/providers/{provider_id}/nin-verification",
    response_model=NINVerificationStatusOut,
)
def get_provider_nin_status(provider_id: str):
    """Return the current NIN verification status of a service provider."""
    provider_id = _object_id_str(provider_id)
    _find_provider(provider_id)

    # The latest request wins when a provider re-submitted after a failure.
    doc = _run(
        lambda: get_nin_collection().find_one(
            {"provider_id": provider_id},
            sort=[("submitted_at", -1)],
        )
    )
    if doc is None:
        raise HTTPException(
            status_code=404,
            detail="No NIN verification found for this provider.",
        )

    return {"success": True, **serialize_verification(doc)}


@router.post(
    "/api/nin-verification/{verification_reference}/webhook",
    response_model=NINVerificationStatusOut,
)
def nin_verification_webhook(
    payload: NINWebhookResult,
    verification_reference: str = PathParam(..., min_length=1, max_length=64),
    x_webhook_secret: str | None = Header(
        default=None,
        description="Shared secret, must match NIN_WEBHOOK_SECRET",
    ),
):
    """Receive a verification result from an authorized provider.

    NOT CONFIGURED: the endpoint exists, but it only accepts results once a
    shared secret is set in the environment. Until then it returns 503 and
    changes nothing, so nothing can be marked verified by accident.
    """
    expected_secret = get_webhook_secret()
    if not expected_secret:
        raise HTTPException(
            status_code=503,
            detail={
                "message": (
                    "NIN verification provider is NOT CONFIGURED. "
                    "Webhook updates are disabled until NIN_WEBHOOK_SECRET is set."
                ),
                "verification_provider": PROVIDER_NOT_CONFIGURED,
            },
        )

    # Constant time comparison so the secret cannot be guessed bit by bit.
    if not x_webhook_secret or not secrets.compare_digest(
        x_webhook_secret, expected_secret
    ):
        raise HTTPException(status_code=401, detail="Invalid webhook secret.")

    # Makes sure the request exists (raises 404 when the reference is wrong).
    _find_record(verification_reference)

    update = build_result_update(payload.status, payload.rejection_reason)

    _run(
        lambda: get_nin_collection().update_one(
            {"verification_reference": verification_reference},
            {"$set": update},
        )
    )

    doc = _find_record(verification_reference)
    return {"success": True, **serialize_verification(doc)}
