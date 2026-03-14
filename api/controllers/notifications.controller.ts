import { Response } from "express";

import { AuthRequest } from "@/api/middleware/auth";
import NotificationModel from "@/models/Notification";

export const listNotifications = async (req: AuthRequest, res: Response) => {
  const notifications = await NotificationModel.find({ userId: req.auth?.userId })
    .sort({ createdAt: -1 })
    .limit(100);

  return res.json({ notifications });
};

export const markNotificationRead = async (req: AuthRequest, res: Response) => {
  const notification = await NotificationModel.findOneAndUpdate(
    {
      _id: req.params.id,
      userId: req.auth?.userId
    },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }

  return res.json({ notification });
};
