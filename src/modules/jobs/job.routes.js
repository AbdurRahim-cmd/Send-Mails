// modules/jobs/job.routes.js

import { Router } from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import { limiter } from "../../middleware/rateLimiter.js";
import validateRequest from "../../middleware/validateRequest.js";
import { listJobsQuerySchema, jobIdParamSchema } from "./job.validator.js";
import { syncTodayJobs, getSyncStatus, listJobs, getJob } from "./job.controller.js";

const router = Router();

router.use(authMiddleware);

router.post("/sync", limiter, syncTodayJobs);
router.get("/sync/status", getSyncStatus);
router.get("/", validateRequest(listJobsQuerySchema, "query"), listJobs);
router.get("/:id", validateRequest(jobIdParamSchema, "params"), getJob);

export default router;
