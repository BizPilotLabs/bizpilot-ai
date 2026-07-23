import { PrismaClient } from "@prisma/client";

import { config } from "../../config/index.js";
import { logger } from "../logger/index.js";

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.databaseUrl,
    },
  },
  log: config.isProduction ? ["error"] : ["query", "error", "warn"],
});

export const connectDatabase = async (): Promise<void> => {
  await prisma.$connect();
  logger.info("Database connection established");
};

export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
  logger.info("Database connection closed");
};
