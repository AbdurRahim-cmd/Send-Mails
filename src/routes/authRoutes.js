// routes/authRoutes.js

import express from "express";
import {
  googleAuth,
  googleCallback,
} from "../controllers/authController.js";

const router = express.Router();

router.get("/test", (req, res) => {
  res.send("Auth route working");
});

router.get("/google", googleAuth);
router.get("/callback", googleCallback);

export default router;