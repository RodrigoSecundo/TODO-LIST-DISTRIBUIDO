import cors from "cors";
import express from "express";
import { sendLog } from "./clients/logService.js";
import { config } from "./config.js";
import { authRoutes } from "./routes/authRoutes.js";
import { taskRoutes } from "./routes/taskRoutes.js";

export function createApp() {
  const app = express();
  const allowedOrigins = [config.frontendOrigin, "http://localhost:5500", "http://127.0.0.1:5500"];

  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin não permitida pelo CORS."));
    }
  }));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ service: "task-service", status: "ok" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/tasks", taskRoutes);

  app.use(async (err, req, res, _next) => {
    console.error(err);
    await sendLog({
      action: "error",
      detail: `${req.method} ${req.originalUrl}: ${err.message}`,
      usuarioId: req.user?.id ?? null
    });
    res.status(500).json({ message: "Erro interno do servidor." });
  });

  return app;
}