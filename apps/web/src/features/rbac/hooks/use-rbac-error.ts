import { isAxiosError } from "axios";
import type { ApiErrorResponse } from "../types";

const fallbackMessage = "RBAC request failed. Please try again.";

const getResponseMessage = (data: ApiErrorResponse | undefined): string | undefined => {
  const message = data?.error?.message;
  return typeof message === "string" && message.trim().length > 0 ? message : undefined;
};

export const getRbacErrorCode = (error: unknown): string | undefined => {
  if (!isAxiosError<ApiErrorResponse>(error)) {
    return undefined;
  }

  const code = error.response?.data?.error?.code;
  return typeof code === "string" && code.trim().length > 0 ? code : undefined;
};

export const getRbacErrorMessage = (error: unknown): string => {
  if (error instanceof Error && !isAxiosError(error)) {
    return error.message || fallbackMessage;
  }

  if (isAxiosError<ApiErrorResponse>(error)) {
    return getResponseMessage(error.response?.data) ?? error.message ?? fallbackMessage;
  }

  return fallbackMessage;
};
