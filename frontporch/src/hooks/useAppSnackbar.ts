import { useDispatch } from "react-redux";
import { showSnackbar } from "../store/uiSlice";
import { getErrorMessage } from "../utils/errorMessages";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";

type ApiError = FetchBaseQueryError | SerializedError | undefined;

export function useAppSnackbar() {
  const dispatch = useDispatch();

  const showError = (error: ApiError, fallback?: string) => {
    dispatch(
      showSnackbar({
        message: getErrorMessage(error, fallback),
        type: "error",
      })
    );
  };

  const showSuccess = (message: string) => {
    dispatch(showSnackbar({ message, type: "success" }));
  };

  const showInfo = (message: string) => {
    dispatch(showSnackbar({ message, type: "info" }));
  };

  return { showError, showSuccess, showInfo };
}
