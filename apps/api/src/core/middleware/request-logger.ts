import { pinoHttp, type Options } from "pino-http";

import { logger } from "../logger/index.js";

const requestLoggerOptions: Options = {
  logger,
  customLogLevel: (_request, response, error) => {
    if (error !== undefined || response.statusCode >= 500) {
      return "error";
    }

    if (response.statusCode >= 400) {
      return "warn";
    }

    return "info";
  },
};

export const requestLogger = pinoHttp(requestLoggerOptions);