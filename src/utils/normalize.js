// utils/normalize.js

const collapseWs = (s) => s.replace(/\s+/g, " ").trim();

export const cleanString = (value) => {
  if (!value || typeof value !== "string") return "";
  return collapseWs(value);
};

export const cleanSkills = (skills) => {
  if (!Array.isArray(skills)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of skills) {
    const s = cleanString(raw);
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
};

export const cleanSalary = (value) => {
  const s = cleanString(value);
  if (!s) return "";
  // strip surrounding labels like "Salary:" or "CTC -"
  return s.replace(/^(salary|ctc|package)\s*[:\-]\s*/i, "");
};

export const cleanExperience = (value) => {
  const s = cleanString(value);
  if (!s) return "";
  return s.replace(/^(experience|exp)\s*[:\-]\s*/i, "");
};

export const cleanLocation = (value) => {
  const s = cleanString(value);
  if (!s) return "";
  return s.replace(/^(location|based in)\s*[:\-]\s*/i, "");
};

export const normalizeJob = (raw) => ({
  companyName: cleanString(raw.companyName),
  designation: cleanString(raw.designation),
  salary: cleanSalary(raw.salary),
  location: cleanLocation(raw.location),
  experience: cleanExperience(raw.experience),
  skills: cleanSkills(raw.skills),
  applyUrl: cleanString(raw.applyUrl),
  easyApply: raw.easyApply === true,
});
