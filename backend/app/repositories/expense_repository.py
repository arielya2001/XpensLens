from uuid import UUID

from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.schemas.expense import ExpenseCreateRequest


class ExpenseRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def create(self, payload: ExpenseCreateRequest) -> Expense:
        expense = Expense(
            total_amount=payload.total_amount,
            currency=payload.currency,
            purchase_date=payload.purchase_date,
            merchant_name=payload.merchant_name,
            category=payload.category.value,
        )
        self._db.add(expense)
        self._db.commit()
        self._db.refresh(expense)
        return expense

    def get_by_id(self, expense_id: UUID) -> Expense | None:
        return self._db.query(Expense).filter(Expense.id == expense_id).first()

    def get_all(self) -> list[Expense]:
        return self._db.query(Expense).all()

    def delete(self, expense_id: UUID) -> bool:
        expense = self.get_by_id(expense_id)
        if expense:
            self._db.delete(expense)
            self._db.commit()
            return True
        return False

    def update(self, expense_id: UUID, payload: ExpenseCreateRequest) -> Expense | None:
        expense = self.get_by_id(expense_id)
        if not expense:
            return None
        expense.total_amount = payload.total_amount
        expense.currency = payload.currency
        expense.purchase_date = payload.purchase_date
        expense.merchant_name = payload.merchant_name
        expense.category = payload.category.value
        self._db.commit()
        self._db.refresh(expense)
        return expense
