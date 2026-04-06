import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { sendLog } from "../clients/logService.js";
import { prisma } from "../prisma.js";
import { createToken } from "../utils/token.js";

const registerSchema = z.object({
  nome: z.string().min(2, "Nome inválido."),
  email: z.string().email("Email inválido."),
  senha: z.string().min(6, "Senha deve ter ao menos 6 caracteres.")
});

const loginSchema = z.object({
  email: z.string().email("Email inválido."),
  senha: z.string().min(6, "Senha inválida.")
});

export const authRoutes = Router();

authRoutes.post("/register", async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const existingUser = await prisma.usuario.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return res.status(409).json({ message: "Email já cadastrado." });
    }

    const senha = await bcrypt.hash(data.senha, 10);
    const user = await prisma.usuario.create({
      data: {
        nome: data.nome,
        email: data.email,
        senha
      }
    });

    await sendLog({
      action: "user_registered",
      detail: `Usuário ${user.email} cadastrado.`,
      usuarioId: user.id
    });

    return res.status(201).json({
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email
      },
      token: createToken(user)
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message ?? "Dados inválidos." });
    }

    return next(error);
  }
});

authRoutes.post("/login", async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.usuario.findUnique({
      where: { email: data.email }
    });

    if (!user || !(await bcrypt.compare(data.senha, user.senha))) {
      await sendLog({
        action: "login_failed",
        detail: `Tentativa de login inválida para ${data.email}.`
      });

      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    return res.json({
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email
      },
      token: createToken(user)
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message ?? "Dados inválidos." });
    }

    return next(error);
  }
});