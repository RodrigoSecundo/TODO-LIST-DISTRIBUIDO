import os

import jwt
from fastapi import Header, HTTPException, status


JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-jwt")
SERVICE_TOKEN = os.getenv("SERVICE_TOKEN", "internal-analytics-token")


def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token não informado.")

    token = authorization[7:]

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido.") from error

    return {
        "id": int(payload["sub"]),
        "nome": payload.get("nome"),
        "email": payload.get("email")
    }


def ensure_service_token(x_service_token: str | None = Header(default=None)) -> None:
    if x_service_token != SERVICE_TOKEN:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Não autorizado.")