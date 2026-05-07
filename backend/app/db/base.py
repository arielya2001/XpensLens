from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Import models so metadata is populated for table creation.
from app.models.expense import Expense  # noqa: F401,E402
from app.models.user import User  # noqa: F401,E402
