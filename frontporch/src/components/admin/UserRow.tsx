import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { radius, spacing, theme } from "../../theme";
import { useHover } from "../../hooks/useHover";
import type { User } from "../../types";
import { useAdminLayout } from "./AdminScreen";
import { Pill } from "./Pill";
import { ROLE_TONES, RoleChip } from "./RoleChip";
import { StatusChip } from "./StatusChip";

const { colors } = theme;

/** "Ada Lovelace" -> "AL", "cher" -> "C"; falls back to the email's first letter. */
export function getInitials(name: string | undefined, email: string): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return (email.trim()[0] ?? "?").toUpperCase();
  const first = words[0][0] ?? "";
  const last = words.length > 1 ? words[words.length - 1][0] ?? "" : "";
  return `${first}${last}`.toUpperCase();
}

interface UserRowProps {
  user: User;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * One user in a list: initials, name, email, role and verification chips and
 * a chevron. Inactive users are dimmed and get an "Inactive" chip.
 */
export function UserRow({ user, onPress, style, testID = "user-row" }: UserRowProps) {
  const { hovered, hoverProps } = useHover();
  const { isCompact } = useAdminLayout();
  const inactive = !user.is_active;
  const tone = ROLE_TONES[user.role] ?? ROLE_TONES.needy;
  const displayName = user.name?.trim() || user.email;

  const chips = (
    <View style={[styles.chips, isCompact && styles.chipsCompact]}>
      <View style={[styles.chips, inactive && styles.dimmed]}>
        <RoleChip role={user.role} testID={`${testID}-role`} />
        <StatusChip status={user.verification_status} testID={`${testID}-status`} />
      </View>
      {inactive ? (
        <Pill
          label="Inactive"
          color={colors.onSurfaceVariant}
          background={colors.surfaceVariant}
          borderColor={colors.outline}
          testID={`${testID}-inactive`}
        />
      ) : null}
    </View>
  );

  return (
    <Pressable
      {...hoverProps}
      onPress={onPress}
      disabled={!onPress}
      role={onPress ? "button" : undefined}
      aria-label={`${displayName}, ${user.email}${inactive ? ", inactive" : ""}`}
      testID={testID}
      style={({ pressed }) => [
        styles.row,
        style,
        hovered && onPress ? styles.hovered : null,
        pressed && onPress ? styles.pressed : null,
        Platform.OS === "web" && onPress ? styles.webPointer : null,
      ]}
    >
      <View
        testID={`${testID}-avatar`}
        style={[styles.avatar, { backgroundColor: tone.background }, inactive && styles.dimmed]}
      >
        <Text variant="labelLarge" style={[styles.initials, { color: tone.color }]}>
          {getInitials(user.name, user.email)}
        </Text>
      </View>
      <View style={styles.body}>
        <View testID={`${testID}-text`} style={[styles.text, inactive && styles.dimmed]}>
          <Text variant="titleSmall" numberOfLines={1} style={styles.name}>
            {displayName}
          </Text>
          <Text variant="bodySmall" numberOfLines={1} style={styles.email}>
            {user.email}
          </Text>
        </View>
        {isCompact ? chips : null}
      </View>
      {isCompact ? null : chips}
      {onPress ? (
        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color={colors.onSurfaceVariant}
        />
      ) : null}
    </Pressable>
  );
}

/** Grey placeholder with the same footprint as a UserRow. */
export function UserRowSkeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.row, style]} testID="user-row-skeleton">
      <View style={[styles.avatar, styles.skeleton]} />
      <View style={styles.body}>
        <View style={[styles.bar, styles.skeleton, { width: "40%" }]} />
        <View style={[styles.bar, styles.barThin, styles.skeleton, { width: "60%" }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    minHeight: 64,
    backgroundColor: colors.surface,
  },
  hovered: {
    backgroundColor: "#F7FAF8",
  },
  pressed: {
    backgroundColor: "#EEF4F0",
  },
  webPointer: {
    cursor: "pointer",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontWeight: "700",
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  text: {
    gap: 2,
  },
  name: {
    color: colors.onSurface,
    fontWeight: "600",
  },
  email: {
    color: colors.onSurfaceVariant,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  chipsCompact: {
    justifyContent: "flex-start",
  },
  dimmed: {
    opacity: 0.5,
  },
  skeleton: {
    backgroundColor: "#ECEFEC",
  },
  bar: {
    height: 12,
    borderRadius: radius.sm,
  },
  barThin: {
    height: 10,
  },
});
