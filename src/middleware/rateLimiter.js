// middleware/rateLimiter.js

import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // maximum 50 requests per IP
  message: "Too many requests, please try again later",
});

export default limiter;