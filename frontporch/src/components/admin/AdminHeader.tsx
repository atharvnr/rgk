import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { IconButton, Text } from "react-native-paper";
import { spacing, theme } from "../../theme";
import { useAdminLayout } from "./AdminScreen";

const { colors } = theme;

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  /** Action on the right, e.g. a button or an icon button. */
  right?: ReactNode;
  /** Shows a back arrow before the title. */
  onBack?: () => void;
}

export function AdminHeader({ title, subtitle, right, onBack }: AdminHeaderProps) {
  const { isWide } = useAdminLayout();
  return (
    <View style={styles.header}>
      {onBack ? (
        <IconButton
          icon="arrow-left"
          size={22}
          onPress={onBack}
          accessibilityLabel="Back"
          style={styles.back}
          testID="admin-header-back"
        />
      ) : null}
      <View style={styles.titles}>
        <Text
          variant={isWide ? "headlineMedium" : "headlineSmall"}
          role="heading"
          aria-level={1}
          numberOfLines={2}
          style={styles.title}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodyMedium" style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  back: {
    marginLeft: -spacing.sm,
    marginRight: 0,
  },
  titles: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.onSurface,
    fontWeight: "700",
    letterSpacing: -0.25,
  },
  subtitle: {
    color: colors.onSurfaceVariant,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
