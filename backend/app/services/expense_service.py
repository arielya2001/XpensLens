from uuid import UUID

from app.repositories.expense_repository import ExpenseRepository
from app.schemas.expense import ExpenseCreateRequest, ExpenseResponse


class ExpenseService:
    def __init__(self, repository: ExpenseRepository) -> None:
        self._repository = repository

    def create_expense(self, payload: ExpenseCreateRequest) -> ExpenseResponse:
        expense = self._repository.create(payload)
        return ExpenseResponse.model_validate(expense)

    def get_expense(self, expense_id: UUID) -> ExpenseResponse:
        expense = self._repository.get_by_id(expense_id)
        if expense is None:
            raise ValueError("Expense not found")
        return ExpenseResponse.model_validate(expense)
