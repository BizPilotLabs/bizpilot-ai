import compression from "compression";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";

import { config } from "./config/index.js";
import { errorHandler, notFoundHandler, requestLogger } from "./core/middleware/index.js";
import { routes } from "./routes.js";

export const createApp = (): Express => {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(requestLogger);
  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  app.use(routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
