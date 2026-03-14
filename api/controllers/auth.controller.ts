import { Request, Response } from "express";
import crypto from "node:crypto";
import { OAuth2Client } from "google-auth-library";

import { serverEnv } from "@/api/config/env";
import { signAccessToken } from "@/api/config/tokens";
import PasswordResetTokenModel from "@/models/PasswordResetToken";
import UserModel from "@/models/User";
import { DEFAULT_DASHBOARD_LAYOUT, DashboardWidgetKey } from "@/types/dashboard";
import { Role } from "@/types";

const TOKEN_COOKIE = "accessToken";
const googleClient = new OAuth2Client();

const setAuthCookie = (res: Response, token: string) => {
  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

const buildAuthResponse = (user: {
  id?: string;
  _id?: unknown;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}) => {
  const userId = String(user.id ?? user._id);
  const token = signAccessToken({ userId, role: user.role });

  return {
    token,
    payload: {
      user: {
        _id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
      accessToken: token
    }
  };
};

const normalizeLayout = (layout: unknown): DashboardWidgetKey[] => {
  if (!Array.isArray(layout)) {
    return DEFAULT_DASHBOARD_LAYOUT;
  }

  const allowed = new Set(DEFAULT_DASHBOARD_LAYOUT);
  const filtered = layout.filter((item): item is DashboardWidgetKey => typeof item === "string" && allowed.has(item as DashboardWidgetKey));

  if (filtered.length !== DEFAULT_DASHBOARD_LAYOUT.length) {
    return DEFAULT_DASHBOARD_LAYOUT;
  }

  if (new Set(filtered).size !== DEFAULT_DASHBOARD_LAYOUT.length) {
    return DEFAULT_DASHBOARD_LAYOUT;
  }

  return filtered;
};

export const signup = async (req: Request, res: Response) => {
  const existing = await UserModel.findOne({ email: req.body.email });
  if (existing) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const user = await UserModel.create(req.body);
  const response = buildAuthResponse(user);
  setAuthCookie(res, response.token);

  return res.status(201).json(response.payload);
};

export const login = async (req: Request, res: Response) => {
  const user = await UserModel.findOne({ email: req.body.email });

  if (!user || !(await user.comparePassword(req.body.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const response = buildAuthResponse(user);
  setAuthCookie(res, response.token);

  return res.json(response.payload);
};

export const googleAuth = async (req: Request, res: Response) => {
  if (!serverEnv.GOOGLE_CLIENT_ID) {
    return res.status(500).json({ message: "Google OAuth is not configured on the server" });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: req.body.idToken,
      audience: serverEnv.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if (!payload?.email || payload.email_verified === false) {
      return res.status(401).json({ message: "Google account email is not verified" });
    }

    const email = payload.email.toLowerCase();
    let user = await UserModel.findOne({ email });

    if (!user) {
      const fallbackName = email.split("@")[0];
      user = await UserModel.create({
        name: payload.name?.trim() || fallbackName,
        email,
        password: `${crypto.randomBytes(24).toString("hex")}Aa1`,
        avatar: payload.picture,
        role: req.body.role ?? "member"
      });
    } else if (!user.avatar && payload.picture) {
      user.avatar = payload.picture;
      await user.save();
    }

    const response = buildAuthResponse(user);
    setAuthCookie(res, response.token);
    return res.json(response.payload);
  } catch {
    return res.status(401).json({ message: "Google authentication failed" });
  }
};

export const me = async (req: Request & { auth?: { userId: string } }, res: Response) => {
  const user = await UserModel.findById(req.auth?.userId).select("-password");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({ user });
};

export const getDashboardLayout = async (req: Request & { auth?: { userId: string } }, res: Response) => {
  const user = await UserModel.findById(req.auth?.userId).select("preferences.dashboardLayout");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const layout = normalizeLayout(user.preferences?.dashboardLayout);
  return res.json({ layout });
};

export const updateDashboardLayout = async (req: Request & { auth?: { userId: string } }, res: Response) => {
  const user = await UserModel.findByIdAndUpdate(
    req.auth?.userId,
    {
      $set: {
        "preferences.dashboardLayout": req.body.layout
      }
    },
    { new: true }
  ).select("preferences.dashboardLayout");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({
    layout: normalizeLayout(user.preferences?.dashboardLayout)
  });
};

export const logout = async (_req: Request, res: Response) => {
  res.clearCookie(TOKEN_COOKIE);
  return res.json({ message: "Logged out" });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const user = await UserModel.findOne({ email: req.body.email });

  if (!user) {
    return res.json({
      message: "If your email exists, a reset instruction has been generated"
    });
  }

  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

  await PasswordResetTokenModel.create({
    userId: user._id,
    token,
    expiresAt
  });

  // In production this should be sent by email provider.
  return res.json({
    message: "Password reset token generated",
    token
  });
};

export const resetPassword = async (req: Request, res: Response) => {
  const tokenDocument = await PasswordResetTokenModel.findOne({ token: req.body.token });

  if (!tokenDocument) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  const user = await UserModel.findById(tokenDocument.userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.password = req.body.password;
  await user.save();
  await tokenDocument.deleteOne();

  return res.json({ message: "Password reset successful" });
};
