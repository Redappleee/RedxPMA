import { Router } from "express";

import {
  forgotPassword,
  getDashboardLayout,
  googleAuth,
  login,
  logout,
  me,
  updateProfile,
  resetPassword,
  signup,
  updateDashboardLayout
} from "@/server/controllers/auth.controller";
import {
  dashboardLayoutSchema,
  forgotPasswordSchema,
  googleAuthSchema,
  loginSchema,
  profileUpdateSchema,
  resetPasswordSchema,
  signupSchema
} from "@/server/config/validators";
import { asyncHandler } from "@/server/middleware/async-handler";
import { requireAuth } from "@/server/middleware/auth";
import { validateBody } from "@/server/middleware/validate";

const router = Router();

router.post("/signup", validateBody(signupSchema), asyncHandler(signup));
router.post("/login", validateBody(loginSchema), asyncHandler(login));
router.post("/google", validateBody(googleAuthSchema), asyncHandler(googleAuth));
router.post("/logout", asyncHandler(logout));
router.get("/me", requireAuth, asyncHandler(me));
router.patch("/profile", requireAuth, validateBody(profileUpdateSchema), asyncHandler(updateProfile));
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
