import { isAxiosError } from "axios";
import type { ApiErrorResponse } from "../types";

const fallbackMessage = "Something went wrong. Please try again.";

export const getAuthErrorMessage = (error: unknown): string => {
  if (error instanceof Error && !isAxiosError(error)) {
    return error.message;
  }

  if (isAxiosError<ApiErrorResponse>(error)) {
    const status = error.response?.status;
    const message = error.response?.data.error.message;

    if (status === 401) {
      return "Your email or password was not recognized.";
    }

    if (status === 403) {
      return message ?? "You do not have access to this workspace.";
    }

    if (status === 409) {
      return "An account or organization with these details already exists.";
    }

    return message ?? fallbackMessage;
  }

  return fallbackMessage;
};

