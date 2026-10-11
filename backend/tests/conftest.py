"""Shared test fixtures.

All tests run against an in-memory fake MongoDB (mongomock), so no real
MongoDB process, no real data and no real NIN are every touched.

These are dummy values used only inside tests.
"""

import os

# Force a dedicated test database and the "provider not configured" state,
# regardless of any local .env file. The app imports must come after this.
os.environ["MONGODB_DB"] = "handynaija_test"
os.environ["MONGODB_URI"] = "mongodb://localhost:27017"
os.environ["NIN_VERIFICATION_API_KEY"] = ""
os.environ["NIN_VERIFICATION_API_URL"] = ""
os.environ["NIN_WEBHOOK_SECRET"] = ""

import mongomock
import pytest
from fastapi.testclient import TestClient

import app.database as database
import app.main as main
import app.models.nin_verification as nin_model
import app.models.service_provider as provider_model
from app.models.nin_verification import get_nin_collection
from app.models.service_provider import get_provider_collection

DUMMY_NIN = "12345678901"
MASKED_DUMMY_NIN = "*******8901"
NONEXISTENT_PROVIDER_ID = "000000000000000000000000"


@pytest.fixture(scope="session")
def client():
    """A FastAPI TestClient whose database calls go to mongomock."""
    mock_client = mongomock.MongoClient()
    db = mock_client["handynaija_test"]

    originals = {
        "database.connect_to_mongo": database.connect_to_mongo,
        "main.connect_to_mongo": main.connect_to_mongo,
        "main.ping_mongo": main.ping_mongo,
        "nin.get_database": nin_model.get_database,
        "provider.get_database": provider_model.get_database,
    }

    try:
        database.connect_to_mongo = lambda: mock_client
        main.connect_to_mongo = lambda: mock_client
        main.ping_mongo = lambda: True
        nin_model.get_database = lambda: db
        provider_model.get_database = lambda: db

        with TestClient(main.app) as test_client:
            yield test_client
    finally:
        for module, value in originals.items():
            namespace, name = module.split(".")
            targets = {
                "database": database,
                "main": main,
                "nin": nin_model,
                "provider": provider_model,
            }
            targets[namespace].__dict__[name] = value


@pytest.fixture(autouse=True)
def clean_mock_db():
    """Start and finish every test with empty collections."""
    get_nin_collection().delete_many({})
    get_provider_collection().delete_many({})
    yield
    get_nin_collection().delete_many({})
    get_provider_collection().delete_many({})


def create_provider(client: TestClient) -> str:
    """Register a dummy service provider through the real API and return its id."""
    payload = {
        "full_name": "Test Artisan",
        "phone": "08012345678",
        "email": "artisan@example.com",
        "service_category": "Electrician",
        "skills": ["Wiring", "Installation"],
        "description": "Dummy provider used only by automated tests.",
        "location": "Lagos",
        "state": "Lagos",
        "years_of_experience": 5,
        "price": 5000.0,
        "availability": "Available",
        "profile_image": "",
    }
    response = client.post("/api/providers", json=payload)
    assert response.status_code == 201, response.text
    return response.json()["id"]


@pytest.fixture
def new_provider(client):
    """Callable fixture that registers a dummy provider and returns its id."""

    def _register() -> str:
        return create_provider(client)

    return _register


@pytest.fixture
def submit_verification(client, new_provider):
    """Callable fixture: register a dummy provider and submit a verification.

    Returns (provider_id, response). Pass nin to override the default dummy.
    """

    def _submit(nin: str = DUMMY_NIN):
        provider_id = new_provider()
        response = client.post(
            "/api/nin-verification",
            json={"provider_id": provider_id, "nin": nin},
        )
        return provider_id, response

    return _submit