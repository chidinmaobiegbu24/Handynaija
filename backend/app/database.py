import os
import sys
import urllib.parse

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import PyMongoError

load_dotenv()

DEFAULT_MONGODB_URI = "mongodb://localhost:27017"
DEFAULT_MONGODB_DB = "handynaija"
DEFAULT_ENVIRONMENT = "development"
PRODUCTION_ENVIRONMENTS = {"production", "prod"}
TRUTHY_VALUES = {"1", "true", "yes", "on"}
SERVER_SELECTION_TIMEOUT_MS = 5000

_client: MongoClient | None = None


def get_environment() -> str:
    """Return the environment name ("development" by default).

    Render sets RENDER=true on deployed services, so a service that does not
    set ENVIRONMENT explicitly is still treated as production there.
    """
    name = os.getenv("ENVIRONMENT", "").strip().lower()
    if name:
        return name
    if os.getenv("RENDER", "").strip().lower() in TRUTHY_VALUES:
        return "production"
    return DEFAULT_ENVIRONMENT


def is_production() -> bool:
    return get_environment() in PRODUCTION_ENVIRONMENTS


def get_mongodb_uri() -> str:
    """Return the MongoDB connection string from the environment.

    MONGODB_URI always wins. In production a missing value is a hard error so
    the service never quietly falls back to a local database, while local
    development keeps the convenient localhost default.
    """
    uri = os.getenv("MONGODB_URI", "").strip()
    if uri:
        return uri
    if is_production():
        raise RuntimeError(
            "MONGODB_URI is not set. Configure the MONGODB_URI environment "
            "variable with your MongoDB connection string before starting in "
            "production."
        )
    return DEFAULT_MONGODB_URI


def redact_mongodb_uri(uri: str) -> str:
    """Return a log-safe version of a MongoDB URI with credentials removed.

    Never log the raw URI: connection strings embed usernames and passwords.
    """
    if not uri:
        return "<not configured>"
    try:
        parsed = urllib.parse.urlsplit(uri)
    except ValueError:
        return "<redacted>"
    host = parsed.hostname or ""
    if parsed.port:
        host = f"{host}:{parsed.port}"
    scheme = parsed.scheme or "mongodb"
    return f"{scheme}://{host}" if host else scheme


def describe_mongodb_target() -> str:
    """A safe, credential-free description of the configured MongoDB target."""
    return redact_mongodb_uri(os.getenv("MONGODB_URI", "").strip())


def get_mongodb_db() -> str:
    db_name = os.getenv("MONGODB_DB", "").strip()
    return db_name or DEFAULT_MONGODB_DB


def connect_to_mongo() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(
            get_mongodb_uri(),
            serverSelectionTimeoutMS=SERVER_SELECTION_TIMEOUT_MS,
        )
    return _client


def get_database():
    return connect_to_mongo()[get_mongodb_db()]


def ping_mongo() -> bool:
    try:
        connect_to_mongo().admin.command("ping")
        return True
    except PyMongoError:
        return False


def close_mongo_connection() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None


def test_mongo_connection() -> bool:
    print(f"MongoDB URI : {describe_mongodb_target()}")
    print(f"Database    : {get_mongodb_db()}")
    try:
        connect_to_mongo().admin.command("ping")
    except (PyMongoError, RuntimeError) as exc:
        print(f"FAILED      : {exc.__class__.__name__}")
        return False
    print("SUCCESS     : MongoDB connection verified")
    return True


if __name__ == "__main__":
    ok = test_mongo_connection()
    close_mongo_connection()
    sys.exit(0 if ok else 1)
