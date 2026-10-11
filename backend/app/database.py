import os
import sys

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import PyMongoError

load_dotenv()

DEFAULT_MONGODB_URI = "mongodb://localhost:27017"
DEFAULT_MONGODB_DB = "handynaija"
SERVER_SELECTION_TIMEOUT_MS = 5000

_client: MongoClient | None = None


def get_mongodb_uri() -> str:
    uri = os.getenv("MONGODB_URI", "").strip()
    return uri or DEFAULT_MONGODB_URI


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
    print(f"MongoDB URI : {get_mongodb_uri()}")
    print(f"Database    : {get_mongodb_db()}")
    try:
        connect_to_mongo().admin.command("ping")
    except PyMongoError as exc:
        print(f"FAILED      : {exc}")
        return False
    print("SUCCESS     : MongoDB connection verified")
    return True


if __name__ == "__main__":
    ok = test_mongo_connection()
    close_mongo_connection()
    sys.exit(0 if ok else 1)
