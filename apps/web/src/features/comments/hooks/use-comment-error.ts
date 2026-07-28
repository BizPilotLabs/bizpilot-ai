import { AxiosError } from "axios";
import type { ApiErrorResponse } from "../types";

export function getCommentErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    const message = data?.error?.message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return "Something went wrong while working with comments.";
}