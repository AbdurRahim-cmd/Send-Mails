// app.js

import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import mailRoutes from "./routes/mailRoutes.js";

const app = express();

app.use(express.json());
// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL, // your frontend URL
//     methods: ["GET", "POST"],
//     credentials: true,
//   })
// );

// console.log(process.env.FRONTEND_URL)

app.use(cors());
app.get("/", (req, res) => {
  res.send("SERVER WORKING");
});

app.use("/auth", authRoutes);
app.use("/mail", mailRoutes);

export default app;