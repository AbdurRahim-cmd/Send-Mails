// modules/jobs/parsers/wellfound.parser.js

import {
  loadHtml,
  textOf,
  extractFirstUrl,
  extractSalaryString,
  extractExperienceString,
  extractSkillsFromText,
} from "./base.parser.js";

export const parse = ({ html, text, subject }) => {
  const $ = loadHtml(html);

  const titleAnchor = $('a[href*="wellfound.com/jobs"], a[href*="angel.co/jobs"]').first();
  const designation = textOf(titleAnchor) || subject || "";

  let companyName = textOf($('a[href*="wellfound.com/company"], a[href*="angel.co/company"]').first());
  if (!companyName) companyName = textOf(titleAnchor.parent().next());

  let location = "";
  $("span, td, div, p").each((_, el) => {
    if (location) return;
    const t = textOf($(el));
    if (/(Remote|[A-Z][a-z]+,\s?[A-Z])/.test(t) && t.length < 80) location = t;
  });

  const applyUrl = titleAnchor.attr("href") || extractFirstUrl(text, "wellfound.com");

  return {
    companyName,
    designation,
    salary: extractSalaryString(text),
    location,
    experience: extractExperienceString(text),
    skills: extractSkillsFromText(text),
    applyUrl,
  };
};
