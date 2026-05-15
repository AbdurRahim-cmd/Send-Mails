import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { google } from "googleapis";
import oAuth2Client from "../config/googleClient.js";
import { encrypt } from "../utils/encrypt.js";

export const googleAuth = (req, res) => {
  const url = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/userinfo.email",
      "openid",
    ],
  });

  res.redirect(url);
};

export const googleCallback = async (req, res) => {
  try {
    const { code } = req.query;

    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    console.log("TOKENS:", tokens);

    const oauth2 = google.oauth2({
      auth: oAuth2Client,
      version: "v2",
    });

    const userInfo = await oauth2.userinfo.get();

    const email = userInfo.data.email;

    const encryptedToken = encrypt(tokens.refresh_token);

    await User.findOneAndUpdate(
      { email },
      { refreshToken: encryptedToken },
      { upsert: true, returnDocument: "after" },
    );

    const jwtToken = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

   res.redirect(
  `${process.env.FRONTEND_URL}/form?token=${jwtToken}&email=${email}`
);
  } catch (error) {
    console.error("FULL GOOGLE OAUTH ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Google OAuth failed",
      error: error.message,
    });
  }
};
