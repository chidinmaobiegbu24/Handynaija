"""Integration point for an authorized NIN verification provider.

Security rules for this module:
- The raw NIN is only ever a normal in-memory argument. It is never stored
  in MongoDB, never written to a log and never returned to a client.
- No real provider is connected yet. Everything here reports NOT CONFIGURED
  on purpose, so the system never pretends a verification happened.
"""

import os
from datetime import datetime, timezone

# Value saved in verification_provider until a real provider is integrated.
PROVIDER_NOT_CONFIGURED = "not_configured"


def get_api_url() -> str:
    """Read the provider API URL from the environment (never hard-coded)."""
    return os.getenv("NIN_VERIFICATION_API_URL", "").strip()


def get_api_key() -> str:
    """Read the provider API key from the environment (never hard-coded)."""
    return os.getenv("NIN_VERIFICATION_API_KEY", "").strip()


def get_webhook_secret() -> str:
    """Read the shared webhook secret from the environment."""
    return os.getenv("NIN_WEBHOOK_SECRET", "").strip()


def is_provider_configured() -> bool:
    """True only when the provider URL and API key are both set."""
    return bool(get_api_url() and get_api_key())


def mask_nin(nin: str) -> str:
    """Hide a NIN, keeping only the last 4 digits: 12345678901 -> *******8901."""
    if len(nin) <= 4:
        return "*" * len(nin)
    return "*" * (len(nin) - 4) + nin[-4:]


def submit_verification(*, nin: str, provider_id: str, verification_reference: str) -> dict:
    """Handle a verification request.

    `nin` is the raw NIN. It only exists as a parameter here so a future
    provider call can use it. Nothing in this function stores or logs it.
    """
    # NOT CONFIGURED: do not call anyone and do not report any result.
    if not is_provider_configured():
        return {
            "verification_provider": PROVIDER_NOT_CONFIGURED,
            "status": "pending",
            "rejection_reason": None,
            "message": (
                "NIN verification provider is NOT CONFIGURED. "
                "The request was saved as pending."
            ),
        }

    # ------------------------------------------------------------------------
    # INTEGRATION POINT (future): send the raw NIN to the authorized identity
    # verification provider over HTTPS here, for example:
    #
    #   response = httpx.post(get_api_url(), json={"nin": nin},
    #                         headers={"Authorization": f"Bearer {get_api_key()}"})
    #
    # Rules for whoever adds that code:
    #   - send the NIN only to the authorized provider, over HTTPS
    #   - never log the raw NIN
    #   - never save the raw NIN
    #   - map the provider answer to pending / verified / rejected / failed
    #
    # This code is intentionally NOT written yet, so even with credentials we
    # must not pretend a check took place.
    # ------------------------------------------------------------------------
    return {
        "verification_provider": PROVIDER_NOT_CONFIGURED,
        "status": "pending",
        "rejection_reason": None,
        "message": (
            "Verification provider credentials found, but the integration is "
            "not implemented yet. The request was saved as pending."
        ),
    }


def build_result_update(status: str, rejection_reason: str | None) -> dict:
    """Turn a provider callback into the MongoDB fields to update."""
    update = {
        "status": status,
        # Records when the check finished (verified, rejected or failed).
        "verified_at": datetime.now(timezone.utc),
        "rejection_reason": None,
    }
    if status in ("rejected", "failed"):
        update["rejection_reason"] = rejection_reason
    return update
