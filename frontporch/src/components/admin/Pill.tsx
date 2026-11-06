import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { radius } from "../../theme";
import type { IconName } from "../landing/IconCircle";

interface PillProps {
  label: string;
  /** Text and icon colour. */
  color: string;
  background?: string;
  /** Defaults to the background, so a filled pill has no visible border. */
  borderColor?: string;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Small non-interactive label, the base of RoleChip and StatusChip. */
export function Pill({
  label,
  color,
  background = "transparent",
  borderColor,
  icon,
  style,
  testID,
}: PillProps) {
  return (
    <View
      testID={testID}
      style={[
        styles.pill,
        { backgroundColor: background, borderColor: borderColor ?? background },
        style,
      ]}
    >
      {icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={14}
          color={color}
          testID={testID ? `${testID}-icon` : undefined}
        />
      ) : null}
      <Text variant="labelSmall" numberOfLines={1} style={[styles.label, { color }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  label: {
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
