import { isAxiosError } from "axios";

const fallbackMessage = "AI request failed. Please try again.";

const messagesByCode: Record<string, string> = {
  AI_DISABLED: "AI is disabled for this workspace environment.",
  AI_PROVIDER_UNAVAILABLE: "AI is temporarily unavailable. Normal workspace features are still available.",
  AI_PROVIDER_TIMEOUT: "AI took too long to respond. Please retry in a moment.",
  AI_PROVIDER_INVALID_RESPONSE: "AI returned a response that could not be verified safely.",
  AI_CONTEXT_UNAVAILABLE: "Copilot could not load the workspace context safely.",
  AI_SCOPE_NOT_FOUND: "That project or task is unavailable, deleted, or outside your organization.",
  AI_CONTEXT_PERMISSION_DENIED: "You do not have permission to use that Copilot context.",
  AI_RATE_LIMIT_EXCEEDED: "Copilot is receiving too many requests. Please wait before trying again.",
  AI_REQUEST_VALIDATION_FAILED: "Please check your question and scope, then try again.",
  AI_READ_ONLY_REFUSED: "Copilot can answer questions, but it cannot perform actions.",
  AI_INTERNAL_CONTEXT_FAILURE: "Copilot could not prepare a safe answer right now.",
  RBAC_PERMISSION_DENIED: "You do not have permission to use BizPilot AI Copilot.",
  VALIDATION_ERROR: "Please check your question and scope, then try again."
};

const readApiError = (data: unknown): { code?: string | undefined; message?: string | undefined } => {
  if (typeof data !== "object" || data === null || !("error" in data)) return {};
  const apiError = data.error;
  if (typeof apiError !== "object" || apiError === null) return {};
  return {
    ...(typeof (apiError as { code?: unknown }).code === "string" ? { code: (apiError as { code: string }).code } : {}),
    ...(typeof (apiError as { message?: unknown }).message === "string" ? { message: (apiError as { message: string }).message } : {})
  };
};

export const getAiErrorCode = (error: unknown): string | undefined => {
  if (!isAxiosError(error)) return undefined;
  return readApiError(error.response?.data).code;
};

export const getAiRetryAfterSeconds = (error: unknown): number | undefined => {
  if (!isAxiosError(error)) return undefined;
  const raw = error.response?.headers?.["retry-after"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

export const isAiRetryableError = (error: unknown): boolean => {
  const code = getAiErrorCode(error);
  return code === "AI_PROVIDER_UNAVAILABLE" || code === "AI_PROVIDER_TIMEOUT" || code === "AI_CONTEXT_UNAVAILABLE" || code === "AI_RATE_LIMIT_EXCEEDED" || code === "AI_PROVIDER_INVALID_RESPONSE";
};

export const getAiErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    const { code, message } = readApiError(error.response?.data);
    const mapped = code === undefined ? undefined : messagesByCode[code];
    const retryAfter = getAiRetryAfterSeconds(error);
    const baseMessage = mapped ?? message ?? fallbackMessage;
    if (code === "AI_RATE_LIMIT_EXCEEDED" && retryAfter !== undefined) return `${baseMessage} Try again in about ${retryAfter} seconds.`;
    if (error.code === "ECONNABORTED") return messagesByCode.AI_PROVIDER_TIMEOUT ?? "The AI provider took too long to respond.";
    return baseMessage;
  }

  if (error instanceof Error && error.message.length > 0) return error.message;
  return fallbackMessage;
};

