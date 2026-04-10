import { Router } from "express";

import {
  addComment,
  createProduct,
  deleteComment,
  deleteProduct,
  getDashboardData,
  getProduct,
  listProducts,
  updateProduct
} from "@/server/controllers/products.controller";
import { commentSchema, productSchema, productUpdateSchema } from "@/server/config/validators";
import { asyncHandler } from "@/server/middleware/async-handler";
import { requireAuth, requireRole } from "@/server/middleware/auth";
import { validateBody } from "@/server/middleware/validate";

const router = Router();

router.get("/", requireAuth, asyncHandler(listProducts));
router.get("/dashboard", requireAuth, asyncHandler(getDashboardData));
router.get("/:id", requireAuth, asyncHandler(getProduct));
router.post(
  "/",
  requireAuth,
  requireRole("admin", "manager"),
  validateBody(productSchema),
  asyncHandler(createProduct)
);
router.patch(
  "/:id",
  requireAuth,
  requireRole("admin", "manager"),
  validateBody(productUpdateSchema),
  asyncHandler(updateProduct)
);
router.delete("/:id", requireAuth, requireRole("admin", "manager"), asyncHandler(deleteProduct));
router.post("/:id/comments", requireAuth, validateBody(commentSchema), asyncHandler(addComment));
router.delete("/:id/comments/:commentId", requireAuth, asyncHandler(deleteComment));

export default router;
