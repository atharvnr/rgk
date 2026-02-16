import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";

type ApiError = FetchBaseQueryError | SerializedError | undefined;

function extractDetail(data: unknown): string | undefined {
  if (
    typeof data === "object" &&
    data !== null &&
    "detail" in data &&
    typeof (data as { detail: unknown }).detail === "string"
  ) {
    return (data as { detail: string }).detail;
  }
  return undefined;
}

export function getErrorMessage(
  error: ApiError,
  fallback = "Something went wrong"
): string {
  if (!error) return fallback;

  // SerializedError (client-side errors)
  if ("message" in error && !("status" in error)) {
    return error.message || fallback;
  }

  // FetchBaseQueryError
  if ("status" in error) {
    // Network error
    if (error.status === "FETCH_ERROR") {
      return "Unable to connect. Please check your internet connection.";
    }

    if (error.status === "PARSING_ERROR") {
      return fallback;
    }

    // HTTP status codes
    if (typeof error.status === "number") {
      const detail = extractDetail(error.data);

      if (error.status === 401) {
        return "Session expired. Please log in again.";
      }

      if (error.status === 403) {
        if (detail && /identity.+verif/i.test(detail)) {
          return "Your identity hasn't been verified yet. Contact your school admin.";
        }
        return detail || "You don't have permission to do that.";
      }

      if (error.status === 400) {
        return detail || "Invalid request. Please check your input.";
      }

      if (error.status === 404) {
        return detail || "The requested resource was not found.";
      }

      if (error.status === 422) {
        return detail || "Invalid request. Please check your input.";
      }

      if (error.status >= 500) {
        return "Server error. Please try again later.";
      }

      return detail || fallback;
    }
  }

  return fallback;
}
