from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories.expense_repository import ExpenseRepository
from app.schemas.expense import ExpenseCreateRequest, ExpenseResponse
from app.services.expense_service import ExpenseService

router = APIRouter(prefix="/expenses", tags=["expenses"])


def get_expense_service(db: Session = Depends(get_db)) -> ExpenseService:
    return ExpenseService(repository=ExpenseRepository(db))


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    payload: ExpenseCreateRequest,
    service: ExpenseService = Depends(get_expense_service),
) -> ExpenseResponse:
    try:
        return service.create_expense(payload)
    except NotImplementedError as exc:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Expense creation logic is not implemented yet.",
        ) from exc


@router.get("/{expense_id}", response_model=ExpenseResponse, status_code=status.HTTP_200_OK)
def get_expense(
    expense_id: UUID,
    service: ExpenseService = Depends(get_expense_service),
) -> ExpenseResponse:
    try:
        return service.get_expense(expense_id)
    except NotImplementedError as exc:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Expense retrieval logic is not implemented yet.",
        ) from exc
