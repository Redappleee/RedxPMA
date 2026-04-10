import { Router } from "express";

import {
  analyticsGoalsSchema,
  analyticsPresetSchema,
  analyticsScheduleSchema
} from "@/server/config/validators";
import {
  createAnalyticsPreset,
  deleteAnalyticsPreset,
  exportAnalyticsReport,
  getAnalyticsOverview,
  updateAnalyticsGoals,
  updateAnalyticsSchedule
} from "@/server/controllers/analytics.controller";
import { asyncHandler } from "@/server/middleware/async-handler";
import { requireAuth } from "@/server/middleware/auth";
import { validateBody } from "@/server/middleware/validate";

const router = Router();

router.get("/", requireAuth, asyncHandler(getAnalyticsOverview));
router.get("/export", requireAuth, asyncHandler(exportAnalyticsReport));
router.put("/goals", requireAuth, validateBody(analyticsGoalsSchema), asyncHandler(updateAnalyticsGoals));
router.post("/presets", requireAuth, validateBody(analyticsPresetSchema), asyncHandler(createAnalyticsPreset));
router.delete("/presets/:presetId", requireAuth, asyncHandler(deleteAnalyticsPreset));
router.put("/schedule", requireAuth, validateBody(analyticsScheduleSchema), asyncHandler(updateAnalyticsSchedule));

export default router;
