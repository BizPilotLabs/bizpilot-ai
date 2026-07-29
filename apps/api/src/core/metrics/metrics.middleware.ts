import { performance } from "node:perf_hooks";
import type { RequestHandler } from "express";

import { env } from "../../config/index.js";
import { metricsClient, normalizeMetricRoute, statusClass } from "./metrics.client.js";

export const httpMetrics: RequestHandler = (request, response, next) => {
  if (env.METRICS_ENABLED && request.path === env.METRICS_PATH) {
    next();
    return;
  }

  const startedAt = performance.now();
  metricsClient.incrementActiveHttpRequests();

  response.on("finish", () => {
    const durationSeconds = (performance.now() - startedAt) / 1000;
    const routePath = typeof request.route?.path === "string" ? `${request.baseUrl}${request.route.path}` : undefined;
    metricsClient.recordHttpRequest({ method: request.method, route: normalizeMetricRoute(request.method, request.originalUrl, routePath), statusClass: statusClass(response.statusCode) }, durationSeconds);
    metricsClient.decrementActiveHttpRequests();
  });

  response.on("close", () => {
    if (!response.writableEnded) {
      const durationSeconds = (performance.now() - startedAt) / 1000;
      metricsClient.recordHttpRequest({ method: request.method, route: normalizeMetricRoute(request.method, request.originalUrl), statusClass: statusClass(response.statusCode || 499) }, durationSeconds);
      metricsClient.decrementActiveHttpRequests();
    }
  });

  next();
};