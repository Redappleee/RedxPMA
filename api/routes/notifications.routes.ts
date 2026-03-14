import { Router } from "express";

import {
  listNotifications,
  markNotificationRead
} from "@/api/controllers/notifications.controller";
import { asyncHandler } from "@/api/middleware/async-handler";
import { requireAuth } from "@/api/middleware/auth";

const router = Router();

router.get("/", requireAuth, asyncHandler(listNotifications));
router.patch("/:id/read", requireAuth, asyncHandler(markNotificationRead));

export default router;
