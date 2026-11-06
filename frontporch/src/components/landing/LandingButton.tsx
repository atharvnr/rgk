import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { radius, theme } from "../../theme";
import { useHover } from "../../hooks/useHover";
import type { IconName } from "./IconCircle";

const { colors } = theme;

export type LandingButtonMode = "contained" | "outlined" | "text" | "link";
export type LandingButtonSize = "sm" | "md" | "lg";

interface LandingButtonProps {
  label: string;
  onPress: () => void;
  mode?: LandingButtonMode;
  size?: LandingButtonSize;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  /** Stretch to the width of the parent. */
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// State layers for hover/press (MD3: 8% hover, 12% press of the content colour).
const PRIMARY_HOVER = "#1B6342";
const PRIMARY_PRESSED = "#185839";
const TINT_HOVER = "rgba(31, 111, 74, 0.08)";
const TINT_PRESSED = "rgba(31, 111, 74, 0.12)";

const SIZES: Record<LandingButtonSize, { height: number; paddingHorizontal: number }> = {
  sm: { height: 36, paddingHorizontal: 14 },
  md: { height: 44, paddingHorizontal: 20 },
  lg: { height: 52, paddingHorizontal: 28 },
};

/**
 * Button used across the landing and sign-in screens. Built on Pressable so
 * it shows a hover state on web and a pressed state everywhere.
 */
export function LandingButton({
  label,
  onPress,
  mode = "contained",
  size = "md",
  icon,
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  testID,
}: LandingButtonProps) {
  const { hovered, hoverProps } = useHover();
  const inactive = disabled || loading;
  const isLink = mode === "link";
  const contentColor = mode === "contained" ? colors.onPrimary : colors.primary;

  return (
    <Pressable
      {...hoverProps}
      onPress={onPress}
      disabled={inactive}
      testID={testID}
      role={isLink ? "link" : "button"}
      aria-label={label}
      aria-disabled={inactive}
      aria-busy={loading}
      android_ripple={
        isLink
          ? undefined
          : { color: mode === "contained" ? "rgba(255,255,255,0.2)" : TINT_PRESSED }
      }
      style={({ pressed }) => [
        styles.base,
        isLink ? styles.link : SIZES[size],
        modeStyles[mode],
        hovered && !inactive && hoverStyles[mode],
        pressed && !inactive && pressedStyles[mode],
        fullWidth && styles.fullWidth,
        inactive && !loading && styles.disabled,
        Platform.OS === "web" && !inactive ? styles.webPointer : null,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size={16} color={contentColor} />
        ) : icon ? (
          <MaterialCommunityIcons name={icon} size={18} color={contentColor} />
        ) : null}
        <Text
          variant={size === "lg" ? "titleMedium" : "labelLarge"}
          numberOfLines={1}
          style={[
            styles.label,
            { color: contentColor },
            isLink && hovered ? styles.underline : null,
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const modeStyles = StyleSheet.create({
  contained: { backgroundColor: colors.primary },
  outlined: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.outline,
  },
  text: { backgroundColor: "transparent" },
  link: { backgroundColor: "transparent" },
});

const hoverStyles = StyleSheet.create({
  contained: { backgroundColor: PRIMARY_HOVER },
  outlined: { backgroundColor: TINT_HOVER, borderColor: colors.primary },
  text: { backgroundColor: TINT_HOVER },
  link: {},
});

const pressedStyles = StyleSheet.create({
  contained: { backgroundColor: PRIMARY_PRESSED },
  outlined: { backgroundColor: TINT_PRESSED, borderColor: colors.primary },
  text: { backgroundColor: TINT_PRESSED },
  link: { opacity: 0.7 },
});

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  link: {
    paddingVertical: 4,
    borderRadius: 4,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontWeight: "600",
  },
  underline: {
    textDecorationLine: "underline",
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  disabled: {
    opacity: 0.5,
  },
  webPointer: {
    cursor: "pointer",
  },
});
