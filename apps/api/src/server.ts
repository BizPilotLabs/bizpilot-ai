import http from "node:http";

import { createApp } from "./app.js";
import { config } from "./config/index.js";
import { connectDatabase, disconnectDatabase } from "./core/database/index.js";
import { logger } from "./core/logger/index.js";

const app = createApp();
const server = http.createServer(app);

let isShuttingDown = false;

const shutdown = (signal: NodeJS.Signals): void => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.info({ signal }, "Shutdown signal received");

  const shutdownTimeout = setTimeout(() => {
    logger.error("Graceful shutdown timed out");
    process.exit(1);
  }, config.shutdownTimeoutMs);

  server.close((serverError?: Error) => {
    void (async (): Promise<void> => {
      try {
        if (serverError) {
          logger.error({ err: serverError }, "HTTP server shutdown failed");
          process.exitCode = 1;
        }

        await disconnectDatabase();
        logger.info("Application shutdown completed");
      } catch (error) {
        logger.error({ err: error }, "Application shutdown failed");
        process.exitCode = 1;
      } finally {
        clearTimeout(shutdownTimeout);
        process.exit();
      }
    })();
  });
};

const bootstrap = async (): Promise<void> => {
  try {
    await connectDatabase();

    server.listen(config.port, config.host, () => {
      logger.info(
        { host: config.host, port: config.port, environment: config.nodeEnv },
        "API server listening",
      );
    });
  } catch (error) {
    logger.fatal({ err: error }, "Application startup failed");
    await disconnectDatabase();
    process.exit(1);
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

process.on("unhandledRejection", (reason: unknown) => {
  logger.fatal({ err: reason }, "Unhandled promise rejection");
  shutdown("SIGTERM");
});

process.on("uncaughtException", (error: Error) => {
  logger.fatal({ err: error }, "Uncaught exception");
  shutdown("SIGTERM");
});

void bootstrap();
