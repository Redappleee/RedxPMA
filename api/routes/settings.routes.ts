import { Router } from "express";

import { settingsSchema } from "@/api/config/validators";
import { getPublicBranding, getSettings, resetSettings, updateSettings } from "@/api/controllers/settings.controller";
import { asyncHandler } from "@/api/middleware/async-handler";
import { requireAuth, requireRole } from "@/api/middleware/auth";
import { validateBody } from "@/api/middleware/validate";

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
