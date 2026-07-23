export interface AppErrorOptions {
  statusCode: number;
  message: string;
  code?: string;
  cause?: unknown;
  isOperational?: boolean;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string | undefined;
  public readonly isOperational: boolean;

  public constructor(options: AppErrorOptions) {
    super(options.message, { cause: options.cause });
    this.name = new.target.name;
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.isOperational = options.isOperational ?? true;

    Error.captureStackTrace(this, new.target);
  }
}