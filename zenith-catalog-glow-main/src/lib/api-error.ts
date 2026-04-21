import axios from "axios";

const GENERIC_SERVER_MESSAGES = new Set([
  "Internal server error",
  "Unexpected server error",
]);

export const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const serverMessage = (error.response?.data as { message?: string } | undefined)?.message?.trim();
    const status = error.response?.status;

    if (status && status >= 500 && (!serverMessage || GENERIC_SERVER_MESSAGES.has(serverMessage))) {
      return fallback;
    }

    return serverMessage || error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};
