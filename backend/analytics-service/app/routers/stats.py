from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.task_snapshot import TaskSnapshot
from app.schemas.stats import TaskStats
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("", response_model=TaskStats)
def get_stats(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    total = db.query(func.count(TaskSnapshot.id)).filter(TaskSnapshot.usuario_id == current_user["id"]).scalar() or 0
    concluidas = (
        db.query(func.count(TaskSnapshot.id))
        .filter(TaskSnapshot.usuario_id == current_user["id"], TaskSnapshot.concluida.is_(True))
        .scalar()
        or 0
    )

    return TaskStats(
        usuarioId=current_user["id"],
        total=total,
        concluidas=concluidas,
        pendentes=total - concluidas
    )