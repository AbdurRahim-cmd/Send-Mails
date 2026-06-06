// config/logger.js

import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: isDev
    ? {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "SYS:HH:MM:ss" },
      }
    : undefined,
  redact: {
    paths: [
      "req.headers.authorization",
      "*.refreshToken",
      "*.refresh_token",
      "*.access_token",
    ],
    censor: "[REDACTED]",
  },
});

export default logger;
