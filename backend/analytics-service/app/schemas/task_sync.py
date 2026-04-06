from pydantic import BaseModel


class TaskSyncPayload(BaseModel):
    id: int
    titulo: str
    concluida: bool
    usuarioId: int