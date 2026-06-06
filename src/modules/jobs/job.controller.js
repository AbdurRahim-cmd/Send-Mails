// modules/jobs/job.controller.js

import asyncHandler from "../../utils/asyncHandler.js";
import { success } from "../../utils/ApiResponse.js";
import { toJobResponse, toJobListResponse } from "./job.dto.js";
import * as jobService from "./job.service.js";

export const syncTodayJobs = asyncHandler(async (req, res) => {
  const result = await jobService.syncJobsForUser(req.user.email);
  return success(res, result, "Today's jobs synced");
});

export const getSyncStatus = asyncHandler(async (req, res) => {
  const status = jobService.getSyncStatusForUser(req.user.email);
  return success(res, status, "Sync status fetched");
});

export const listJobs = asyncHandler(async (req, res) => {
  const { items, pagination } = await jobService.listJobs({
    userEmail: req.user.email,
    query: req.validated?.query ?? req.query,
  });
  return success(res, { items: toJobListResponse(items), pagination }, "Jobs fetched");
});

export const getJob = asyncHandler(async (req, res) => {
  const job = await jobService.getJobById({
    userEmail: req.user.email,
    id: req.params.id,
  });
  return success(res, toJobResponse(job), "Job fetched");
});
