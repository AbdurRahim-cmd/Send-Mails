// controllers/mailController.js

import User from "../models/userModel.js";
import { decrypt } from "../utils/encrypt.js";
import oAuth2Client from "../config/googleClient.js";
import nodemailer from "nodemailer";

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

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: req.user.email,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: refreshToken,
      },
    });

    await Promise.all(
      emails.map((mail) =>
        transporter.sendMail({
          from: req.user.email,
          to: mail.to,
          subject: mail.subject,
          text: mail.body,
          attachments: resumeFile
            ? [
                {
                  filename: resumeFile.originalname,
                  content: resumeFile.buffer,
                },
              ]
            : [],
        }),
      ),
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
