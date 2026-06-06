// modules/jobs/parsers/linkedin.parser.js
//
// LinkedIn job-alert emails embed N job cards as repeated HTML table blocks.
// Every card has one or more anchors pointing at /jobs/view/<jobId> (often via
// the /comm/ tracking redirect). We dedupe cards by jobId, then walk up to the
// nearest <td>/<table> container to read the title, company, location, and
// Easy Apply badge.

import {
  loadHtml,
  textOf,
  extractSalaryString,
  extractExperienceString,
  extractSkillsFromText,
} from "./base.parser.js";

const JOB_ID_RE = /\/jobs\/view\/(\d+)/i;
const CTA_RE = /^(view job|view jobs?|apply|apply now|easy apply|see all|see more|view all|view\s+\d+\s+more|new)$/i;
const NOISE_RE = /(easy apply|view job|apply now|see job|^new$|promoted|actively reviewing|be (?:an?|one of the) early applicants?|\d+ connections?|alumni works? here|posted \d+|over \d+ applicants)/i;
const LOCATION_HINT_RE = /(remote|hybrid|on[-\s]?site|\b[A-Z][\w.'-]+,\s*[A-Z][\w.'-]+|\b[A-Z][\w.'-]+\s+Area\b|\bIndia\b|\bUnited States\b)/i;
const EASY_APPLY_RE = /easy apply/i;

const extractJobId = (href = "") => {
  const m = href.match(JOB_ID_RE);
  return m ? m[1] : null;
};

// LinkedIn email anchors are tracking redirects. Canonicalize to the public
// /jobs/view/<id>/ URL so downstream dedupe keys are stable across emails.
export const cleanLinkedInJobUrl = (href = "") => {
  const jobId = extractJobId(href);
  if (jobId) return `https://www.linkedin.com/jobs/view/${jobId}/`;
  try {
    const u = new URL(href);
    [...u.searchParams.keys()].forEach((k) => {
      if (/^(trk|trkEmail|midToken|midSig|eid|otpToken|lipi|refId|recommendedFlavor|utm_)/i.test(k)) {
        u.searchParams.delete(k);
      }
    });
    return u.toString();
  } catch {
    return href;
  }
};

const findCardContainer = ($a) => {
  // Walk up until we find a <td> with multiple text lines, otherwise the table.
  let $card = $a.closest("td");
  if (!$card.length || textOf($card).length < (textOf($a).length + 5)) {
    const $table = $a.closest("table");
    if ($table.length) $card = $table;
  }
  if (!$card.length) $card = $a.parent();
  return $card;
};

const collectCardLines = ($, $card, title) => {
  const lines = [];
  $card.find("td, span, p, a, div, strong, b, font, h1, h2, h3").each((_, el) => {
    const t = textOf($(el));
    if (!t) return;
    if (t.length > 140) return;
    if (t === title) return;
    if (CTA_RE.test(t)) return;
    if (NOISE_RE.test(t)) return;
    if (lines.includes(t)) return;
    lines.push(t);
  });
  return lines;
};

const pickLocation = (lines) => {
  for (const line of lines) {
    if (line.length > 80) continue;
    if (LOCATION_HINT_RE.test(line)) return line;
  }
  return "";
};

const pickCompany = (lines, location) => {
  for (const line of lines) {
    if (line === location) continue;
    if (line.length < 2 || line.length > 80) continue;
    if (LOCATION_HINT_RE.test(line)) continue;
    if (/^\d/.test(line)) continue;
    if (/@|unsubscribe|linkedin corporation/i.test(line)) continue;
    return line;
  }
  return "";
};

export const parse = ({ html, text, subject }) => {
  const $ = loadHtml(html);
  const byJobId = new Map();

  $('a[href*="/jobs/view/"]').each((_, el) => {
    const $a = $(el);
    const href = $a.attr("href") || "";
    const jobId = extractJobId(href);
    if (!jobId) return;

    const anchorText = textOf($a);
    const isTitleAnchor = anchorText && !CTA_RE.test(anchorText) && anchorText.length > 2;

    if (!byJobId.has(jobId)) {
      byJobId.set(jobId, {
        jobId,
        designation: "",
        companyName: "",
        location: "",
        applyUrl: cleanLinkedInJobUrl(href),
        easyApply: false,
        _titleAnchor: null,
      });
    }
    const rec = byJobId.get(jobId);
    if (isTitleAnchor && !rec.designation) {
      rec.designation = anchorText;
      rec._titleAnchor = $a;
    }
  });

  const jobs = [];
  for (const rec of byJobId.values()) {
    const $anchor = rec._titleAnchor;
    if ($anchor) {
      const $card = findCardContainer($anchor);
      rec.easyApply = EASY_APPLY_RE.test(textOf($card)) ||
        $card.find('img[alt*="Easy Apply" i]').length > 0;

      const lines = collectCardLines($, $card, rec.designation);
      rec.location = pickLocation(lines);
      rec.companyName = pickCompany(lines, rec.location);
    }

    if (!rec.designation) continue;

    jobs.push({
      designation: rec.designation,
      companyName: rec.companyName,
      location: rec.location,
      applyUrl: rec.applyUrl,
      easyApply: rec.easyApply,
      salary: extractSalaryString(text),
      experience: extractExperienceString(text),
      skills: extractSkillsFromText(text),
    });
  }

  if (jobs.length) return jobs;

  // Fallback: HTML parsing yielded nothing. Surface the subject so the row is
  // still useful, and let the service tag it as a "General notification".
  return [{
    designation: (subject || "").trim(),
    companyName: "",
    location: "",
    applyUrl: "",
    easyApply: false,
    salary: extractSalaryString(text),
    experience: extractExperienceString(text),
    skills: extractSkillsFromText(text),
  }];
};
