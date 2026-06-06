// modules/jobs/parsers/naukri.parser.js

import {
  loadHtml,
  textOf,
  pickByLabel,
  extractFirstUrl,
  extractSalaryString,
  extractExperienceString,
  extractSkillsFromText,
} from "./base.parser.js";

export const parse = ({ html, text, subject }) => {
  const $ = loadHtml(html);

  // Naukri emails commonly wrap each job in a table; the designation is the first prominent link.
  const titleAnchor = $('a[href*="naukri.com"]').filter((_, el) => textOf($(el)).length > 5).first();
  const designation = textOf(titleAnchor) || subject || "";

  // Company is usually right below the title in bold text.
  let companyName = textOf(titleAnchor.parent().nextAll().find("b").first());
  if (!companyName) companyName = textOf($("b").first());

  const root = titleAnchor.closest("table");
  const experience = pickByLabel($, root, ["Experience", "Exp"]) || extractExperienceString(text);
  const location = pickByLabel($, root, ["Location"]);
  const salary = pickByLabel($, root, ["Salary", "CTC"]) || extractSalaryString(text);
  const skillsLabel = pickByLabel($, root, ["Key Skills", "Skills"]);
  const skills = skillsLabel
    ? skillsLabel
        .split(/[,;|/]/)
        .map((s) => s.trim())
        .filter(Boolean)
    : extractSkillsFromText(text);

  const applyUrl = titleAnchor.attr("href") || extractFirstUrl(text, "naukri.com");

  return { companyName, designation, salary, location, experience, skills, applyUrl };
};
