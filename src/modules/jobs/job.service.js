// modules/jobs/job.service.js

import pLimit from "p-limit";
import User from "../../models/userModel.js";
import logger from "../../config/logger.js";
import ApiError from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import { detectPortal } from "../../constants/jobPortals.js";
import { normalizeJob } from "../../utils/normalize.js";
import { createGmailClientForUser } from "./gmail/gmailClient.js";
import { listTodayJobMessageIds, getMessage } from "./gmail/gmailFetcher.js";
import { getParser } from "./parsers/index.js";
import * as jobRepo from "./job.repository.js";

const CONCURRENCY = Number(process.env.JOB_SYNC_CONCURRENCY) || 5;

const syncStateByUser = new Map();

const setSyncState = (userEmail, patch) => {
  const prev = syncStateByUser.get(userEmail) || {};
  syncStateByUser.set(userEmail, { ...prev, ...patch });
};

export const getSyncStatusForUser = (userEmail) => {
  return (
    syncStateByUser.get(userEmail) || {
      status: "idle",
      startedAt: null,
      finishedAt: null,
      lastSyncedAt: null,
      fetched: 0,
      inserted: 0,
      skipped: 0,
      count: 0,
      errors: [],
    }
  );
};

const processMessage = async ({ gmail, msgId, userEmail }) => {
  const msg = await getMessage(gmail, msgId);
  const portal = detectPortal(msg.from);
  if (!portal) {
    logger.warn({ msgId, from: msg.from }, "Portal not recognised, skipping");
    return { inserted: 0, total: 0 };
  }

  const parser = getParser(portal);
  if (!parser) return { inserted: 0, total: 0 };

  const parsed = parser({
    html: msg.html,
    text: msg.text,
    subject: msg.subject,
    from: msg.from,
  });

  const items = Array.isArray(parsed) ? parsed : [parsed];
  let inserted = 0;

  for (let idx = 0; idx < items.length; idx += 1) {
    const item = items[idx];
    if (!item.companyName && !item.designation && !item.applyUrl) {
      logger.warn({ msgId, portal, idx }, "Parser produced empty result");
    }
    const normalized = normalizeJob(item);
    const dedupeKey = normalized.applyUrl
      ? `${portal}:${normalized.applyUrl}`
      : `${msg.messageId}:${idx}`;

    const { inserted: didInsert } = await jobRepo.upsertByDedupeKey({
      userEmail,
      dedupeKey,
      gmailMessageId: msg.messageId,
      portalName: portal,
      emailDate: msg.date,
      rawSnippet: (msg.snippet || "").slice(0, 200),
      ...normalized,
    });
    if (didInsert) inserted += 1;
  }

  return { inserted, total: items.length };
};

export const syncJobsForUser = async (userEmail) => {
  const current = syncStateByUser.get(userEmail);
  if (current?.status === "running") {
    return {
      alreadyRunning: true,
      fetched: current.fetched,
      inserted: current.inserted,
      skipped: current.skipped,
      errors: current.errors,
    };
  }

  setSyncState(userEmail, {
    status: "running",
    startedAt: new Date().toISOString(),
    finishedAt: null,
    fetched: 0,
    inserted: 0,
    skipped: 0,
    errors: [],
  });

  try {
    const user = await User.findOne({ email: userEmail }).lean();
    if (!user) {
      throw new ApiError(404, "User not found", ERROR_CODES.NOT_FOUND);
    }

    const gmail = createGmailClientForUser(user);
    const msgIds = await listTodayJobMessageIds(gmail);
    setSyncState(userEmail, { fetched: msgIds.length });

    logger.info({ userEmail, fetched: msgIds.length }, "Job sync started");

    const limit = pLimit(CONCURRENCY);
    const errors = [];
    let inserted = 0;
    let skipped = 0;

    await Promise.all(
      msgIds.map((id) =>
        limit(async () => {
          try {
            const r = await processMessage({ gmail, msgId: id, userEmail });
            inserted += r.inserted;
            skipped += Math.max(r.total - r.inserted, 0);
            setSyncState(userEmail, { inserted, skipped });
          } catch (err) {
            logger.error({ err, msgId: id }, "Failed to process message");
            errors.push({ msgId: id, message: err.message });
            setSyncState(userEmail, { errors: [...errors] });
          }
        }),
      ),
    );

    logger.info({ userEmail, inserted, skipped, errors: errors.length }, "Job sync finished");
    const finishedAt = new Date().toISOString();
    setSyncState(userEmail, {
      status: "success",
      finishedAt,
      lastSyncedAt: finishedAt,
      inserted,
      skipped,
      count: inserted,
      errors,
    });
    return { fetched: msgIds.length, inserted, skipped, errors };
  } catch (err) {
    setSyncState(userEmail, {
      status: "error",
      finishedAt: new Date().toISOString(),
      errorMessage: err.message,
    });
    throw err;
  }
};

// Returns the [start, end] of the current local day so listings default to
// today's emails only, matching what the Gmail sync fetches.
const todayRange = (now = new Date()) => {
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { from, to };
};

export const listJobs = async ({ userEmail, query }) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;

  // When the caller hasn't requested an explicit date range, restrict results
  // to the current day so older synced jobs are not returned.
  const dateFilter = query.from || query.to ? {} : todayRange();

  const { items, total } = await jobRepo.findJobs({
    userEmail,
    ...query,
    ...dateFilter,
    page,
    limit,
  });
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
};

export const getJobById = async ({ userEmail, id }) => {
  const job = await jobRepo.findJobById({ userEmail, id });
  if (!job) throw new ApiError(404, "Job not found", ERROR_CODES.NOT_FOUND);
  return job;
};
