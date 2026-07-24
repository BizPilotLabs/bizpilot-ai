import { isAxiosError } from "axios";
import type { ApiErrorResponse } from "../types";

const fallbackMessage = "Task request failed. Please try again.";

const getResponseMessage = (data: ApiErrorResponse | undefined): string | undefined => {
  const message = data?.error?.message;
  return typeof message === "string" && message.trim().length > 0 ? message : undefined;
};

export const getTaskErrorMessage = (error: unknown): string => {
  if (error instanceof Error && !isAxiosError(error)) {
    return error.message || fallbackMessage;
  }

  if (isAxiosError<ApiErrorResponse>(error)) {
    return getResponseMessage(error.response?.data) ?? error.message ?? fallbackMessage;
  }

  return fallbackMessage;
};

