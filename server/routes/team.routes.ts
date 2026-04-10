import { Router } from "express";

import { inviteSchema, updateUserRoleSchema } from "@/server/config/validators";
import { deleteMember, inviteMember, listTeam, updateMemberRole } from "@/server/controllers/team.controller";
import { asyncHandler } from "@/server/middleware/async-handler";
import { requireAuth, requireRole } from "@/server/middleware/auth";
import { validateBody } from "@/server/middleware/validate";

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
