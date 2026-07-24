import { isAxiosError } from "axios";
import type { ApiErrorResponse } from "../types";

const fallbackMessage = "Something went wrong. Please try again.";

const getResponseMessage = (data: ApiErrorResponse | undefined): string | undefined => {
  const message = data?.error?.message;
  return typeof message === "string" && message.trim().length > 0 ? message : undefined;
};

export const getAuthErrorMessage = (error: unknown): string => {
  if (error instanceof Error && !isAxiosError(error)) {
    return error.message || fallbackMessage;
  }

  if (isAxiosError<ApiErrorResponse>(error)) {
    const status = error.response?.status;
    const message = getResponseMessage(error.response?.data);

    if (status === 401) {
      return "Your email or password was not recognized.";
    }

    if (status === 403) {
      return message ?? "You do not have access to this workspace.";
    }

    if (status === 409) {
      return "An account or organization with these details already exists.";
    }

    return message ?? error.message ?? fallbackMessage;
  }

  return fallbackMessage;
};

