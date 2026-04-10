import { Router } from "express";

import {
  listNotifications,
  markNotificationRead
} from "@/server/controllers/notifications.controller";
import { asyncHandler } from "@/server/middleware/async-handler";
import { requireAuth } from "@/server/middleware/auth";

const router = Router();

router.get("/", requireAuth, asyncHandler(listNotifications));
router.patch("/:id/read", requireAuth, asyncHandler(markNotificationRead));

export default router;
