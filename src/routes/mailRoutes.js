// routes/mailRoutes.js

import express from "express";
import { sendMail } from "../controllers/mailController.js";
import auth from "../middleware/authMiddleware.js";
import limiter from "../middleware/rateLimiter.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/send", auth, limiter, upload.single("resume"), sendMail);

export default router;
