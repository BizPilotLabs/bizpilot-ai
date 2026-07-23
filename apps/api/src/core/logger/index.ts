import pino from "pino";

import { config } from "../../config/index.js";

export const logger = pino({
  level: config.logLevel,
  base: {
    service: "bizpilot-ai-api",
    environment: config.nodeEnv,
  },
  redact: {
    paths: ["req.headers.authorization", "password", "token", "jwt", "secret"],
    remove: true,
  },
});
