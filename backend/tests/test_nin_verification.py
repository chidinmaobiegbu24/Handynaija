"""Automated contract tests for the NIN verification API.

These tests exercise the exact endpoints the frontend calls
(POST /api/nin-verification, GET /api/nin-verification/{reference},
GET /api/providers/{provider_id}/nin-verification) plus the webhook.

Security invariants asserted here:
- the raw NIN is never returned in any response
- the raw NIN is never stored in MongoDB
- a provider is never reported as verified while no authorized
  verification provider is configured (status stays pending)
"""

import json

import pytest

from app.models.nin_verification import NIN_RECORD_FIELDS, get_nin_collection
from app.schemas.nin_verification import NINVerificationCreate
from app.services.nin_verification import (
    PROVIDER_NOT_CONFIGURED,
    build_result_update,
    mask_nin,
)

from conftest import DUMMY_NIN, MASKED_DUMMY_NIN, NONEXISTENT_PROVIDER_ID

WEBHOOK_SECRET = "test-only-secret"


# --------------------------------------------------------------------------- #
# Registration / health
# --------------------------------------------------------------------------- #


def test_health_endpoint_preserved(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert "running" in body["message"]


def test_nin_endpoints_registered(client):
    paths = set(client.get("/openapi.json").json()["paths"])
    assert {
        "/api/nin-verification",
        "/api/nin-verification/{verification_reference}",
        "/api/providers/{provider_id}/nin-verification",
        "/api/nin-verification/{verification_reference}/webhook",
        "/api/health",
    }.issubset(paths)


# --------------------------------------------------------------------------- #
# Input validation (never touches MongoDB)
# --------------------------------------------------------------------------- #


def test_create_missing_fields_returns_422(client):
    response = client.post("/api/nin-verification", json={})
    assert response.status_code == 422


def test_create_invalid_provider_id_returns_400(client):
    response = client.post(
        "/api/nin-verification",
        json={"provider_id": "not-an-id", "nin": DUMMY_NIN},
    )
    assert response.status_code == 400
    assert "Invalid provider id" in response.json()["detail"]


def test_create_invalid_nin_422_never_echoes_raw_nin(client):
    bad_nin = "ABC12345678"
    response = client.post(
        "/api/nin-verification",
        json={"provider_id": NONEXISTENT_PROVIDER_ID, "nin": bad_nin},
    )
    assert response.status_code == 422
    assert bad_nin not in response.text


def test_create_unknown_provider_returns_404(client):
    response = client.post(
        "/api/nin-verification",
        json={"provider_id": NONEXISTENT_PROVIDER_ID, "nin": DUMMY_NIN},
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Provider not found"


# --------------------------------------------------------------------------- #
# Creating a verification request
# --------------------------------------------------------------------------- #


def test_create_verification_returns_pending(client, submit_verification):
    provider_id, response = submit_verification()
    assert response.status_code == 201
    body = response.json()
    assert body["success"] is True
    assert body["message"] == "NIN verification request submitted"
    assert body["verification_reference"].startswith("NIN-")
    assert body["status"] == "pending"
    assert "nin" not in body
    assert DUMMY_NIN not in json.dumps(body)


def test_create_duplicate_pending_returns_409(client, submit_verification):
    provider_id, first = submit_verification()
    assert first.status_code == 201

    second = client.post(
        "/api/nin-verification",
        json={"provider_id": provider_id, "nin": DUMMY_NIN},
    )
    assert second.status_code == 409
    detail = second.json()["detail"]
    assert "A pending NIN verification already exists" in detail["message"]
    assert detail["verification_reference"] == first.json()["verification_reference"]


# --------------------------------------------------------------------------- #
# Reading status (never the raw NIN)
# --------------------------------------------------------------------------- #


def test_get_verification_by_reference_returns_masked_nin_only(client, submit_verification):
    provider_id, created = submit_verification()
    reference = created.json()["verification_reference"]

    response = client.get(f"/api/nin-verification/{reference}")
    assert response.status_code == 200
    body = response.json()
    assert body["verification_reference"] == reference
    assert body["status"] == "pending"
    assert body["provider_id"] == provider_id
    assert body["masked_nin"] == MASKED_DUMMY_NIN
    assert body["verification_provider"] == PROVIDER_NOT_CONFIGURED
    assert DUMMY_NIN not in response.text


def test_get_verification_unknown_reference_returns_404(client):
    response = client.get("/api/nin-verification/NIN-NOPE-000")
    assert response.status_code == 404


def test_get_provider_status_invalid_id_returns_400(client):
    response = client.get("/api/providers/not-an-id/nin-verification")
    assert response.status_code == 400


def test_get_provider_status_no_record_returns_404(client):
    response = client.get(f"/api/providers/{NONEXISTENT_PROVIDER_ID}/nin-verification")
    assert response.status_code == 404


def test_get_provider_status_pending_and_never_verified(client, submit_verification):
    provider_id, _ = submit_verification()

    response = client.get(f"/api/providers/{provider_id}/nin-verification")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "pending"
    assert body["verification_provider"] == PROVIDER_NOT_CONFIGURED
    assert body["verified_at"] is None
    assert DUMMY_NIN not in response.text


# --------------------------------------------------------------------------- #
# Storage: the raw NIN never reaches MongoDB
# --------------------------------------------------------------------------- #


def test_stored_record_has_no_raw_nin(client, submit_verification):
    provider_id, created = submit_verification()
    reference = created.json()["verification_reference"]

    record = get_nin_collection().find_one({"verification_reference": reference})
    assert record is not None
    assert "nin" not in record
    assert record["masked_nin"] == MASKED_DUMMY_NIN
    assert DUMMY_NIN not in list(record.values())
    assert record["provider_id"] == provider_id


# --------------------------------------------------------------------------- #
# Webhook (authorized provider callback)
# --------------------------------------------------------------------------- #


def test_webhook_disabled_503_when_provider_not_configured(client):
    response = client.post(
        f"/api/nin-verification/NIN-WH/webhook",
        json={"status": "verified"},
    )
    assert response.status_code == 503
    detail = response.json()["detail"]
    assert "NOT CONFIGURED" in detail["message"]
    assert detail["verification_provider"] == PROVIDER_NOT_CONFIGURED


def test_webhook_rejects_invalid_secret_401(client, monkeypatch):
    monkeypatch.setattr("app.routes.nin_verification.get_webhook_secret", lambda: WEBHOOK_SECRET)
    response = client.post(
        "/api/nin-verification/NIN-WH/webhook",
        json={"status": "verified"},
        headers={"X-Webhook-Secret": "wrong-secret"},
    )
    assert response.status_code == 401


def test_webhook_forbids_sending_a_nin_422(client):
    response = client.post(
        "/api/nin-verification/NIN-WH/webhook",
        json={"status": "verified", "nin": DUMMY_NIN},
    )
    assert response.status_code == 422


def test_webhook_rejected_requires_reason_422(client):
    response = client.post(
        "/api/nin-verification/NIN-WH/webhook",
        json={"status": "rejected"},
    )
    assert response.status_code == 422


def test_webhook_updates_to_verified_only_with_configured_provider(client, submit_verification, monkeypatch):
    monkeypatch.setattr("app.routes.nin_verification.get_webhook_secret", lambda: WEBHOOK_SECRET)
    provider_id, created = submit_verification()
    reference = created.json()["verification_reference"]

    response = client.post(
        f"/api/nin-verification/{reference}/webhook",
        json={"status": "verified"},
        headers={"X-Webhook-Secret": WEBHOOK_SECRET},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "verified"
    assert body["verified_at"] is not None
    assert body["rejection_reason"] is None
    assert DUMMY_NIN not in response.text

    # A verified provider cannot create another request.
    again = client.post(
        "/api/nin-verification",
        json={"provider_id": provider_id, "nin": DUMMY_NIN},
    )
    assert again.status_code == 409
    assert "already verified" in again.json()["detail"]["message"]


def test_webhook_rejected_sets_reason(client, submit_verification, monkeypatch):
    monkeypatch.setattr("app.routes.nin_verification.get_webhook_secret", lambda: WEBHOOK_SECRET)
    _, created = submit_verification()
    reference = created.json()["verification_reference"]

    response = client.post(
        f"/api/nin-verification/{reference}/webhook",
        json={"status": "rejected", "rejection_reason": "Name mismatch for the dummy NIN."},
        headers={"X-Webhook-Secret": WEBHOOK_SECRET},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "rejected"
    assert body["rejection_reason"] == "Name mismatch for the dummy NIN."


# --------------------------------------------------------------------------- #
# Pure helpers (no HTTP, no database)
# --------------------------------------------------------------------------- #


def test_mask_nin_keeps_only_last_four():
    assert mask_nin(DUMMY_NIN) == MASKED_DUMMY_NIN
    assert mask_nin("1234") == "****"
    assert mask_nin("12") == "**"


def test_model_fields_never_include_a_nin_column():
    assert "nin" not in NIN_RECORD_FIELDS


def test_create_schema_strips_spaces_and_dashes():
    model = NINVerificationCreate(provider_id="x", nin="1234 567-8901")
    assert model.nin == DUMMY_NIN


def test_build_result_update_clears_reason_on_verified():
    update = build_result_update("verified", "stale reason")
    assert update["status"] == "verified"
    assert update["rejection_reason"] is None
    assert "verified_at" in update


def test_build_result_update_keeps_reason_when_rejected():
    update = build_result_update("rejected", "why not")
    assert update["status"] == "rejected"
    assert update["rejection_reason"] == "why not"