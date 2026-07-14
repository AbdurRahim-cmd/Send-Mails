// app.js

import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/authRoutes.js";
import mailRoutes from "./routes/mailRoutes.js";
import jobRoutes from "./modules/jobs/job.routes.js";
import errorHandler from "./middleware/errorHandler.js";
import { limiter } from "./middleware/rateLimiter.js";
import { forceHttps } from "./middleware/forceHttps.js";
import mongoSanitizer from "mongo-sanitizer";
const app = express();

// Trust the reverse proxy (Railway/Nginx/etc.) so req.secure reflects
// the X-Forwarded-Proto header. Required for forceHttps to work in production.
app.set("trust proxy", 1);

app.use(helmet());
app.use(mongoSanitizer.default());
app.use(forceHttps);
app.use(express.json());
app.use(cors());
app.use(limiter);


app.get("/", (req, res) => {
  res.send("SERVER WORKING");
});

app.use("/auth", authRoutes);
app.use("/mail", mailRoutes);
app.use("/jobs", jobRoutes);

app.use(errorHandler);

export default app;
