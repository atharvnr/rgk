import { getErrorMessage } from "../src/utils/errorMessages";

describe("getErrorMessage", () => {
  it("returns fallback for undefined error", () => {
    expect(getErrorMessage(undefined)).toBe("Something went wrong");
  });

  it("returns custom fallback for undefined error", () => {
    expect(getErrorMessage(undefined, "Custom fallback")).toBe(
      "Custom fallback"
    );
  });

  // Network errors
  it("returns network error message for FETCH_ERROR", () => {
    const error = { status: "FETCH_ERROR" as const, error: "Failed to fetch" };
    expect(getErrorMessage(error)).toBe(
      "Unable to connect. Please check your internet connection."
    );
  });

  it("returns fallback for PARSING_ERROR", () => {
    const error = {
      status: "PARSING_ERROR" as const,
      originalStatus: 200,
      data: "not json",
      error: "parse error",
    };
    expect(getErrorMessage(error)).toBe("Something went wrong");
  });

  // 401
  it("returns session expired for 401", () => {
    const error = { status: 401, data: {} };
    expect(getErrorMessage(error)).toBe(
      "Session expired. Please log in again."
    );
  });

  // 403 identity verification
  it("returns identity verification message for 403 with identity detail", () => {
    const error = {
      status: 403,
      data: { detail: "Identity verification required." },
    };
    expect(getErrorMessage(error)).toBe(
      "Your identity hasn't been verified yet. Contact your school admin."
    );
  });

  it("returns identity verification message case-insensitive", () => {
    const error = {
      status: 403,
      data: { detail: "identity Verification is pending" },
    };
    expect(getErrorMessage(error)).toBe(
      "Your identity hasn't been verified yet. Contact your school admin."
    );
  });

  // 403 generic
  it("returns detail for 403 with other detail", () => {
    const error = {
      status: 403,
      data: { detail: "You are not an admin." },
    };
    expect(getErrorMessage(error)).toBe("You are not an admin.");
  });

  it("returns generic permission message for 403 without detail", () => {
    const error = { status: 403, data: {} };
    expect(getErrorMessage(error)).toBe(
      "You don't have permission to do that."
    );
  });

  // 400
  it("returns detail for 400 with detail", () => {
    const error = {
      status: 400,
      data: { detail: "Title is required." },
    };
    expect(getErrorMessage(error)).toBe("Title is required.");
  });

  it("returns generic message for 400 without detail", () => {
    const error = { status: 400, data: {} };
    expect(getErrorMessage(error)).toBe(
      "Invalid request. Please check your input."
    );
  });

  // 404
  it("returns not found for 404", () => {
    const error = { status: 404, data: {} };
    expect(getErrorMessage(error)).toBe(
      "The requested resource was not found."
    );
  });

  it("returns detail for 404 with detail", () => {
    const error = { status: 404, data: { detail: "Request not found." } };
    expect(getErrorMessage(error)).toBe("Request not found.");
  });

  // 422
  it("returns validation message for 422", () => {
    const error = { status: 422, data: {} };
    expect(getErrorMessage(error)).toBe(
      "Invalid request. Please check your input."
    );
  });

  // 500+
  it("returns server error for 500", () => {
    const error = { status: 500, data: {} };
    expect(getErrorMessage(error)).toBe("Server error. Please try again later.");
  });

  it("returns server error for 503", () => {
    const error = { status: 503, data: {} };
    expect(getErrorMessage(error)).toBe("Server error. Please try again later.");
  });

  // Unknown HTTP status
  it("returns detail for unknown status with detail", () => {
    const error = { status: 409, data: { detail: "Conflict occurred." } };
    expect(getErrorMessage(error)).toBe("Conflict occurred.");
  });

  it("returns fallback for unknown status without detail", () => {
    const error = { status: 418, data: {} };
    expect(getErrorMessage(error)).toBe("Something went wrong");
  });

  // SerializedError
  it("returns message from SerializedError", () => {
    const error = { message: "Something specific broke", name: "Error" };
    expect(getErrorMessage(error)).toBe("Something specific broke");
  });

  it("returns fallback for SerializedError without message", () => {
    const error = { name: "Error" };
    expect(getErrorMessage(error)).toBe("Something went wrong");
  });

  // Edge: data is not an object
  it("handles non-object data gracefully", () => {
    const error = { status: 400, data: "raw string" };
    expect(getErrorMessage(error)).toBe(
      "Invalid request. Please check your input."
    );
  });

  it("handles null data gracefully", () => {
    const error = { status: 400, data: null };
    expect(getErrorMessage(error)).toBe(
      "Invalid request. Please check your input."
    );
  });
});
