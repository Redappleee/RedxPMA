import { NextFunction, Request, Response } from "express";
import { parse } from "cookie";

import { verifyAccessToken } from "@/api/config/tokens";
import UserModel from "@/models/User";
import { Role } from "@/types";

export interface AuthRequest extends Request {
  auth?: {
    userId: string;
    role: Role;
  };
}

const extractToken = (req: Request) => {
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : undefined;

  const cookies = parse(req.headers.cookie || "");
  return bearer ?? cookies.accessToken;
};

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.auth = verifyAccessToken(token);
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireRole = (...roles: Role[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.auth?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await UserModel.findById(req.auth.userId).select("role");

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.auth.role = user.role;

    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
};
