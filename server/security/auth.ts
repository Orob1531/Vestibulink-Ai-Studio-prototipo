import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import type { User, UserRole } from "../../src/domain/models";
import { db } from "../data/database";

const SESSION_SECRET =
  process.env.SESSION_SECRET || "vestibulink-dev-hmac-secret-change-in-production";

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: User;
    }
  }
}

/**
 * Gera hash seguro de senha usando scrypt nativo do Node.js com salt aleatório.
 * NUNCA armazena senhas em texto puro.
 */
export function hashPassword(plainPassword: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(plainPassword, salt, 64).toString("hex");
  return `scrypt:${salt}:${derivedKey}`;
}

/**
 * Verifica senha contra hash armazenado com proteção contra timing attacks.
 */
export function verifyPassword(plainPassword: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(":");
    if (parts.length !== 3 || parts[0] !== "scrypt") return false;
    const [, salt, originalHex] = parts;
    const derivedBuffer = crypto.scryptSync(plainPassword, salt, 64);
    const originalBuffer = Buffer.from(originalHex, "hex");
    if (derivedBuffer.length !== originalBuffer.length) return false;
    return crypto.timingSafeEqual(derivedBuffer, originalBuffer);
  } catch {
    return false;
  }
}

/**
 * Assina um token de sessão compacto via HMAC-SHA256.
 */
export function issueSessionToken(user: Pick<User, "id" | "email" | "role">): string {
  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const base64Payload = Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(base64Payload)
    .digest("base64url");
  return `${base64Payload}.${signature}`;
}

/**
 * Valida token de sessão e verifica expiração.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const [base64Payload, signature] = token.split(".");
    if (!base64Payload || !signature) return null;

    const expectedSignature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(base64Payload)
      .digest("base64url");

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(base64Payload, "base64url").toString("utf-8")
    ) as SessionPayload;

    if (!payload.exp || Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Sanitiza strings de entrada removendo caracteres de controle e tags HTML maliciosas.
 */
export function sanitizeString(input: unknown, maxLength = 500): string {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .slice(0, maxLength);
}

/**
 * Middleware que identifica o usuário logado se o header Authorization estiver presente,
 * mas permite acesso anônimo caso contrário.
 */
export function authenticateOptional(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    const payload = verifySessionToken(token);
    if (payload) {
      const userRecord = db
        .getState()
        .users.find((u) => u.id === payload.userId && u.status === "ACTIVE");
      if (userRecord) {
        const { passwordHash: _pw, ...safeUser } = userRecord;
        req.authUser = safeUser;
      }
    }
  }
  next();
}

/**
 * Middleware que exige usuário autenticado.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  authenticateOptional(req, res, () => {
    if (!req.authUser) {
      res.status(401).json({
        success: false,
        error: "Autenticação necessária para acessar este recurso.",
      });
      return;
    }
    next();
  });
}

/**
 * Middleware de Autorização Baseada em Papéis (RBAC).
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    authenticateOptional(req, res, () => {
      if (!req.authUser) {
        res.status(401).json({
          success: false,
          error: "Autenticação necessária.",
        });
        return;
      }
      if (!allowedRoles.includes(req.authUser.role)) {
        res.status(403).json({
          success: false,
          error: "Acesso negado: permissão insuficiente para esta operação.",
        });
        return;
      }
      next();
    });
  };
}

/**
 * Rate Limiter em memória por IP para proteção contra abuso.
 */
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export function createRateLimiter(maxRequests = 120, windowMs = 60_000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "local";
    const key = `${ip}:${req.baseUrl || ""}`;
    const now = Date.now();
    const bucket = rateBuckets.get(key);

    if (!bucket || now > bucket.resetAt) {
      rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    bucket.count += 1;
    if (bucket.count > maxRequests) {
      res.status(429).json({
        success: false,
        error: "Limite de requisições excedido. Tente novamente em instantes.",
      });
      return;
    }

    next();
  };
}
