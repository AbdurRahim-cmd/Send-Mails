import "./src/config/env.js"
import mongoose from "mongoose";
import app from "./src/app.js"

console.log("MONGO_URI =", process.env.MONGO_URI ? "FOUND" : "NOT FOUND");

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");

    app.listen(8000, () => {
      console.log("Server running on port 8000");
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
  });

