import { Router } from "express";

import { settingsSchema } from "@/server/config/validators";
import { getPublicBranding, getSettings, resetSettings, updateSettings } from "@/server/controllers/settings.controller";
import { asyncHandler } from "@/server/middleware/async-handler";
import { requireAuth, requireRole } from "@/server/middleware/auth";
import { validateBody } from "@/server/middleware/validate";

const router = Router();

router.get("/public", asyncHandler(getPublicBranding));
router.get("/", requireAuth, asyncHandler(getSettings));
router.put(
  "/",
  requireAuth,
  requireRole("admin", "manager"),
  validateBody(settingsSchema),
  asyncHandler(updateSettings)
);
router.post("/reset", requireAuth, requireRole("admin", "manager"), asyncHandler(resetSettings));

export default router;
