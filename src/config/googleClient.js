// config/googleClient.js

import "./env.js";
import { google } from "googleapis";

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI,
);

console.log("CLIENT_ID:", process.env.CLIENT_ID);
console.log("CLIENT_SECRET:", process.env.CLIENT_SECRET);
console.log("REDIRECT_URI:", process.env.REDIRECT_URI);

export default oAuth2Client;
