from uuid import UUID

from app.core.security import hash_password, verify_password
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository


class AuthService:
    def __init__(self, user_repository: UserRepository) -> None:
        self._user_repository = user_repository

    def register_user(
        self,
        *,
        name: str,
        email: str,
        password: str,
        role: UserRole = UserRole.EMPLOYEE,
        department: str | None = None,
    ) -> User:
        existing_user = self._user_repository.get_by_email(email)
        if existing_user is not None:
            raise ValueError("User with this email already exists.")

        hashed_password = hash_password(password)
        return self._user_repository.create(
            name=name,
            email=email,
            password_hash=hashed_password,
            role=role,
            department=department,
        )

    def authenticate_user(self, *, email: str, password: str) -> User:
        user = self._user_repository.get_by_email(email)
        if user is None:
            raise ValueError("Invalid credentials.")

        if not verify_password(password, user.password_hash):
            raise ValueError("Invalid credentials.")

        return user

    def issue_access_token(self, user: User) -> str:
        # TODO: replace with signed JWT tokens.
        return f"dev-token-{user.id}"

    def get_user_from_token(self, token: str) -> User:
        prefix = "dev-token-"
        if not token.startswith(prefix):
            raise ValueError("Invalid token.")

        user_id_raw = token.removeprefix(prefix)
        try:
            user_id = UUID(user_id_raw)
        except ValueError as exc:
            raise ValueError("Invalid token.") from exc

        return self.get_current_user(user_id)

    def get_current_user(self, user_id: UUID) -> User:
        user = self._user_repository.get_by_id(user_id)
        if user is None:
            raise ValueError("User not found.")
        return user
