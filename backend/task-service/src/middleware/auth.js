import { sendLog } from "../clients/logService.js";
import { verifyToken } from "../utils/token.js";

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    await sendLog({
      action: "access_denied",
      detail: `Acesso sem token em ${req.method} ${req.originalUrl}.`
    });
    return res.status(401).json({ message: "Token não informado." });
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token);
    req.user = {
      id: Number(payload.sub),
      nome: payload.nome,
      email: payload.email,
      token
    };
    return next();
  } catch {
    await sendLog({
      action: "access_denied",
      detail: `Token inválido em ${req.method} ${req.originalUrl}.`
    });
    return res.status(401).json({ message: "Token inválido." });
  }
}