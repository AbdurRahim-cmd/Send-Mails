// modules/jobs/parsers/glassdoor.parser.js

import {
  loadHtml,
  textOf,
  extractFirstUrl,
  extractSalaryString,
  extractExperienceString,
  extractSkillsFromText,
} from "./base.parser.js";

const JOB_HREF_RE = /(glassdoor\.com\/(?:job-listing|partner|job)\/|GD_JOB)/i;
const FOOTER_RE = /(glassdoor|market street|san francisco,?\s*ca|unsubscribe|privacy)/i;
const CITY_STATE_RE = /\b([A-Z][A-Za-z.'-]+(?:\s[A-Z][A-Za-z.'-]+)*,\s?(?:[A-Z]{2,}|[A-Z][a-z]+))\b|\bRemote\b/;

const stripUtm = (url) => {
  try {
    const u = new URL(url);
    [...u.searchParams.keys()].forEach((k) => {
      if (/^(utm_|s|src|ao|cs|ea|t|jl)/i.test(k)) u.searchParams.delete(k);
    });
    return u.toString();
  } catch {
    return url;
  }
};

const extractCompanyAndLocation = ($, $anchor) => {
  // Walk up to a reasonable container (table or tr) and inspect text lines.
  let $container = $anchor.closest("table");
  if (!$container.length) $container = $anchor.closest("tr");
  if (!$container.length) $container = $anchor.parent();

  const titleText = textOf($anchor);
  const lines = [];
  $container.find("td, span, p, div, a, b, strong, font").each((_, el) => {
    const t = textOf($(el));
    if (!t || t.length > 120) return;
    if (FOOTER_RE.test(t)) return;
    if (t === titleText) return;
    if (!lines.includes(t)) lines.push(t);
  });

  let location = "";
  let companyName = "";
  for (const line of lines) {
    if (!location && CITY_STATE_RE.test(line)) {
      const m = line.match(CITY_STATE_RE);
      location = m ? m[0] : line;
      continue;
    }
  }
  for (const line of lines) {
    if (line === location) continue;
    if (CITY_STATE_RE.test(line)) continue;
    if (/^\d/.test(line)) continue;
    if (/(apply|view job|see job|easy apply|new)/i.test(line)) continue;
    if (line.length < 2 || line.length > 80) continue;
    companyName = line;
    break;
  }

  return { companyName, location };
};

const parseFromSubject = (subject = "") => {
  const clean = subject.replace(/^\s*(new job:|job alert:)\s*/i, "").trim();
  const digest = clean.match(
    /^(.+?)\s+at\s+(.+?)\s+and\s+\d+\s+more\s+jobs?(?:\s+in\s+(.+?))?(?:\s+for you)?\s*$/i
  );
  if (digest) {
    return {
      designation: digest[1].trim(),
      companyName: digest[2].trim(),
      location: (digest[3] || "").trim(),
    };
  }
  const single = clean.match(/^(.+?)\s+at\s+(.+?)(?:\s+in\s+(.+?))?\s*$/i);
  if (single) {
    return {
      designation: single[1].trim(),
      companyName: single[2].trim(),
      location: (single[3] || "").trim(),
    };
  }
  return { designation: clean, companyName: "", location: "" };
};

export const parse = ({ html, text, subject }) => {
  const $ = loadHtml(html);
  const subj = parseFromSubject(subject);

  const seen = new Set();
  const jobs = [];

  $("a[href]").each((_, el) => {
    const $a = $(el);
    const rawHref = $a.attr("href") || "";
    if (!JOB_HREF_RE.test(rawHref)) return;
    const href = stripUtm(rawHref);
    if (seen.has(href)) return;

    const designation = textOf($a);
    if (!designation || designation.length > 200) return;
    if (/(view job|apply|see job|easy apply)/i.test(designation)) return;

    seen.add(href);
    const { companyName, location } = extractCompanyAndLocation($, $a);
    jobs.push({
      designation,
      companyName,
      location,
      applyUrl: href,
      salary: extractSalaryString(text),
      experience: extractExperienceString(text),
      skills: extractSkillsFromText(text),
    });
  });

  if (jobs.length > 1) {
    // Backfill first job's company/location from subject if it was the headline job.
    if (!jobs[0].companyName && subj.companyName && jobs[0].designation === subj.designation) {
      jobs[0].companyName = subj.companyName;
    }
    if (!jobs[0].location && subj.location && jobs[0].designation === subj.designation) {
      jobs[0].location = subj.location;
    }
    for (const job of jobs) {
      if (!job.companyName) job.companyName = "General notification";
    }
    return jobs;
  }

  // Single-job email (or HTML parsing failed): build one record using subject as backstop.
  const only = jobs[0];
  const applyUrl =
    (only && only.applyUrl) || extractFirstUrl(text, "glassdoor.com");
  return {
    companyName: only?.companyName || subj.companyName || "General notification",
    designation: only?.designation || subj.designation,
    location: only?.location || subj.location,
    salary: extractSalaryString(text),
    experience: extractExperienceString(text),
    skills: extractSkillsFromText(text),
    applyUrl,
  };
};
