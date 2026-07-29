import { isAxiosError } from "axios";

const fallbackMessage = "AI request failed. Please try again.";

export const getAiErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === "object" && data !== null && "error" in data) {
      const apiError = data.error;
      if (typeof apiError === "object" && apiError !== null && "message" in apiError && typeof apiError.message === "string") {
        return apiError.message;
      }
    }
    if (error.code === "ECONNABORTED") return "The AI provider took too long to respond.";
  }

  if (error instanceof Error && error.message.length > 0) return error.message;
  return fallbackMessage;
};
