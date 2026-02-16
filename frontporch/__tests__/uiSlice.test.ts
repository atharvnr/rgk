import uiReducer, { showSnackbar, hideSnackbar } from "../src/store/uiSlice";

describe("uiSlice", () => {
  const initialState = {
    snackbar: {
      visible: false,
      message: "",
      type: "info" as const,
    },
  };

  it("should return the initial state", () => {
    expect(uiReducer(undefined, { type: "unknown" })).toEqual(initialState);
  });

  it("should handle showSnackbar with error type", () => {
    const state = uiReducer(
      initialState,
      showSnackbar({ message: "Error occurred", type: "error" })
    );
    expect(state.snackbar).toEqual({
      visible: true,
      message: "Error occurred",
      type: "error",
    });
  });

  it("should handle showSnackbar with success type", () => {
    const state = uiReducer(
      initialState,
      showSnackbar({ message: "Saved!", type: "success" })
    );
    expect(state.snackbar).toEqual({
      visible: true,
      message: "Saved!",
      type: "success",
    });
  });

  it("should default to info type when not specified", () => {
    const state = uiReducer(
      initialState,
      showSnackbar({ message: "FYI" })
    );
    expect(state.snackbar).toEqual({
      visible: true,
      message: "FYI",
      type: "info",
    });
  });

  it("should handle hideSnackbar", () => {
    const visibleState = {
      snackbar: {
        visible: true,
        message: "Hello",
        type: "success" as const,
      },
    };
    const state = uiReducer(visibleState, hideSnackbar());
    expect(state.snackbar.visible).toBe(false);
    // message and type preserved — only visibility toggled
    expect(state.snackbar.message).toBe("Hello");
    expect(state.snackbar.type).toBe("success");
  });

  it("should overwrite previous snackbar when showing new one", () => {
    const existingState = {
      snackbar: {
        visible: true,
        message: "First message",
        type: "error" as const,
      },
    };
    const state = uiReducer(
      existingState,
      showSnackbar({ message: "Second message", type: "success" })
    );
    expect(state.snackbar).toEqual({
      visible: true,
      message: "Second message",
      type: "success",
    });
  });
});
