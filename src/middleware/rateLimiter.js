// middleware/rateLimiter.js

import rateLimit from "express-rate-limit";

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // maximum 50 requests per IP
  message: "Too many requests, please try again later",
});

export const pdfRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // Timer is set to 1 Hour (60 mins * 60 secs * 1000 ms)
  limit: 5, // A user can only upload 5 PDFs in one hour
  message: "Arrey dost! You are uploading too many heavy PDFs. Please wait for 1 hour to give the server some rest!",
  standardHeaders: true, // This tells the good users how many tries they have left
  legacyHeaders: false // We turn off old settings we don't need
});



