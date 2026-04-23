from uuid import UUID

from app.repositories.expense_repository import ExpenseRepository
from app.schemas.expense import ExpenseCreateRequest, ExpenseResponse


class ExpenseService:
    def __init__(self, repository: ExpenseRepository) -> None:
        self._repository = repository

    def create_expense(self, payload: ExpenseCreateRequest) -> ExpenseResponse:
        # TODO: add validation, AI extraction enrichment, and policy checks.
        raise NotImplementedError

    def get_expense(self, expense_id: UUID) -> ExpenseResponse:
        # TODO: fetch expense and map domain errors to API errors.
        raise NotImplementedError
