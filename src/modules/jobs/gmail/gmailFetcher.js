// modules/jobs/gmail/gmailFetcher.js

import { buildTodayJobQuery } from "../../../constants/jobPortals.js";

const decodeBase64Url = (data = "") => {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf-8");
};

// Recursively walks the Gmail payload tree to collect first html and plain text bodies.
const walkParts = (part, acc) => {
  if (!part) return;
  const mime = part.mimeType || "";
  const data = part.body?.data;
  if (data) {
    if (mime === "text/html" && !acc.html) acc.html = decodeBase64Url(data);
    if (mime === "text/plain" && !acc.text) acc.text = decodeBase64Url(data);
  }
  if (Array.isArray(part.parts)) {
    for (const child of part.parts) walkParts(child, acc);
  }
};

const headerValue = (headers, name) => {
  const h = headers?.find((x) => x.name?.toLowerCase() === name.toLowerCase());
  return h?.value || "";
};

export const listTodayJobMessageIds = async (gmail) => {
  const ids = [];
  let pageToken;
  const q = buildTodayJobQuery();
  do {
    const { data } = await gmail.users.messages.list({
      userId: "me",
      q,
      maxResults: 100,
      pageToken,
    });
    if (Array.isArray(data.messages)) {
      for (const m of data.messages) ids.push(m.id);
    }
    pageToken = data.nextPageToken;
  } while (pageToken);
  return ids;
};

export const getMessage = async (gmail, id) => {
  const { data } = await gmail.users.messages.get({
    userId: "me",
    id,
    format: "full",
  });

  const headers = data.payload?.headers || [];
  const acc = { html: "", text: "" };
  walkParts(data.payload, acc);

  return {
    messageId: data.id,
    threadId: data.threadId,
    snippet: data.snippet || "",
    from: headerValue(headers, "From"),
    subject: headerValue(headers, "Subject"),
    date: data.internalDate ? new Date(Number(data.internalDate)) : new Date(),
    html: acc.html,
    text: acc.text,
  };
};
