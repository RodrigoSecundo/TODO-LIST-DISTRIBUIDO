from pydantic import BaseModel


class TaskStats(BaseModel):
    usuarioId: int
    total: int
    concluidas: int
    pendentes: int