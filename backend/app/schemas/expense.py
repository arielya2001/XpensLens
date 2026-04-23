from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field


class ExpenseCategory(str, Enum):
    TRAVEL = "travel"
    MEALS = "meals"
    OFFICE_SUPPLIES = "office_supplies"


class ExpenseStatus(str, Enum):
    APPROVED = "approved"
    REJECTED = "rejected"
    FLAGGED = "flagged"
    PENDING = "pending"


class ExpenseCreateRequest(BaseModel):
    total_amount: Decimal = Field(..., gt=0)
    currency: str = Field(..., min_length=3, max_length=3)
    purchase_date: date
    merchant_name: str = Field(..., min_length=1, max_length=255)
    category: ExpenseCategory


class ExpenseResponse(BaseModel):
    id: UUID
    total_amount: Decimal
    currency: str
    purchase_date: date
    merchant_name: str
    category: ExpenseCategory
    status: ExpenseStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
