import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { config } from "../../config/index.js";
import { AppError } from "../errors/index.js";
import { logger } from "../logger/index.js";

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

const toErrorResponse = (error: unknown): { statusCode: number; body: ErrorResponse } => {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      body: {
        success: false,
        error: {
          message: error.message,
          code: error.code ?? "APPLICATION_ERROR",
        },
      },
    };
  }

  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      body: {
        success: false,
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: error.flatten(),
        },
      },
    };
  }

  return {
    statusCode: 500,
    body: {
      success: false,
      error: {
        message: config.isProduction ? "Internal server error" : error instanceof Error ? error.message : "Unknown error",
        code: "INTERNAL_SERVER_ERROR",
      },
    },
  };
};

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  const { statusCode, body } = toErrorResponse(error);

  if (statusCode >= 500) {
    logger.error({ err: error, method: request.method, path: request.path }, "Request failed");
  } else {
    logger.warn({ err: error, method: request.method, path: request.path }, "Request rejected");
  }

  response.status(statusCode).json(body);
};