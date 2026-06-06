// modules/jobs/job.validator.js

import { z } from "zod";
import { PORTAL_NAMES } from "../../constants/jobPortals.js";

// Treat empty strings / "all" / "any" as "no filter" so the UI can send
// these without tripping validation when a tab is cleared or set to All.
const emptyToUndefined = (v) => {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "string") return v;
  const t = v.trim();
  if (!t || t.toLowerCase() === "all" || t.toLowerCase() === "any") return undefined;
  return t;
};

const portalSchema = z
  .preprocess(
    (v) => {
      const t = emptyToUndefined(v);
      return typeof t === "string" ? t.toLowerCase() : t;
    },
    z.enum(PORTAL_NAMES).optional(),
  );

const searchSchema = z.preprocess(emptyToUndefined, z.string().min(1).optional());

const optionalDate = z.preprocess(emptyToUndefined, z.coerce.date().optional());

export const listJobsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  portal: portalSchema,
  search: searchSchema,
  from: optionalDate,
  to: optionalDate,
});

export const jobIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid job id"),
});
