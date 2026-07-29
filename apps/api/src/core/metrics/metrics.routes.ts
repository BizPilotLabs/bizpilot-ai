import crypto from "node:crypto";
import type { Express, RequestHandler } from "express";

import { env } from "../../config/index.js";
import { AppError } from "../errors/index.js";
import { metricsClient } from "./metrics.client.js";

const toBuffer = (value: string): Buffer => Buffer.from(value, "utf8");

const hasValidMetricsToken = (authorizationHeader: string | undefined): boolean => {
  if (env.METRICS_AUTH_TOKEN === undefined) return false;
  const prefix = "Bearer ";
  if (authorizationHeader === undefined || !authorizationHeader.startsWith(prefix)) return false;
  const supplied = toBuffer(authorizationHeader.slice(prefix.length));
  const expected = toBuffer(env.METRICS_AUTH_TOKEN);
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
};

export const metricsRouteHandler: RequestHandler = async (request, response, next) => {
  try {
    if (!hasValidMetricsToken(request.get("authorization"))) {
      throw new AppError({ statusCode: 404, message: "Not found", code: "NOT_FOUND" });
    }

    response.type(metricsClient.contentType()).send(await metricsClient.metrics());
  } catch (error) {
    next(error);
  }
};

export const setupMetricsEndpoint = (app: Express): void => {
  if (!env.METRICS_ENABLED) return;
  app.get(env.METRICS_PATH, metricsRouteHandler);
};