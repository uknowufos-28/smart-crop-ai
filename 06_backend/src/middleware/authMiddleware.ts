import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

/**
 * Extended Express Request interface carrying authenticated user payload.
 */
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * JWT Authentication Middleware.
 * Validates Bearer token from Authorization HTTP header.
 */
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Access token is missing or invalid. Please provide a Bearer token.",
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
    };
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({
      error: "Forbidden",
      message: "Invalid or expired JWT token.",
    });
  }
};

/**
 * Role-Based Access Control (RBAC) Middleware.
 * Restricts access to users holding specific roles (e.g. 'admin', 'agronomist').
 */
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User is not authenticated.",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: "Forbidden",
        message: `Role '${req.user.role}' is not authorized to access this resource.`,
      });
      return;
    }

    next();
  };
};
