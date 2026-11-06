import type { ComponentProps } from "react";
import { StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../../theme";

export type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const { colors } = theme;

interface IconCircleProps {
  name: IconName;
  size?: number;
}

/** MaterialCommunityIcons glyph inside a tinted circle (primaryContainer). */
export function IconCircle({ name, size = 44 }: IconCircleProps) {
  return (
    <View
      style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <MaterialCommunityIcons
        name={name}
        size={Math.round(size * 0.5)}
        color={colors.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryContainer,
  },
});
