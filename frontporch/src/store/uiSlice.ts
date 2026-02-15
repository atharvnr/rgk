import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  snackbar: {
    visible: boolean;
    message: string;
    type: "success" | "error" | "info";
  };
}

const initialState: UiState = {
  snackbar: {
    visible: false,
    message: "",
    type: "info",
  },
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    showSnackbar(
      state,
      action: PayloadAction<{ message: string; type?: "success" | "error" | "info" }>
    ) {
      state.snackbar = {
        visible: true,
        message: action.payload.message,
        type: action.payload.type || "info",
      };
    },
    hideSnackbar(state) {
      state.snackbar.visible = false;
    },
  },
});

export const { showSnackbar, hideSnackbar } = uiSlice.actions;
export default uiSlice.reducer;
