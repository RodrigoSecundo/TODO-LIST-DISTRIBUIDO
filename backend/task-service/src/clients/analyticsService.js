import { config } from "../config.js";
import { safeRequest } from "../utils/http.js";

export async function upsertTaskSnapshot(task) {
  const response = await safeRequest(`${config.analyticsServiceUrl}/internal/tasks/upsert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Service-Token": config.analyticsServiceToken
    },
    body: JSON.stringify({
      id: task.id,
      titulo: task.titulo,
      concluida: task.concluida,
      usuarioId: task.usuarioId
    })
  });

  if (response && !response.ok) {
    console.error("Analytics sync failed", response.status);
  }
}

export async function deleteTaskSnapshot(taskId) {
  const response = await safeRequest(`${config.analyticsServiceUrl}/internal/tasks/${taskId}`, {
    method: "DELETE",
    headers: {
      "X-Service-Token": config.analyticsServiceToken
    }
  });

  if (response && !response.ok) {
    console.error("Analytics delete sync failed", response.status);
  }
}