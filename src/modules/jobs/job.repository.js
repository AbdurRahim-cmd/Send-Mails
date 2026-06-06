// modules/jobs/job.repository.js

import Job from "./job.model.js";

export const upsertByDedupeKey = async ({ userEmail, dedupeKey, ...fields }) => {
  const res = await Job.updateOne(
    { userEmail, dedupeKey },
    { $setOnInsert: { ...fields, userEmail, dedupeKey } },
    { upsert: true },
  );
  return { inserted: res.upsertedCount === 1 };
};

export const findJobs = async ({ userEmail, portal, search, from, to, page, limit }) => {
  const filter = { userEmail };
  if (portal) filter.portalName = portal;
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [
      { companyName: rx },
      { designation: rx },
      { location: rx },
      { skills: rx },
    ];
  }
  if (from || to) {
    filter.emailDate = {};
    if (from) filter.emailDate.$gte = from;
    if (to) filter.emailDate.$lte = to;
  }

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const skip = (pageNum - 1) * limitNum;
  const [items, total] = await Promise.all([
    Job.find(filter).sort({ emailDate: -1 }).skip(skip).limit(limitNum).lean(),
    Job.countDocuments(filter),
  ]);
  return { items, total };
};

export const findJobById = async ({ userEmail, id }) => {
  return Job.findOne({ _id: id, userEmail }).lean();
};
