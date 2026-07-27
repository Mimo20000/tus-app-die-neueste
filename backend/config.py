import os
from pathlib import Path
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.environ.get("JWT_SECRET", "change-me")
JWT_ALG = os.environ.get("JWT_ALGORITHM", "HS256")

CLUB = "TuS Oberhausen II"
HANDBALL_TEAM_ID = "handball4all.baden-wuerttemberg.1499726"


def create_token(pid: str) -> str:
    return jwt.encode(
        {"sub": pid, "exp": datetime.now(timezone.utc) + timedelta(days=30)},
        JWT_SECRET,
        algorithm=JWT_ALG,
    )
