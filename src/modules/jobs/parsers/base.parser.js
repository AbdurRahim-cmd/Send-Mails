// modules/jobs/parsers/base.parser.js

import * as cheerio from "cheerio";

export const loadHtml = (html) => cheerio.load(html || "", { decodeEntities: true });

export const textOf = ($el) => ($el?.text() || "").replace(/\s+/g, " ").trim();

export const extractFirstUrl = (text = "", hostnameHint = "") => {
  const regex = /https?:\/\/[^\s"'<>]+/gi;
  const urls = text.match(regex) || [];
  if (!hostnameHint) return urls[0] || "";
  const hit = urls.find((u) => u.toLowerCase().includes(hostnameHint));
  return hit || urls[0] || "";
};

export const pickByLabel = ($, root, labels) => {
  const lowered = labels.map((l) => l.toLowerCase());
  let value = "";
  $(root)
    .find("td, li, p, div, span")
    .each((_, el) => {
      const txt = ($(el).text() || "").trim();
      if (!txt) return;
      const lower = txt.toLowerCase();
      for (const label of lowered) {
        if (lower.startsWith(label)) {
          const stripped = txt.replace(new RegExp(`^${label}\\s*[:\\-]?\\s*`, "i"), "").trim();
          if (stripped) {
            value = stripped;
            return false;
          }
        }
      }
      return undefined;
    });
  return value;
};

export const extractSalaryString = (text = "") => {
  const m = text.match(
    /(?:salary|ctc|package)\s*[:\-]?\s*([₹$€£]?\s?[\d.,]+\s?(?:lakh|lakhs|lpa|k|cr|crore|usd|inr|per\s?(?:annum|year|month))?(?:\s?-\s?[₹$€£]?\s?[\d.,]+\s?(?:lakh|lakhs|lpa|k|cr|crore|usd|inr|per\s?(?:annum|year|month))?)?)/i,
  );
  return m?.[1]?.trim() || "";
};

export const extractExperienceString = (text = "") => {
  const m = text.match(/(\d+\s?(?:-|to)\s?\d+\+?\s?(?:years|yrs))|(\d+\+?\s?(?:years|yrs))/i);
  return m?.[0]?.trim() || "";
};

export const extractSkillsFromText = (text = "") => {
  const m = text.match(/skills?\s*[:\-]\s*([^\n\r]+)/i);
  if (!m) return [];
  return m[1]
    .split(/[,;|/]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
};
