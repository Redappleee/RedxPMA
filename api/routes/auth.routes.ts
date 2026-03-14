import { Router } from "express";

import {
  forgotPassword,
  getDashboardLayout,
  googleAuth,
  login,
  logout,
  me,
  resetPassword,
  signup,
  updateDashboardLayout
} from "@/api/controllers/auth.controller";
import {
  dashboardLayoutSchema,
  forgotPasswordSchema,
  googleAuthSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema
} from "@/api/config/validators";
import { asyncHandler } from "@/api/middleware/async-handler";
import { requireAuth } from "@/api/middleware/auth";
import { validateBody } from "@/api/middleware/validate";

const router = Router();

router.post("/signup", validateBody(signupSchema), asyncHandler(signup));
router.post("/login", validateBody(loginSchema), asyncHandler(login));
router.post("/google", validateBody(googleAuthSchema), asyncHandler(googleAuth));
router.post("/logout", asyncHandler(logout));
router.get("/me", requireAuth, asyncHandler(me));
router.get("/preferences/dashboard-layout", requireAuth, asyncHandler(getDashboardLayout));
router.put(
  "/preferences/dashboard-layout",
  requireAuth,
  validateBody(dashboardLayoutSchema),
  asyncHandler(updateDashboardLayout)
);
router.post("/forgot-password", validateBody(forgotPasswordSchema), asyncHandler(forgotPassword));
router.post("/reset-password", validateBody(resetPasswordSchema), asyncHandler(resetPassword));

export default router;
