import { StyleSheet } from "react-native";
import { Snackbar } from "react-native-paper";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store";
import { hideSnackbar } from "../store/uiSlice";

const COLORS = {
  success: "#2E7D32",
  error: "#D32F2F",
  info: "#1565C0",
} as const;

const DURATIONS = {
  success: 3000,
  error: 5000,
  info: 3000,
} as const;

export function GlobalSnackbar() {
  const dispatch = useDispatch();
  const { visible, message, type } = useSelector(
    (state: RootState) => state.ui.snackbar
  );

  return (
    <Snackbar
      visible={visible}
      onDismiss={() => dispatch(hideSnackbar())}
      duration={DURATIONS[type]}
      style={[styles.snackbar, { backgroundColor: COLORS[type] }]}
      action={{
        label: "Dismiss",
        textColor: "#FFFFFF",
        onPress: () => dispatch(hideSnackbar()),
      }}
    >
      {message}
    </Snackbar>
  );
}

const styles = StyleSheet.create({
  snackbar: {
    marginBottom: 16,
  },
});
