// middleware/errorHandler.js

import { ZodError } from "zod";
import ApiError from "../utils/ApiError.js";
import logger from "../config/logger.js";
import { ERROR_CODES } from "../constants/errorCodes.js";

const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      code: ERROR_CODES.VALIDATION,
      issues: err.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
  }

  if (err?.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Duplicate resource",
      code: ERROR_CODES.DUPLICATE,
    });
  }

  logger.error({ err }, "Unhandled error");
  return res.status(500).json({
    success: false,
    message: "Something went wrong",
    code: ERROR_CODES.INTERNAL,
  });
};

export default errorHandler;
