import axios from "axios";

const GENERIC_SERVER_MESSAGES = new Set([
  "Internal server error",
  "Unexpected server error",
]);

const getApiErrorPayload = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string; requestId?: string } | undefined) || undefined;
  }

  return undefined;
};

export const getApiErrorDetails = (error: unknown, fallback: string) => {
  const payload = getApiErrorPayload(error);
  const requestId = payload?.requestId?.trim() || null;

  if (axios.isAxiosError(error)) {
    const serverMessage = payload?.message?.trim();
    const status = error.response?.status;

    if (status && status >= 500 && (!serverMessage || GENERIC_SERVER_MESSAGES.has(serverMessage))) {
      return { message: fallback, requestId };
    }

    return { message: serverMessage || error.message || fallback, requestId };
  }

  if (error instanceof Error) {
    return { message: error.message, requestId };
  }

  return { message: fallback, requestId };
};

export const getErrorMessage = (error: unknown, fallback: string) => {
  return getApiErrorDetails(error, fallback).message;
};
