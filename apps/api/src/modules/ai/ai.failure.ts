import { AppError } from "../../core/errors/index.js";

export type AiFailureCode =
  | "AI_DISABLED"
  | "AI_PROVIDER_UNAVAILABLE"
  | "AI_PROVIDER_TIMEOUT"
  | "AI_PROVIDER_INVALID_RESPONSE"
  | "AI_CONTEXT_UNAVAILABLE"
  | "AI_SCOPE_NOT_FOUND"
  | "AI_CONTEXT_PERMISSION_DENIED"
  | "AI_RATE_LIMIT_EXCEEDED"
  | "AI_REQUEST_VALIDATION_FAILED"
  | "AI_READ_ONLY_REFUSED"
  | "AI_INTERNAL_CONTEXT_FAILURE";

export interface AiFailureDefinition {
  code: AiFailureCode;
  statusCode: number;
  message: string;
  resultCategory: string;
  retryable: boolean;
}

export const aiFailureDefinitions: Record<AiFailureCode, AiFailureDefinition> = {
  AI_DISABLED: { code: "AI_DISABLED", statusCode: 503, message: "AI is disabled for this deployment.", resultCategory: "disabled", retryable: false },
  AI_PROVIDER_UNAVAILABLE: { code: "AI_PROVIDER_UNAVAILABLE", statusCode: 503, message: "AI is temporarily unavailable.", resultCategory: "provider_unavailable", retryable: true },
  AI_PROVIDER_TIMEOUT: { code: "AI_PROVIDER_TIMEOUT", statusCode: 504, message: "AI took too long to respond.", resultCategory: "provider_timeout", retryable: true },
  AI_PROVIDER_INVALID_RESPONSE: { code: "AI_PROVIDER_INVALID_RESPONSE", statusCode: 502, message: "AI returned an invalid response.", resultCategory: "provider_invalid_response", retryable: true },
  AI_CONTEXT_UNAVAILABLE: { code: "AI_CONTEXT_UNAVAILABLE", statusCode: 503, message: "AI context is temporarily unavailable.", resultCategory: "context_unavailable", retryable: true },
  AI_SCOPE_NOT_FOUND: { code: "AI_SCOPE_NOT_FOUND", statusCode: 404, message: "The requested AI scope was not found.", resultCategory: "scope_not_found", retryable: false },
  AI_CONTEXT_PERMISSION_DENIED: { code: "AI_CONTEXT_PERMISSION_DENIED", statusCode: 403, message: "You do not have permission to use that AI context.", resultCategory: "permission_denied", retryable: false },
  AI_RATE_LIMIT_EXCEEDED: { code: "AI_RATE_LIMIT_EXCEEDED", statusCode: 429, message: "AI request limit exceeded. Please try again later.", resultCategory: "rate_limited", retryable: true },
  AI_REQUEST_VALIDATION_FAILED: { code: "AI_REQUEST_VALIDATION_FAILED", statusCode: 400, message: "The AI request is invalid.", resultCategory: "request_validation_failed", retryable: false },
  AI_READ_ONLY_REFUSED: { code: "AI_READ_ONLY_REFUSED", statusCode: 200, message: "AI refused a write request.", resultCategory: "read_only_refused", retryable: false },
  AI_INTERNAL_CONTEXT_FAILURE: { code: "AI_INTERNAL_CONTEXT_FAILURE", statusCode: 500, message: "AI could not prepare context safely.", resultCategory: "internal_context_failure", retryable: true }
};

export const createAiError = (code: AiFailureCode, cause?: unknown): AppError => {
  const definition = aiFailureDefinitions[code];
  return new AppError({ statusCode: definition.statusCode, message: definition.message, code, cause });
};

export const getAiFailureCode = (error: unknown): AiFailureCode => {
  if (error instanceof AppError && error.code !== undefined && error.code in aiFailureDefinitions) {
    return error.code as AiFailureCode;
  }

  if (error instanceof AppError && error.statusCode === 403) return "AI_CONTEXT_PERMISSION_DENIED";
  if (error instanceof AppError && error.statusCode === 404) return "AI_SCOPE_NOT_FOUND";
  return "AI_INTERNAL_CONTEXT_FAILURE";
};

export const getAiFailureDefinition = (error: unknown): AiFailureDefinition => aiFailureDefinitions[getAiFailureCode(error)];

export const durationCategory = (durationMs: number): "fast" | "normal" | "slow" | "timeout" => {
  if (durationMs >= 30_000) return "timeout";
  if (durationMs >= 10_000) return "slow";
  if (durationMs >= 2_000) return "normal";
  return "fast";
};
