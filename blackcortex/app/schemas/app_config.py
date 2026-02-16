from datetime import datetime

from pydantic import BaseModel, Field


class AppConfigCreate(BaseModel):
    key: str = Field(max_length=100)
    value: dict
    description: str | None = Field(None, max_length=500)


class AppConfigUpdate(BaseModel):
    value: dict | None = None
    description: str | None = Field(None, max_length=500)


class AppConfigResponse(BaseModel):
    id: str
    key: str
    value: dict
    description: str | None = None
    updated_by: str
    created_at: datetime
    updated_at: datetime
