"""Automated contract tests for the profile picture API.

The upload/remove endpoints never touch a real image service: Cloudinary is
stubbed at the image_storage service layer. These tests assert the security
and storage contracts the frontend depends on:

- a caller must prove ownership with X-Profile-Token (401/403 otherwise)
- the ownership token is never exposed outside the create responses
- image metadata is saved to the correct customer/provider Mongo record
- replacing a picture deletes the previous Cloudinary asset
- storage failures and misconfiguration fail safely with clear errors
"""

import pytest

from app.routes.profile_pictures import PROFILE_IMAGE_FIELDS
from app.services import image_storage

from conftest import create_customer_with_token, create_provider_with_token

IMAGE_BYTES = b"\x89PNG\r\n\x1a\n not-a-real-image-but-stubbed-anyway"

MOCK_STORAGE = {
    "profile_image": "https://res.cloudinary.com/handynaija/demo.png",
    "profile_image_public_id": "handynaija/profile-pictures/provider-1",
    "profile_image_width": 240,
    "profile_image_height": 240,
    "profile_image_format": "png",
    "profile_image_bytes": len(IMAGE_BYTES),
}


def _fake_upload_factory():
    """Return a (fake_upload, calls) pair producing fresh metadata each call."""
    calls = []

    def fake_upload(data, content_type, owner_type, owner_id):
        entry = dict(MOCK_STORAGE)
        entry["profile_image_public_id"] = f"handynaija/{owner_type}-{owner_id}-{len(calls)}"
        entry["profile_image"] = f"https://res.cloudinary.com/handynaija/{len(calls)}.png"
        entry["profile_image_bytes"] = len(data)
        calls.append((data, content_type, owner_type, owner_id))
        return entry

    return fake_upload, calls


@pytest.fixture
def storage_configured(monkeypatch):
    """Stub Cloudinary so uploads behave like a working service."""
    fake_upload, calls = _fake_upload_factory()
    monkeypatch.setattr(image_storage, "is_configured", lambda: True)
    monkeypatch.setattr(image_storage, "upload_image", fake_upload)
    monkeypatch.setattr(image_storage, "delete_image", lambda public_id: True)
    monkeypatch.setattr(image_storage, "get_max_bytes", lambda: 5 * 1024 * 1024)
    return calls


# --------------------------------------------------------------------------- #
# Registration / health
# --------------------------------------------------------------------------- #


def test_profile_picture_endpoints_registered(client):
    paths = client.get("/openapi.json").json()["paths"]
    assert "/api/profile-pictures" in paths
    assert "post" in paths["/api/profile-pictures"]
    assert "delete" in paths["/api/profile-pictures"]
    assert "/api/customers" in paths


def test_create_customer_returns_token_once(client, new_customer):
    customer_id, token = new_customer()
    assert token and len(token) >= 20

    # Public read must never leak the ownership secret.
    public = client.get(f"/api/customers/{customer_id}").json()
    assert "profile_image_token" not in public
    assert public["full_name"] == "Test Customer"


def test_create_provider_returns_token_once(client):
    provider_id, token = create_provider_with_token(client)
    assert token and len(token) >= 20

    public = client.get(f"/api/providers/{provider_id}").json()
    assert "profile_image_token" not in public
    listing = client.get("/api/providers").json()
    assert "profile_image_token" not in listing[0]


def test_public_listings_never_include_ownership_tokens(client, new_customer):
    customer_id, _ = new_customer()
    response = client.get(f"/api/customers/{customer_id}")
    assert response.status_code == 200
    assert "profile_image_token" not in response.text


# --------------------------------------------------------------------------- #
# Authorization (ownership)
# --------------------------------------------------------------------------- #


def test_upload_without_token_returns_401(client, new_customer, storage_configured):
    customer_id, _ = new_customer()
    response = client.post(
        "/api/profile-pictures",
        data={"owner_type": "customer", "owner_id": customer_id},
        files={"file": ("photo.png", IMAGE_BYTES, "image/png")},
    )
    assert response.status_code == 401


def test_upload_with_wrong_token_returns_401(client, new_customer, storage_configured):
    customer_id, _ = new_customer()
    response = client.post(
        "/api/profile-pictures",
        data={"owner_type": "customer", "owner_id": customer_id},
        files={"file": ("photo.png", IMAGE_BYTES, "image/png")},
        headers={"X-Profile-Token": "not-the-token"},
    )
    assert response.status_code == 401


