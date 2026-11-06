import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Chip } from "react-native-paper";
import { theme } from "../../theme";

const { colors } = theme;

export interface FilterOption<T extends string> {
  value: T;
  label: string;
}

interface FilterChipsProps<T extends string> {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Extra chips appended to the same wrapping row, e.g. a ToggleChip. */
  children?: ReactNode;
  testID?: string;
}

/** Single-select row of chips. Wraps instead of scrolling so nothing hides off-screen. */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  children,
  testID = "filter-chips",
}: FilterChipsProps<T>) {
  return (
    <View style={styles.row} testID={testID}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Chip
            key={option.value}
            mode="outlined"
            compact
            selected={selected}
            showSelectedCheck={false}
            onPress={() => onChange(option.value)}
            style={[styles.chip, selected && styles.chipSelected]}
            textStyle={[styles.text, selected && styles.textSelected]}
            accessibilityState={{ selected }}
            testID={`${testID}-${option.value}`}
          >
            {option.label}
          </Chip>
        );
      })}
      {children}
    </View>
  );
}

interface ToggleChipProps {
  label: string;
  selected: boolean;
  onToggle: (selected: boolean) => void;
  testID?: string;
}

/** On/off chip with a check when on, e.g. "Show inactive". */
export function ToggleChip({ label, selected, onToggle, testID }: ToggleChipProps) {
  return (
    <Chip
      mode="outlined"
      compact
      selected={selected}
      onPress={() => onToggle(!selected)}
      style={[styles.chip, selected && styles.chipSelected]}
      textStyle={[styles.text, selected && styles.textSelected]}
      selectedColor={colors.onPrimaryContainer}
      accessibilityRole="switch"
      accessibilityState={{ checked: selected }}
      testID={testID}
    >
      {label}
    </Chip>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.outline,
  },
  chipSelected: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primaryContainer,
  },
  text: {
    color: colors.onSurfaceVariant,
  },
  textSelected: {
    color: colors.onPrimaryContainer,
    fontWeight: "600",
  },
});
