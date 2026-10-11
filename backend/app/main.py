import logging
import os
from contextlib import asynccontextmanager

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.database import (
    close_mongo_connection,
    connect_to_mongo,
    describe_mongodb_target,
    get_environment,
    get_mongodb_db,
    is_production,
    ping_mongo,
)
from app.routes.customers import router as customers_router
from app.routes.nin_verification import (
    nin_validation_error_handler,
    router as nin_verification_router,
)
from app.routes.profile_pictures import router as profile_pictures_router
from app.routes.service_providers import router as service_providers_router

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("handynaija")

APP_NAME = "HandyNaija"
API_PREFIX = "/api"
DEFAULT_PORT = 8000

DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]


def get_cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "")
    if not raw.strip():
        return DEFAULT_CORS_ORIGINS
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


@asynccontextmanager
async def lifespan(application: FastAPI):
    logger.info("Starting %s in %s mode", APP_NAME, get_environment())
    try:
        connect_to_mongo()
        reachable = ping_mongo()
    except RuntimeError:
        reachable = False

    if reachable:
        logger.info("MongoDB connected successfully (db=%s)", get_mongodb_db())
    else:
        # describe_mongodb_target() is credential-free, so this is safe to log.
        target = describe_mongodb_target()
        if is_production():
            logger.error(
                "MongoDB is not reachable at %s (db=%s). Production requires a "
                "working database, so startup is aborted. Verify that "
                "MONGODB_URI is set correctly in the service environment.",
                target,
                get_mongodb_db(),
            )
            close_mongo_connection()
            raise RuntimeError("MongoDB is not reachable in production")
        logger.warning(
            "MongoDB is not reachable at %s (db=%s) - continuing without a "
            "database (development mode).",
            target,
            get_mongodb_db(),
        )
    yield
    close_mongo_connection()
    logger.info("MongoDB connection closed")


app = FastAPI(
    title=f"{APP_NAME} API",
    version="0.1.0",
    description="HandyNaija backend API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service Provider (Artisan) routes: /api/providers
app.include_router(service_providers_router)

# Customer routes: /api/customers
app.include_router(customers_router)

# Profile picture upload/remove routes: /api/profile-pictures
app.include_router(profile_pictures_router)

# NIN verification routes: /api/nin-verification
app.include_router(nin_verification_router)

# Never echo the raw NIN back inside a validation error response.
app.add_exception_handler(RequestValidationError, nin_validation_error_handler)


@app.get(f"{API_PREFIX}/health")
def health() -> dict:
    return {
        "success": True,
        "message": "HandyNaija backend is running",
    }


@app.get("/")
def root() -> dict:
    return {
        "success": True,
        "message": f"{APP_NAME} API root. Use {API_PREFIX}/health",
    }


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", DEFAULT_PORT)),
        reload=bool(os.getenv("RELOAD", "true").lower() in ("1", "true", "yes")),
    )
