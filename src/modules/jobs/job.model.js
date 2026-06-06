// modules/jobs/job.model.js

import mongoose from "mongoose";
import { PORTAL_NAMES } from "../../constants/jobPortals.js";

const jobSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true, index: true, lowercase: true, trim: true },
    portalName: { type: String, enum: PORTAL_NAMES, required: true },
    companyName: { type: String, trim: true, default: "" },
    designation: { type: String, trim: true, default: "" },
    salary: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    experience: { type: String, trim: true, default: "" },
    skills: { type: [String], default: [] },
    applyUrl: { type: String, trim: true, default: "" },
    easyApply: { type: Boolean, default: false },
    emailDate: { type: Date, required: true },
    gmailMessageId: { type: String, required: true },
    dedupeKey: { type: String, required: true },
    rawSnippet: { type: String, default: "" },
  },
  { timestamps: true },
);

jobSchema.index({ userEmail: 1, dedupeKey: 1 }, { unique: true });
jobSchema.index({ userEmail: 1, gmailMessageId: 1 });
jobSchema.index({ userEmail: 1, emailDate: -1 });
jobSchema.index({ userEmail: 1, portalName: 1, emailDate: -1 });

const Job = mongoose.model("Job", jobSchema);

export default Job;
