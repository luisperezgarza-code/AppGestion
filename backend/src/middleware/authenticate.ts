import type { Request, RequestHandler } from "express";
import type { RowDataPacket } from "mysql2";
import { database } from "../config/database.js";
import { verifyAccessToken } from "../config/security.js";

export type UserRole = "owner" | "receptionist" | "trainer";

declare global {
  namespace Express {
    interface Request {
      authUserId?: string;
      authUserRole?: UserRole;
    }
  }
}

type RoleRow = RowDataPacket & { role: UserRole };

export const authenticate: RequestHandler = (request, response, next) => {
  const authorization = request.header("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    response.status(401).json({ error: "Se requiere iniciar sesión." });
    return;
  }

  const userId = verifyAccessToken(token);
  if (!userId) {
    response.status(401).json({ error: "La sesión no es válida o expiró." });
    return;
  }

  void database
    .execute<RoleRow[]>("SELECT role FROM users WHERE id = ? LIMIT 1", [userId])
    .then(([rows]) => {
      if (!rows[0]) {
        response.status(401).json({ error: "La cuenta asociada ya no existe." });
        return;
      }
      request.authUserId = userId;
      request.authUserRole = rows[0].role;
      next();
    })
    .catch(next);
};

export const optionalAuthenticate: RequestHandler = (
  request,
  response,
  next,
) => {
  if (!request.header("authorization")) {
    next();
    return;
  }
  authenticate(request, response, next);
};

export function authorize(...allowedRoles: UserRole[]): RequestHandler {
  return (request: Request, response, next) => {
    if (!request.authUserRole || !allowedRoles.includes(request.authUserRole)) {
      response.status(403).json({ error: "No tienes permisos para esta operación." });
      return;
    }
    next();
  };
}
