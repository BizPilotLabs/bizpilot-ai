import { AppError } from "./app-error.js";

export class NotFoundError extends AppError {
  public constructor(path: string) {
    super({
      statusCode: 404,
      message: `Route not found: ${path}`,
      code: "ROUTE_NOT_FOUND",
    });
  }
}