def test_upload_invalid_owner_type_returns_400(client, new_customer, storage_configured):
    customer_id, token = new_customer()
    response = client.post(
        "/api/profile-pictures",
        data={"owner_type": "admin", "owner_id": customer_id},
        files={"file": ("photo.png", IMAGE_BYTES, "image/png")},
        headers={"X-Profile-Token": token},
    )
    assert response.status_code == 400


def test_upload_invalid_owner_id_returns_400(client, new_customer, storage_configured):
    _, token = new_customer()
    response = client.post(
        "/api/profile-pictures",
        data={"owner_type": "customer", "owner_id": "not-an-id"},
        files={"file": ("photo.png", IMAGE_BYTES, "image/png")},
        headers={"X-Profile-Token": token},
    )
    assert response.status_code == 400


def test_upload_unknown_owner_returns_404(client, storage_configured):
    response = client.post(
        "/api/profile-pictures",
        data={"owner_type": "customer", "owner_id": "000000000000000000000000"},
        files={"file": ("photo.png", IMAGE_BYTES, "image/png")},
        headers={"X-Profile-Token": "anything"},
    )
    assert response.status_code == 404


def test_customer_cannot_upload_for_provider(client, new_customer, storage_configured):
    customer_id, token = new_customer()
    provider_id, _ = create_provider_with_token(client)
    response = client.post(
        "/api/profile-pictures",
        data={"owner_type": "provider", "owner_id": provider_id},
        files={"file": ("photo.png", IMAGE_BYTES, "image/png")},
        headers={"X-Profile-Token": token},
    )
    assert response.status_code == 401


# --------------------------------------------------------------------------- #
# Image validation and storage-failure handling
# --------------------------------------------------------------------------- #


def test_upload_invalid_image_returns_400(client, new_customer, storage_configured, monkeypatch):
    customer_id, token = new_customer()

    def bad_upload(data, content_type, owner_type, owner_id):
        raise image_storage.InvalidImageError("Unsupported image format. Allowed formats are: image/jpeg, image/png, image/webp.")

    monkeypatch.setattr(image_storage, "upload_image", bad_upload)
    response = client.post(
        "/api/profile-pictures",
        data={"owner_type": "customer", "owner_id": customer_id},
        files={"file": ("photo.png", IMAGE_BYTES, "image/png")},
        headers={"X-Profile-Token": token},
    )
    assert response.status_code == 400
    assert "Unsupported image format" in response.json()["detail"]


def test_upload_storage_unavailable_returns_502(client, new_customer, storage_configured, monkeypatch):
    customer_id, token = new_customer()

    def broken_upload(data, content_type, owner_type, owner_id):
        raise image_storage.ImageStorageError("We couldn't save your photo right now. Please try again in a moment.")

    monkeypatch.setattr(image_storage, "upload_image", broken_upload)
    response = client.post(
        "/api/profile-pictures",
        data={"owner_type": "customer", "owner_id": customer_id},
        files={"file": ("photo.png", IMAGE_BYTES, "image/png")},
        headers={"X-Profile-Token": token},
    )
    assert response.status_code == 502


def test_upload_not_configured_returns_503(client, new_customer, monkeypatch):
    customer_id, token = new_customer()
    monkeypatch.setattr(image_storage, "is_configured", lambda: False)

    response = client.post(
        "/api/profile-pictures",
        data={"owner_type": "customer", "owner_id": customer_id},
        files={"file": ("photo.png", IMAGE_BYTES, "image/png")},
        headers={"X-Profile-Token": token},
    )
    assert response.status_code == 503
    body = response.json()["detail"]
    assert "NOT CONFIGURED" in body["message"]
    assert body["storage_provider"] == "cloudinary"


# --------------------------------------------------------------------------- #
# Successful uploads and correct storage
# --------------------------------------------------------------------------- #


