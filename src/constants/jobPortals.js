// constants/jobPortals.js

export const PORTALS = Object.freeze({
  LINKEDIN: { name: "linkedin", domain: "linkedin.com" },
  NAUKRI: { name: "naukri", domain: "naukri.com" },
  GLASSDOOR: { name: "glassdoor", domain: "glassdoor.com" },
  INDEED: { name: "indeed", domain: "indeed.com" },
  WELLFOUND: { name: "wellfound", domain: "wellfound.com" },
});

export const PORTAL_NAMES = Object.values(PORTALS).map((p) => p.name);

const PORTAL_FROM_CLAUSE = Object.values(PORTALS)
  .map((p) => `from:${p.domain}`)
  .join(" OR ");

// Gmail `after:YYYY/MM/DD` is inclusive of that day in the user's timezone,
// so passing today's date restricts results to messages received today only.
export const buildTodayJobQuery = (now = new Date()) => {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `after:${y}/${m}/${d} (${PORTAL_FROM_CLAUSE})`;
};

export const GMAIL_TODAY_JOB_QUERY = buildTodayJobQuery();

export const detectPortal = (fromHeader = "") => {
  const lower = fromHeader.toLowerCase();
  for (const p of Object.values(PORTALS)) {
    if (lower.includes(p.domain)) return p.name;
  }
  return null;
};
