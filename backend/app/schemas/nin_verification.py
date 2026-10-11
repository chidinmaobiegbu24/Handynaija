"""Pydantic schemas: they check NIN verification data before it goes further.

The raw NIN is accepted here for validation only. It is never stored in
MongoDB, never logged and never returned in a response.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

# A NIN is exactly 11 digits.
NIN_PATTERN = r"^\d{11}$"

# The four allowed states of a verification request.
VerificationStatus = Literal["pending", "verified", "rejected", "failed"]

# A webhook only delivers a final result, never back to pending.
WebhookResultStatus = Literal["verified", "rejected", "failed"]

# Sample data shown in the Swagger docs at /docs.
NIN_CREATE_EXAMPLE = {
    "provider_id": "6615f8a9b1c2d3e4f5a6b7c8",
    "nin": "12345678901",
}


class NINVerificationCreate(BaseModel):
    """Body sent by the frontend to start a NIN check."""

    # Reject unknown fields so nothing extra can end up in the database.
    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={"example": NIN_CREATE_EXAMPLE},
    )

    provider_id: str = Field(
        ...,
        min_length=1,
        max_length=64,
        description="MongoDB id of the service provider",
    )
    nin: str = Field(
        ...,
        pattern=NIN_PATTERN,
        description="11 digit NIN. It is never stored, logged or returned.",
    )

    @field_validator("nin", mode="before")
    @classmethod
    def clean_nin(cls, value: object) -> object:
        """Allow spaces or dashes while typing: '1234 567 8901'."""
        if isinstance(value, str):
            return value.replace(" ", "").replace("-", "")
        return value


class NINVerificationSubmitted(BaseModel):
    """Response returned after a verification request is created."""

    success: bool = True
    message: str
    verification_reference: str
    status: VerificationStatus


class NINVerificationStatusOut(BaseModel):
    """Safe view of a verification record.

    This schema has no NIN field, so a raw NIN can never be returned.
    """

    success: bool = True
    verification_reference: str
    status: VerificationStatus
    provider_id: str
    masked_nin: str
    verification_provider: str = Field(
        ...,
        description="NOT CONFIGURED yet: set to 'not_configured' until an authorized provider is integrated",
    )
    submitted_at: datetime
    verified_at: datetime | None = None
    rejection_reason: str | None = None


class NINWebhookResult(BaseModel):
    """Result an authorized verification provider will send to our webhook.

    There is intentionally no NIN field: a provider must never send it back.
    """

    # Reject unknown fields so a stray NIN can never be stored.
    model_config = ConfigDict(extra="forbid")

    status: WebhookResultStatus = Field(
        ...,
        description="Final result from the provider: verified, rejected or failed",
    )
    rejection_reason: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def require_reason_when_rejected(self):
        """A rejection must always explain why."""
        if self.status == "rejected" and not (self.rejection_reason or "").strip():
            raise ValueError("rejection_reason is required when status is 'rejected'")
        if self.status == "verified":
            # Keep the record clean: a verified result carries no reason.
            self.rejection_reason = None
        return self
