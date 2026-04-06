import { Router } from "express";
import { z } from "zod";
import { deleteTaskSnapshot, upsertTaskSnapshot } from "../clients/analyticsService.js";
import { sendLog } from "../clients/logService.js";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../prisma.js";

const createTaskSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório."),
  descricao: z.string().optional().default("")
});

export const taskRoutes = Router();

taskRoutes.use(requireAuth);

taskRoutes.get("/", async (req, res, next) => {
  try {
    const tasks = await prisma.tarefa.findMany({
      where: { usuarioId: req.user.id },
      orderBy: { id: "desc" }
    });

    return res.json(
      tasks.map((task) => ({
        id: task.id,
        titulo: task.titulo,
        descricao: task.descricao,
        concluida: task.concluida,
        usuarioId: task.usuarioId
      }))
    );
  } catch (error) {
    return next(error);
  }
});

taskRoutes.post("/", async (req, res, next) => {
  try {
    const data = createTaskSchema.parse(req.body);
    const task = await prisma.tarefa.create({
      data: {
        titulo: data.titulo,
        descricao: data.descricao,
        usuarioId: req.user.id
      }
    });

    await Promise.all([
      sendLog({
        action: "task_created",
        detail: `Tarefa ${task.titulo} criada.`,
        usuarioId: req.user.id
      }),
      upsertTaskSnapshot(task)
    ]);

    return res.status(201).json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message ?? "Dados inválidos." });
    }

    return next(error);
  }
});

taskRoutes.patch("/:id/toggle", async (req, res, next) => {
  try {
    const taskId = Number(req.params.id);

    if (!Number.isInteger(taskId)) {
      return res.status(400).json({ message: "ID de tarefa inválido." });
    }

    const task = await prisma.tarefa.findUnique({ where: { id: taskId } });

    if (!task) {
      return res.status(404).json({ message: "Tarefa não encontrada." });
    }

    if (task.usuarioId !== req.user.id) {
      await sendLog({
        action: "access_denied",
        detail: `Usuário ${req.user.email} tentou alterar a tarefa ${task.id}.`,
        usuarioId: req.user.id
      });

      return res.status(403).json({ message: "Acesso negado." });
    }

    const updatedTask = await prisma.tarefa.update({
      where: { id: task.id },
      data: { concluida: !task.concluida }
    });

    await Promise.all([
      sendLog({
        action: "task_toggled",
        detail: `Tarefa ${updatedTask.titulo} marcada como ${updatedTask.concluida ? "concluída" : "pendente"}.`,
        usuarioId: req.user.id
      }),
      upsertTaskSnapshot(updatedTask)
    ]);

    return res.json(updatedTask);
  } catch (error) {
    return next(error);
  }
});

taskRoutes.delete("/:id", async (req, res, next) => {
  try {
    const taskId = Number(req.params.id);

    if (!Number.isInteger(taskId)) {
      return res.status(400).json({ message: "ID de tarefa inválido." });
    }

    const task = await prisma.tarefa.findUnique({ where: { id: taskId } });

    if (!task) {
      return res.status(404).json({ message: "Tarefa não encontrada." });
    }

    if (task.usuarioId !== req.user.id) {
      await sendLog({
        action: "access_denied",
        detail: `Usuário ${req.user.email} tentou excluir a tarefa ${task.id}.`,
        usuarioId: req.user.id
      });

      return res.status(403).json({ message: "Acesso negado." });
    }

    await prisma.tarefa.delete({ where: { id: task.id } });

    await Promise.all([
      sendLog({
        action: "task_deleted",
        detail: `Tarefa ${task.titulo} excluída.`,
        usuarioId: req.user.id
      }),
      deleteTaskSnapshot(task.id)
    ]);

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});