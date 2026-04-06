from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class TaskSnapshot(Base):
    __tablename__ = "task_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    titulo: Mapped[str] = mapped_column(String(255), nullable=False)
    concluida: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    usuario_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)