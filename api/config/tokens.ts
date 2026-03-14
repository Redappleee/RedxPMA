import jwt from "jsonwebtoken";

import { serverEnv } from "@/api/config/env";
import { Role } from "@/types";

interface TokenPayload {
  userId: string;
  role: Role;
}

export const signAccessToken = (payload: TokenPayload) =>
  jwt.sign(payload, serverEnv.JWT_SECRET, { expiresIn: "7d" });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, serverEnv.JWT_SECRET) as TokenPayload;
