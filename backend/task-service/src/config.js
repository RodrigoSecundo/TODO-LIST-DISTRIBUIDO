import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 3001),
  jwtSecret: process.env.JWT_SECRET ?? "super-secret-jwt",
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://127.0.0.1:5500",
  logServiceUrl: process.env.LOG_SERVICE_URL ?? "http://localhost:8000/api",
  logServiceToken: process.env.LOG_SERVICE_TOKEN ?? "internal-log-token",
  analyticsServiceUrl: process.env.ANALYTICS_SERVICE_URL ?? "http://localhost:8001",
  analyticsServiceToken: process.env.ANALYTICS_SERVICE_TOKEN ?? "internal-analytics-token"
};