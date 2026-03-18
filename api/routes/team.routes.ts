import { Router } from "express";

import { inviteSchema, updateUserRoleSchema } from "@/api/config/validators";
import { deleteMember, inviteMember, listTeam, updateMemberRole } from "@/api/controllers/team.controller";
import { asyncHandler } from "@/api/middleware/async-handler";
import { requireAuth, requireRole } from "@/api/middleware/auth";
import { validateBody } from "@/api/middleware/validate";

const router = Router();

router.get("/", requireAuth, asyncHandler(listTeam));
router.post(
  "/invite",
  requireAuth,
  validateBody(inviteSchema),
  asyncHandler(inviteMember)
);
router.patch(
  "/:id/role",
  requireAuth,
  requireRole("admin"),
  validateBody(updateUserRoleSchema),
  asyncHandler(updateMemberRole)
);
router.delete("/:id", requireAuth, requireRole("admin"), asyncHandler(deleteMember));

export default router;
