import { Router } from "express";

import { globalSearch } from "@/api/controllers/search.controller";
import { asyncHandler } from "@/api/middleware/async-handler";
import { requireAuth } from "@/api/middleware/auth";

const router = Router();

router.get("/", requireAuth, asyncHandler(globalSearch));

export default router;
