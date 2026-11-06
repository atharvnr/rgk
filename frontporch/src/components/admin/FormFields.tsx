import type { ComponentProps } from "react";
import { StyleSheet, View } from "react-native";
import { HelperText, Switch, Text, TextInput } from "react-native-paper";
import { spacing, theme } from "../../theme";

const { colors } = theme;

type TextInputProps = ComponentProps<typeof TextInput>;

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  /** Error text; also turns the outline red. */
  error?: string;
  /** Neutral hint shown when there is no error. */
  helper?: string;
  multiline?: boolean;
  disabled?: boolean;
  keyboardType?: TextInputProps["keyboardType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoComplete?: TextInputProps["autoComplete"];
  maxLength?: number;
  testID?: string;
}

/** Outlined Paper TextInput with an optional error or hint underneath. */
export function TextField({
  label,
  value,
  onChangeText,
  error,
  helper,
  multiline = false,
  disabled = false,
  keyboardType,
  autoCapitalize,
  autoComplete,
  maxLength,
  testID,
}: TextFieldProps) {
  const note = error || helper;
  return (
    <View>
      <TextInput
        mode="outlined"
        label={label}
        value={value}
        onChangeText={onChangeText}
        error={Boolean(error)}
        disabled={disabled}
        multiline={multiline}
        numberOfLines={multiline ? 3 : undefined}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        maxLength={maxLength}
        outlineColor={colors.outline}
        style={[styles.input, multiline && styles.multiline]}
        testID={testID}
      />
      {note ? (
        <HelperText type={error ? "error" : "info"} style={styles.helper}>
          {note}
        </HelperText>
      ) : null}
    </View>
  );
}

interface SwitchRowProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  testID?: string;
}

/** Label and description on the left, a Switch on the right. */
export function SwitchRow({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
  testID,
}: SwitchRowProps) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchText}>
        <Text variant="bodyLarge" style={[styles.switchLabel, disabled && styles.disabled]}>
          {label}
        </Text>
        {description ? (
          <Text variant="bodySmall" style={styles.switchDescription}>
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        color={colors.primary}
        accessibilityLabel={label}
        testID={testID}
      />
    </View>
  );
}

/** Bold section title inside a card. */
export function CardTitle({ children, subtitle }: { children: string; subtitle?: string }) {
  return (
    <View style={styles.cardTitle}>
      <Text variant="titleMedium" role="heading" aria-level={2} style={styles.cardTitleText}>
        {children}
      </Text>
      {subtitle ? (
        <Text variant="bodySmall" style={styles.switchDescription}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
  },
  multiline: {
    minHeight: 96,
  },
  helper: {
    paddingHorizontal: 4,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  switchText: {
    flex: 1,
    gap: 2,
  },
  switchLabel: {
    color: colors.onSurface,
  },
  switchDescription: {
    color: colors.onSurfaceVariant,
  },
  disabled: {
    opacity: 0.6,
  },
  cardTitle: {
    gap: 2,
    marginBottom: spacing.md,
  },
  cardTitleText: {
    color: colors.onSurface,
    fontWeight: "700",
  },
});
