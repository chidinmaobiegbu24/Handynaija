"""Pydantic schemas for customers: they check incoming data before it reaches MongoDB."""

from datetime import datetime

from pydantic import BaseModel, Field

# Simple format checks written as regular expressions.
EMAIL_PATTERN = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"
PHONE_PATTERN = r"^\+?[\d\s\-()]{7,20}$"

# Sample data shown in the Swagger docs at /docs.
CUSTOMER_EXAMPLE = {
    "full_name": "Ada Obi",
    "phone": "08031234567",
    "email": "ada@example.com",
    "location": "Ikeja",
    "state": "Lagos",
    "profile_image": "",
}


class CustomerBase(BaseModel):
    """The customer fields shared by create requests and responses."""

    full_name: str = Field(..., min_length=2, max_length=120)
    phone: str = Field(..., pattern=PHONE_PATTERN, examples=["08031234567"])
    email: str = Field(..., pattern=EMAIL_PATTERN, examples=["ada@example.com"])
    location: str = Field(default="", max_length=120, examples=["Ikeja"])
    state: str = Field(default="", max_length=80, examples=["Lagos"])
    profile_image: str = Field(default="", max_length=500)

    model_config = {"json_schema_extra": {"example": CUSTOMER_EXAMPLE}}


class CustomerCreate(CustomerBase):
    """Data sent when registering a new customer."""


class CustomerOut(CustomerBase):
    """The customer data sent back to the client."""

    id: str = Field(..., description="MongoDB ObjectId returned as a string")
    created_at: datetime = Field(..., description="When the customer was registered")


class CustomerCreated(CustomerOut):
    """The create response: the normal customer data plus the ownership token.

    The token is shown exactly once (right after registration) so the client
    can prove it owns this customer record later, e.g. when uploading a
    profile picture. It is stored server-side but never serialized again.
    """

    profile_image_token: str = Field(
        ..., description="One-time ownership secret for this customer record"
    )