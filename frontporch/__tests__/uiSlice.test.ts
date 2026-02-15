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

  it("should handle showSnackbar", () => {
    const state = uiReducer(
      initialState,
      showSnackbar({ message: "Hello", type: "success" })
    );
    expect(state.snackbar.visible).toBe(true);
    expect(state.snackbar.message).toBe("Hello");
    expect(state.snackbar.type).toBe("success");
  });

  it("should handle showSnackbar with default type", () => {
    const state = uiReducer(
      initialState,
      showSnackbar({ message: "Info message" })
    );
    expect(state.snackbar.type).toBe("info");
  });

  it("should handle hideSnackbar", () => {
    const visibleState = {
      snackbar: { visible: true, message: "Hi", type: "error" as const },
    };
    const state = uiReducer(visibleState, hideSnackbar());
    expect(state.snackbar.visible).toBe(false);
  });
});