def test_customer_upload_saves_metadata_to_correct_record(client, new_customer, storage_configured):
    from bson import ObjectId

    from app.models.customer import get_customer_collection

    customer_id, token = new_customer()
    response = client.post(
        "/api/profile-pictures",
        data={"owner_type": "customer", "owner_id": customer_id},
        files={"file": ("photo.png", IMAGE_BYTES, "image/png")},
        headers={"X-Profile-Token": token},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["owner_id"] == customer_id
    assert body["profile"]["profile_image"] == body["profile_image"]

    record = get_customer_collection().find_one({"_id": ObjectId(customer_id)})
    assert record["profile_image"] == body["profile_image"]
    for field in PROFILE_IMAGE_FIELDS:
        assert field in record
    # The ownership token survives the update untouched.
    assert record["profile_image_token"] == token


def test_provider_upload_saves_metadata_to_correct_record(client, storage_configured):
    from app.models.service_provider import get_provider_collection

    from bson import ObjectId

    provider_id, token = create_provider_with_token(client)
    response = client.post(
        "/api/profile-pictures",
        data={"owner_type": "provider", "owner_id": provider_id},
        files={"file": ("photo.png", IMAGE_BYTES, "image/png")},
        headers={"X-Profile-Token": token},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["profile"]["profile_image"] == body["profile_image"]
    assert body["profile"]["profile_image_public_id"] == body["profile_image_public_id"]

    record = get_provider_collection().find_one({"_id": ObjectId(provider_id)})
    assert record["profile_image"] == body["profile_image"]
    assert record["profile_image_public_id"] == body["profile_image_public_id"]


def test_replacing_picture_deletes_previous_asset(client, new_customer, storage_configured, monkeypatch):
    customer_id, token = new_customer()
    deleted = []
    monkeypatch.setattr(image_storage, "delete_image", lambda public_id: deleted.append(public_id) or True)

    first = client.post(
        "/api/profile-pictures",
        data={"owner_type": "customer", "owner_id": customer_id},
        files={"file": ("one.png", IMAGE_BYTES, "image/png")},
        headers={"X-Profile-Token": token},
    )
    assert first.status_code == 200
    first_public_id = first.json()["profile_image_public_id"]

    second = client.post(
        "/api/profile-pictures",
        data={"owner_type": "customer", "owner_id": customer_id},
        files={"file": ("two.png", IMAGE_BYTES, "image/png")},
        headers={"X-Profile-Token": token},
    )
    assert second.status_code == 200
    second_public_id = second.json()["profile_image_public_id"]
    assert first_public_id != second_public_id

    # The old asset was cleaned up exactly once.
    assert first_public_id in deleted
    assert second_public_id not in deleted


def test_upload_too_large_is_rejected_by_validator(client, new_customer, monkeypatch):
    customer_id, token = new_customer()
    monkeypatch.setattr(image_storage, "get_max_bytes", lambda: 10)
    monkeypatch.setattr(image_storage, "is_configured", lambda: True)

    # The real upload_image validates before touching Cloudinary, so a payload
    # over the (tiny) limit must be rejected as 400.
    response = client.post(
        "/api/profile-pictures",
        data={"owner_type": "customer", "owner_id": customer_id},
        files={"file": ("photo.png", b"\x89PNG\r\n\x1a\n" + b"x" * 200, "image/png")},
        headers={"X-Profile-Token": token},
    )
    assert response.status_code == 400
    assert "too large" in response.json()["detail"].lower()


# --------------------------------------------------------------------------- #
# Removal
# --------------------------------------------------------------------------- #


def test_remove_clears_record_and_deletes_asset(client, new_customer, storage_configured, monkeypatch):
    from app.models.customer import get_customer_collection

    from bson import ObjectId

    customer_id, token = new_customer()
    upload = client.post(
        "/api/profile-pictures",
        data={"owner_type": "customer", "owner_id": customer_id},
        files={"file": ("photo.png", IMAGE_BYTES, "image/png")},
        headers={"X-Profile-Token": token},
    )
    stored_public_id = upload.json()["profile_image_public_id"]

    deleted = []
    monkeypatch.setattr(image_storage, "delete_image", lambda public_id: deleted.append(public_id) or True)

    response = client.delete(
        "/api/profile-pictures",
        params={"owner_type": "customer", "owner_id": customer_id},
        headers={"X-Profile-Token": token},
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Profile picture removed"

    record = get_customer_collection().find_one({"_id": ObjectId(customer_id)})
    assert record["profile_image"] == ""
    assert "profile_image_public_id" not in record
    assert stored_public_id in deleted


def test_remove_works_even_when_storage_not_configured(client, new_customer, storage_configured, monkeypatch):
    customer_id, token = new_customer()
    monkeypatch.setattr(image_storage, "is_configured", lambda: False)
    monkeypatch.setattr(image_storage, "delete_image", lambda public_id: False)

    response = client.delete(
        "/api/profile-pictures",
        params={"owner_type": "customer", "owner_id": customer_id},
        headers={"X-Profile-Token": token},
    )
    assert response.status_code == 200


def test_remove_without_token_returns_401(client, new_customer, storage_configured):
    customer_id, _ = new_customer()
    response = client.delete(
        "/api/profile-pictures",
        params={"owner_type": "customer", "owner_id": customer_id},
    )
    assert response.status_code == 401