// modules/jobs/parsers/indeed.parser.js

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

  const titleAnchor = $('a[href*="indeed.com/rc/clk"], a[href*="indeed.com/viewjob"]').first();
  const designation = textOf(titleAnchor) || subject || "";

  let companyName = "";
  $("span, td, div").each((_, el) => {
    if (companyName) return;
    const t = textOf($(el));
    // Indeed often shows "Company - Location"
    const m = t.match(/^([^-\n]{2,80})\s+-\s+([A-Z][^\n]{1,80})$/);
    if (m) companyName = m[1].trim();
  });

  let location = "";
  $("span, td, div").each((_, el) => {
    if (location) return;
    const t = textOf($(el));
    if (/[A-Z][a-z]+,\s?[A-Z]{2}/.test(t) && t.length < 80) location = t;
  });

  const applyUrl = titleAnchor.attr("href") || extractFirstUrl(text, "indeed.com");

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
