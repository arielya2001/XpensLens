from uuid import UUID

from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.schemas.expense import ExpenseCreateRequest


class ExpenseRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def create(self, payload: ExpenseCreateRequest) -> Expense:
        # TODO: implement persistence logic.
        raise NotImplementedError

    def get_by_id(self, expense_id: UUID) -> Expense | None:
        # TODO: implement lookup logic.
        raise NotImplementedError
