import { useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { Searchbar } from "react-native-paper";
import { radius, theme } from "../../theme";

const { colors } = theme;

interface SearchBarProps {
  placeholder: string;
  /** Called with the trimmed text once typing pauses for `delay` ms. */
  onSearch: (query: string) => void;
  initialValue?: string;
  delay?: number;
  testID?: string;
}

/** Paper Searchbar that reports its value debounced (300 ms by default). */
export function SearchBar({
  placeholder,
  onSearch,
  initialValue = "",
  delay = 300,
  testID = "admin-search",
}: SearchBarProps) {
  const [text, setText] = useState(initialValue);
  const lastSent = useRef(initialValue.trim());
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

  useEffect(() => {
    const next = text.trim();
    if (next === lastSent.current) return;
    const timer = setTimeout(() => {
      lastSent.current = next;
      onSearchRef.current(next);
    }, delay);
    return () => clearTimeout(timer);
  }, [text, delay]);

  return (
    <Searchbar
      value={text}
      onChangeText={setText}
      placeholder={placeholder}
      elevation={0}
      style={styles.bar}
      inputStyle={styles.input}
      iconColor={colors.onSurfaceVariant}
      placeholderTextColor={colors.onSurfaceVariant}
      autoCapitalize="none"
      autoCorrect={false}
      accessibilityLabel={placeholder}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.pill,
  },
  input: {
    color: colors.onSurface,
  },
});
