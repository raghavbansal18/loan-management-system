import { NextFunction, Request, Response } from "express";
import { Role } from "../models/User";
import { HttpError } from "../utils/httpError";
import { verifyToken } from "../utils/token";

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; role: Role };
    }
  }
}

// 401: we don't know who you are (missing / invalid / expired token).
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new HttpError(401, "Authentication required"));
  }
  try {
    const payload = verifyToken(header.slice(7));
    req.auth = { userId: payload.sub, role: payload.role };
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token"));
  }
}

// 403: we know who you are, but your role is not allowed here.
// ADMIN is always allowed so it can reach every module.
export const requireRole =
  (...allowed: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const role = req.auth?.role;
    if (!role) return next(new HttpError(401, "Authentication required"));
    if (role === "ADMIN" || allowed.includes(role)) return next();
    next(new HttpError(403, "You do not have permission to access this resource"));
  };
