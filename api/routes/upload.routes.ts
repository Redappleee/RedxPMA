import path from "node:path";

import { Router } from "express";
import multer from "multer";

import { uploadImage } from "@/api/controllers/upload.controller";
import { asyncHandler } from "@/api/middleware/async-handler";
import { requireAuth, requireRole } from "@/api/middleware/auth";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.resolve(process.cwd(), "uploads")),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isImage = file.mimetype.startsWith("image/");
    if (!isImage) {
      cb(new Error("Only images are allowed"));
      return;
    }
    cb(null, true);
  }
});

const router = Router();

router.post(
  "/",
  requireAuth,
  requireRole("admin", "manager"),
  upload.single("image"),
  asyncHandler(uploadImage)
);

export default router;
