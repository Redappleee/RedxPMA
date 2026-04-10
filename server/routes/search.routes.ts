import { Router } from "express";

import { globalSearch } from "@/server/controllers/search.controller";
import { asyncHandler } from "@/server/middleware/async-handler";
import { requireAuth } from "@/server/middleware/auth";

const router = Router();

router.get("/", requireAuth, asyncHandler(globalSearch));

export default router;
