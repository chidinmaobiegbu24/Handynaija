"""Pydantic schemas: they check incoming data before it reaches MongoDB."""

from datetime import datetime

from pydantic import BaseModel, Field

# Simple format checks written as regular expressions.
EMAIL_PATTERN = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"
PHONE_PATTERN = r"^\+?[\d\s\-()]{7,20}$"

# Sample data shown in the Swagger docs at /docs.
PROVIDER_EXAMPLE = {
    "full_name": "Chidi Okafor",
    "phone": "08031234567",
    "email": "chidi@example.com",
    "service_category": "Plumber",
    "skills": ["Pipe repair", "Leak fixing"],
    "description": "Reliable plumber with 6 years of experience.",
    "location": "Port Harcourt",
    "state": "Rivers",
    "years_of_experience": 6,
    "price": 5000,
    "availability": "Available",
    "profile_image": "",
}


class ServiceProviderBase(BaseModel):
    """The provider fields shared by create requests and responses."""

    full_name: str = Field(..., min_length=2, max_length=120)
    phone: str = Field(..., pattern=PHONE_PATTERN, examples=["08031234567"])
    email: str = Field(..., pattern=EMAIL_PATTERN, examples=["chidi@example.com"])
    service_category: str = Field(..., min_length=2, max_length=80, examples=["Plumber"])
    skills: list[str] = Field(default_factory=list, description="Short list of skills")
    description: str = Field(default="", max_length=2000)
    location: str = Field(..., min_length=2, max_length=120, examples=["Port Harcourt"])
    state: str = Field(..., min_length=2, max_length=80, examples=["Rivers"])
    years_of_experience: int = Field(default=0, ge=0, le=100)
    price: float = Field(default=0.0, ge=0, description="Price in Naira")
    availability: str = Field(default="Available", max_length=50)
    profile_image: str = Field(default="", max_length=500)

    model_config = {"json_schema_extra": {"example": PROVIDER_EXAMPLE}}


class ServiceProviderCreate(ServiceProviderBase):
    """Data sent when registering a new service provider."""


class ServiceProviderUpdate(ServiceProviderBase):
    """Every field becomes optional on updates.

    Only the fields sent by the client are changed.
    """

    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    phone: str | None = Field(default=None, pattern=PHONE_PATTERN)
    email: str | None = Field(default=None, pattern=EMAIL_PATTERN)
    service_category: str | None = Field(default=None, min_length=2, max_length=80)
    location: str | None = Field(default=None, min_length=2, max_length=120)
    state: str | None = Field(default=None, min_length=2, max_length=80)


class ServiceProviderOut(ServiceProviderBase):
    """The provider data sent back to the client."""

    id: str = Field(..., description="MongoDB ObjectId returned as a string")
    created_at: datetime = Field(..., description="When the provider was registered")
