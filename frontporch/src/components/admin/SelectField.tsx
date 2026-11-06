import { useState } from "react";
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { HelperText, Menu, TextInput } from "react-native-paper";
import { theme } from "../../theme";

const { colors } = theme;

export interface SelectOption<T> {
  value: T;
  label: string;
}

interface SelectFieldProps<T> {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  /** Shown under the field, e.g. why it is disabled. */
  helperText?: string;
  /** Text when no option matches `value`. */
  placeholder?: string;
  testID?: string;
}

/**
 * Dropdown built from a Paper Menu anchored to a read-only outlined input, so
 * it lines up with the text fields around it and works the same on web.
 */
export function SelectField<T extends string | null>({
  label,
  value,
  options,
  onChange,
  disabled = false,
  helperText,
  placeholder = "",
  testID = "select-field",
}: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState(0);
  const selected = options.find((option) => option.value === value);

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={styles.field}>
      <Menu
        visible={open}
        onDismiss={() => setOpen(false)}
        anchorPosition="bottom"
        contentStyle={[styles.menu, width ? { minWidth: width } : null]}
        anchor={
          <Pressable
            onPress={() => setOpen(true)}
            disabled={disabled}
            onLayout={onLayout}
            role="button"
            aria-label={`${label}: ${selected?.label ?? placeholder}`}
            aria-disabled={disabled}
            testID={testID}
          >
            {/* The input is only a visual; presses go to the Pressable. */}
            <View style={styles.noPointer}>
              <TextInput
                mode="outlined"
                label={label}
                value={selected?.label ?? placeholder}
                editable={false}
                disabled={disabled}
                right={<TextInput.Icon icon="menu-down" disabled={disabled} />}
                outlineColor={colors.outline}
                style={styles.input}
                testID={`${testID}-input`}
              />
            </View>
          </Pressable>
        }
      >
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <Menu.Item
              key={String(option.value)}
              title={option.label}
              onPress={() => {
                setOpen(false);
                if (!isSelected) onChange(option.value);
              }}
              trailingIcon={isSelected ? "check" : undefined}
              titleStyle={isSelected ? styles.selectedTitle : undefined}
              style={width ? { minWidth: width, maxWidth: width } : null}
              contentStyle={width ? styles.itemContent : null}
              testID={`${testID}-option-${String(option.value)}`}
            />
          );
        })}
      </Menu>
      {helperText ? (
        <HelperText type="info" style={styles.helper}>
          {helperText}
        </HelperText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    alignSelf: "stretch",
  },
  noPointer: {
    pointerEvents: "none",
  },
  input: {
    backgroundColor: colors.surface,
  },
  menu: {
    backgroundColor: colors.surface,
  },
  itemContent: {
    flex: 1,
    maxWidth: "100%",
  },
  selectedTitle: {
    color: colors.primary,
    fontWeight: "600",
  },
  helper: {
    paddingHorizontal: 4,
  },
});
