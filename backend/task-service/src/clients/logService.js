import { config } from "../config.js";
import { safeRequest } from "../utils/http.js";

export async function sendLog({ action, detail, usuarioId = null }) {
  const response = await safeRequest(`${config.logServiceUrl}/logs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Service-Token": config.logServiceToken
    },
    body: JSON.stringify({
      action,
      detail,
      usuarioId
    })
  });

  if (response && !response.ok) {
    console.error("Log service rejected payload", response.status);
  }
}