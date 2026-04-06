from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.task_snapshot import TaskSnapshot
from app.schemas.task_sync import TaskSyncPayload
from app.services.auth import ensure_service_token

router = APIRouter(prefix="/internal/tasks", tags=["internal"])


@router.post("/upsert", dependencies=[Depends(ensure_service_token)])
def upsert_task(payload: TaskSyncPayload, db: Session = Depends(get_db)):
    task = db.get(TaskSnapshot, payload.id)

    if task is None:
        task = TaskSnapshot(
            id=payload.id,
            titulo=payload.titulo,
            concluida=payload.concluida,
            usuario_id=payload.usuarioId
        )
        db.add(task)
    else:
        task.titulo = payload.titulo
        task.concluida = payload.concluida
        task.usuario_id = payload.usuarioId

    db.commit()
    return {"status": "ok"}


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(ensure_service_token)])
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.get(TaskSnapshot, task_id)
    if task is not None:
        db.delete(task)
        db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)