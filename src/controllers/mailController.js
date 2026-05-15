// controllers/mailController.js

import User from "../models/userModel.js";
import { decrypt } from "../utils/encrypt.js";
import oAuth2Client from "../config/googleClient.js";
import { google } from "googleapis";

export const sendMail = async (req, res) => {
  try {
    let { emails } = req.body;
    const resumeFile = req.file;

    try {
      emails = JSON.parse(req.body.emails);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid emails format",
      });
    }

    if (!emails || emails.length > 20) {
      return res.status(400).send("Max 20 emails allowed");
    }

    const user = await User.findOne({
      email: req.user.email,
    });

    if (!user) {
      return res.status(404).send("User not found");
    }

    const refreshToken = decrypt(user.refreshToken);

    oAuth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const gmail = google.gmail({
  version: "v1",
  auth: oAuth2Client,
});

await Promise.all(
  emails.map(async (mail) => {
    const messageParts = [
      `From: ${req.user.email}`,
      `To: ${mail.to}`,
      `Subject: ${mail.subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=utf-8",
      "",
      mail.body,
    ];

    const message = messageParts.join("\n");

    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });
  })
);

    res.status(200).json({
      success: true,
      message: "Emails sent successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to send emails",
    });
  }
};
