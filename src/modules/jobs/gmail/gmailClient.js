// modules/jobs/gmail/gmailClient.js

import { google } from "googleapis";
import oAuth2Client from "../../../config/googleClient.js";
import { decrypt } from "../../../utils/encrypt.js";
import ApiError from "../../../utils/ApiError.js";
import { ERROR_CODES } from "../../../constants/errorCodes.js";

export const createGmailClientForUser = (user) => {
  if (!user?.refreshToken) {
    throw new ApiError(401, "Missing Gmail refresh token", ERROR_CODES.GMAIL_AUTH);
  }
  const refreshToken = decrypt(user.refreshToken);
  if (!refreshToken) {
    throw new ApiError(401, "Could not decrypt Gmail refresh token", ERROR_CODES.GMAIL_AUTH);
  }

  // Build a fresh OAuth2 client per request so concurrent users do not share credentials.
  const client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI,
  );
  client.setCredentials({ refresh_token: refreshToken });

  return google.gmail({ version: "v1", auth: client });
};

// Exported so test or scripts can reach the shared client if needed.
export { oAuth2Client };
