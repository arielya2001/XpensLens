import hashlib
import hmac
import os
from base64 import b64decode, b64encode

PBKDF2_ALGORITHM = "sha256"
PBKDF2_ITERATIONS = 600_000
SALT_BYTES = 16


def hash_password(password: str) -> str:
    if not password:
        raise ValueError("Password is required.")

    salt = os.urandom(SALT_BYTES)
    derived_key = hashlib.pbkdf2_hmac(
        PBKDF2_ALGORITHM,
        password.encode("utf-8"),
        salt,
        PBKDF2_ITERATIONS,
    )
    return (
        f"pbkdf2_{PBKDF2_ALGORITHM}$"
        f"{PBKDF2_ITERATIONS}$"
        f"{b64encode(salt).decode('utf-8')}$"
        f"{b64encode(derived_key).decode('utf-8')}"
    )


def verify_password(password: str, password_hash: str) -> bool:
    if not password or not password_hash:
        return False

    try:
        scheme, iterations_str, salt_b64, expected_key_b64 = password_hash.split("$", maxsplit=3)
        if scheme != f"pbkdf2_{PBKDF2_ALGORITHM}":
            return False
        iterations = int(iterations_str)
        salt = b64decode(salt_b64.encode("utf-8"))
        expected_key = b64decode(expected_key_b64.encode("utf-8"))
    except (ValueError, TypeError):
        return False

    candidate_key = hashlib.pbkdf2_hmac(
        PBKDF2_ALGORITHM,
        password.encode("utf-8"),
        salt,
        iterations,
    )
    return hmac.compare_digest(candidate_key, expected_key)
