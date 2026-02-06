import dotenv from "dotenv";
import express from "express";
// import { google } from "googleapis";
// import Job from "./job.schema.js";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import cors from "cors";

// mongoose
//   .connect("mongodb://127.0.0.1:27017/jobCleaner")
//   .then(() => console.log("MongoDB Connected"))
//   .catch((err) => console.log(err));

dotenv.config();
const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
  })
);
app.use(express.json());

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// const oauth2Client = new google.auth.OAuth2(
//   process.env.CLIENT_ID,
//   process.env.CLIENT_SECRET,
//   process.env.REDIRECT_URI
// );

// // Step 1: Login route
// app.get("/auth/google", (req, res) => {
//   const url = oauth2Client.generateAuthUrl({
//     access_type: "offline",
//     scope: ["https://www.googleapis.com/auth/gmail.readonly"],
//   });
//   res.redirect(url);
// });

// // Step 2: Callback route
// app.get("/auth/google/callback", async (req, res) => {
//   try {
//     const code = req.query.code;
//     const seenJobs = new Set();
//     const newJobs = [];

//     // ===== STEP 1: Auth & Gmail Setup =====
//     const { tokens } = await oauth2Client.getToken(code);
//     oauth2Client.setCredentials(tokens);

//     const gmail = google.gmail({ version: "v1", auth: oauth2Client });

//     // ===== STEP 2: Fetch Job Email List =====
//     const list = await gmail.users.messages.list({
//       userId: "me",
//       maxResults: 5,
//       q: "from:naukri.com OR from:indeed.com OR from:foundit.in",
//     });

//     const messages = list.data.messages || [];

//     // ===== HELPER: Extract Email Body =====
//     async function getEmailBody(payload) {
//       function extract(parts) {
//         for (const part of parts) {
//           if (part.mimeType === "text/html" && part.body?.data) {
//             return Buffer.from(
//               part.body.data.replace(/-/g, "+").replace(/_/g, "/"),
//               "base64"
//             ).toString("utf8");
//           }
//           if (part.parts) {
//             const result = extract(part.parts);
//             if (result) return result;
//           }
//         }
//         return "";
//       }

//       if (payload.parts) return extract(payload.parts);
//       if (payload.body?.data) {
//         return Buffer.from(payload.body.data, "base64").toString("utf8");
//       }
//       return "";
//     }

//     // ===== STEP 3: Process Each Email =====
//     for (let msg of messages) {
//       const email = await gmail.users.messages.get({
//         userId: "me",
//         id: msg.id,
//       });

//       const headers = email.data.payload.headers;
//       const subject = headers.find((h) => h.name === "Subject")?.value || "";
//       const from = headers.find((h) => h.name === "From")?.value || "";

//       const body = await getEmailBody(email.data.payload);

//       console.log("📩 Subject:", subject);
//       console.log("📧 From:", from);
//       console.log("📝 Body preview:", body.substring(0, 200));

//       // ===== STEP 4: Extract Job Info =====
//       let location = subject.match(/\((.*?)\)/)?.[1] || "Not found";

//       let company =
//         subject.match(/at\s([A-Za-z0-9 &]+)/i)?.[1] ||
//         subject.split("-")[1]?.trim() ||
//         "Unknown";

//       let title = subject
//         .replace(/\(.*?\)/g, "")
//         .replace(/at\s[A-Za-z0-9 &]+/i, "")
//         .split("-")[0]
//         .trim();

//       const fingerprint = (title + company + location)
//         .toLowerCase()
//         .replace(/\s/g, "");

//       // ===== STEP 5: Duplicate Checks =====
//       if (seenJobs.has(fingerprint)) {
//         console.log("❌ Duplicate in same run");
//         continue;
//       }
//       seenJobs.add(fingerprint);

//       const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

//       const existingJob = await Job.findOne({
//         fingerprint,
//         createdAt: { $gte: yesterday },
//       });

//       if (existingJob) {
//         console.log("❌ Duplicate in DB (24h)");
//         continue;
//       }

//       // ===== STEP 6: Save Job =====
//       await Job.create({
//         fingerprint,
//         title,
//         company,
//         location,
//         source: "gmail",
//       });

//       console.log("✅ New job stored");

//       newJobs.push({ title, company, location });
//     }

//     // ===== STEP 7: Send Summary Email =====
//     if (newJobs.length > 0) {
//       const jobList = newJobs
//         .map((j, i) => `${i + 1}. ${j.title} - ${j.company} - ${j.location}`)
//         .join("\n");

//       await transporter.sendMail({
//         from: process.env.EMAIL_USER,
//         to: process.env.EMAIL_USER,
//         subject: `🔥 ${newJobs.length} New Jobs Found`,
//         text: jobList,
//       });

//       console.log("📧 Summary email sent");
//     } else {
//       console.log("No new jobs today");
//     }

//     res.send("Emails fetched successfully");
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Error occurred");
//   }
// });

app.post("/send-email", async (req, res) => {
  const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  try {
    const { senderEmail, senderPassword, companies } = req.body;

    // Step 1: validation
    if (
      !senderEmail ||
      !senderPassword ||
      !Array.isArray(companies) ||
      companies.length === 0
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Step 2: login as candidate
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: senderEmail, // FROM (candidate)
        pass: senderPassword, // App password
      },
    });

    for (const company of companies) {
      const { email, message, subject } = company;

      if (!email || !message || !subject) continue;

      const mailOptions = {
        from: senderEmail,
        to: email,
        subject,
        text: message,
      };

      await transporter.sendMail(mailOptions);
      await sleep(2000);
    }

    return res.json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// app.listen(3000, () => {
//   console.log("Server running on port 3000");
// });

app.listen(5000, () => console.log("Server running on port 5000"));
