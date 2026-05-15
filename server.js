// import dotenv from "dotenv";
// import express from "express";
// import mongoose from "mongoose";
// import nodemailer from "nodemailer";
// import cors from "cors";
// import multer from "multer";

// const storage = multer.memoryStorage(); // store in RAM
// const upload = multer({ storage });

// // mongoose
// //   .connect("mongodb://127.0.0.1:27017/jobCleaner")
// //   .then(() => console.log("MongoDB Connected"))
// //   .catch((err) => console.log(err));

// dotenv.config();
// const app = express();
// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL,
//     methods: ["GET", "POST"],
//   }),
// );
// app.use(express.json());

// app.post("/send-email", upload.single("resume"), async (req, res) => {
//   const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

//   try {
//     const { senderEmail, senderPassword } = req.body;
//     const resumeFile = req.file;

//     let companies;
//     try {
//       companies = JSON.parse(req.body.companies);
//     } catch (err) {
//       return res.status(400).json({
//         message: "Invalid companies format",
//       });
//     }

//     // Validation
//     if (
//       !senderEmail ||
//       !senderPassword ||
//       !Array.isArray(companies) ||
//       companies.length === 0
//     ) {
//       return res.status(400).json({
//         message: "All fields are required",
//       });
//     }

//     if (!resumeFile) {
//       return res.status(400).json({
//         message: "Resume file is required",
//       });
//     }

//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: senderEmail,
//         pass: senderPassword,
//       },
//       tls: {
//         rejectUnauthorized: false,
//       },
//     });

//     for (const company of companies) {
//       const { email, message, subject } = company;

//       if (!email || !message || !subject) continue;

//       const mailOptions = {
//         from: senderEmail,
//         to: email,
//         subject,
//         text: message,
//         attachments: [
//           {
//             filename: resumeFile.originalname,
//             content: resumeFile.buffer,
//           },
//         ],
//       };

//       await transporter.sendMail(mailOptions);
//       await sleep(2000);
//     }

//     return res.json({
//       success: true,
//       message: "Email sent successfully",
//     });
//   } catch (error) {
//     console.log(error.message);
//     return res.status(500).json({
//       success: false,
//       error: error.message,
//     });
//   }
// });

// app.listen(5000, () => console.log("Server running on port 5000"));


// server.js

import "./src/config/env.js"
import mongoose from "mongoose";
import app from "./src/app.js"


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(8000, () => {
      console.log("Server running on port 8000");
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
  });

