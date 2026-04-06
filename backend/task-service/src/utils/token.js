import jwt from "jsonwebtoken";
import { config } from "../config.js";

export function createToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      nome: user.nome,
      email: user.email
    },
    config.jwtSecret,
    { expiresIn: "8h" }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}