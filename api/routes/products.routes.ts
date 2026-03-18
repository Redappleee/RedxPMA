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
} from "@/api/controllers/products.controller";
import { commentSchema, productSchema, productUpdateSchema } from "@/api/config/validators";
import { asyncHandler } from "@/api/middleware/async-handler";
import { requireAuth, requireRole } from "@/api/middleware/auth";
import { validateBody } from "@/api/middleware/validate";

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
