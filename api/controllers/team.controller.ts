import crypto from "node:crypto";

import { Request, Response } from "express";

import { AuthRequest } from "@/api/middleware/auth";
import { emitSocketEvent } from "@/api/socket/events";
import ActivityModel from "@/models/Activity";
import NotificationModel from "@/models/Notification";
import ProductModel from "@/models/Product";
import UserModel from "@/models/User";

export const listTeam = async (_req: Request, res: Response) => {
  const members = await UserModel.find().select("-password").sort({ createdAt: -1 });
  return res.json({ members });
};

export const inviteMember = async (req: AuthRequest, res: Response) => {
  const exists = await UserModel.findOne({ email: req.body.email });

  if (exists) {
    return res.status(409).json({ message: "User already exists" });
  }

  const temporaryPassword = crypto.randomBytes(8).toString("hex");
  const user = await UserModel.create({
    ...req.body,
    password: temporaryPassword
  });

  await ActivityModel.create({
    user: req.auth?.userId,
    action: "Invited team member",
    entityType: "team",
    entityId: user.id,
    metadata: { invitee: user.email }
  });

  emitSocketEvent("team:invited", {
    userId: user.id,
    email: user.email
  });

  return res.status(201).json({
    message: "Team member invited",
    invite: {
      email: user.email,
      temporaryPassword
    }
  });
};

export const updateMemberRole = async (req: AuthRequest, res: Response) => {
  const member = await UserModel.findById(req.params.id);

  if (!member) {
    return res.status(404).json({ message: "Team member not found" });
  }

  if (req.auth?.userId === member.id && req.body.role !== "admin") {
    return res.status(400).json({ message: "You cannot downgrade your own admin role" });
  }

  member.role = req.body.role;
  await member.save();

  await ActivityModel.create({
    user: req.auth?.userId,
    action: "Updated team member role",
    entityType: "team",
    entityId: member.id,
    metadata: { memberEmail: member.email, role: member.role }
  });

  emitSocketEvent("team:role-updated", {
    userId: member.id,
    role: member.role
  });

  return res.json({
    member: {
      _id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      avatar: member.avatar
    }
  });
};

export const deleteMember = async (req: AuthRequest, res: Response) => {
  const member = await UserModel.findById(req.params.id);

  if (!member) {
    return res.status(404).json({ message: "Team member not found" });
  }

  if (req.auth?.userId === member.id) {
    return res.status(400).json({ message: "You cannot delete your own account" });
  }

  if (member.role === "admin") {
    const adminCount = await UserModel.countDocuments({ role: "admin" });
    if (adminCount <= 1) {
      return res.status(400).json({ message: "At least one admin must remain in the workspace" });
    }
  }

  await Promise.all([
    ProductModel.updateMany({}, { $pull: { assignedManagers: member._id } }),
    NotificationModel.deleteMany({ userId: member._id }),
    member.deleteOne()
  ]);

  await ActivityModel.create({
    user: req.auth?.userId,
    action: "Removed team member",
    entityType: "team",
    entityId: member.id,
    metadata: { memberEmail: member.email }
  });

  emitSocketEvent("team:removed", {
    userId: member.id
  });

  return res.json({ message: "Team member removed" });
};
