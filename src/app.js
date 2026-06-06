// app.js

import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/authRoutes.js";
import mailRoutes from "./routes/mailRoutes.js";
import jobRoutes from "./modules/jobs/job.routes.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("SERVER WORKING");
});

app.use("/auth", authRoutes);
app.use("/mail", mailRoutes);
app.use("/jobs", jobRoutes);

app.use(errorHandler);

export default app;
