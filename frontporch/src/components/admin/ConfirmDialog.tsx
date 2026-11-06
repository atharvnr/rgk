import { StyleSheet, useWindowDimensions } from "react-native";
import { Button, Dialog, Portal, Text } from "react-native-paper";
import { radius, theme } from "../../theme";

const { colors } = theme;

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Red confirm button for irreversible or disruptive actions. */
  destructive?: boolean;
  /** Shows a spinner on the confirm button and blocks dismissal. */
  loading?: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
  testID?: string;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onConfirm,
  onDismiss,
  testID = "confirm-dialog",
}: ConfirmDialogProps) {
  const { width } = useWindowDimensions();
  const dismiss = () => {
    if (!loading) onDismiss();
  };

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={dismiss}
        style={[styles.dialog, { width: Math.min(440, width - 48) }]}
        testID={testID}
      >
        <Dialog.Title style={styles.title}>{title}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={styles.message}>
            {message}
          </Text>
        </Dialog.Content>
        <Dialog.Actions style={styles.actions}>
          <Button onPress={dismiss} disabled={loading} testID={`${testID}-cancel`}>
            {cancelLabel}
          </Button>
          <Button
            mode="contained"
            onPress={onConfirm}
            loading={loading}
            disabled={loading}
            buttonColor={destructive ? colors.error : colors.primary}
            textColor={colors.onPrimary}
            testID={`${testID}-confirm`}
          >
            {confirmLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    alignSelf: "center",
    marginHorizontal: 0,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  },
  title: {
    color: colors.onSurface,
    fontWeight: "700",
  },
  message: {
    color: colors.onSurfaceVariant,
    lineHeight: 22,
  },
  actions: {
    gap: 8,
  },
});
