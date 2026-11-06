import type { ReactNode } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { radius, spacing, theme } from "../../theme";
import type { IconName } from "./IconCircle";

const { colors } = theme;

const STEP_SIZE = 36;
const BACKING_OFFSET = 12;

function StepIcon({ name, filled = false }: { name: IconName; filled?: boolean }) {
  return (
    <View style={[styles.stepIcon, filled && styles.stepIconFilled]}>
      <MaterialCommunityIcons
        name={name}
        size={18}
        color={filled ? colors.onPrimary : colors.primary}
      />
    </View>
  );
}

function Pill({
  label,
  icon,
  iconColor,
  background,
  textColor = colors.onSurface,
}: {
  label: string;
  icon?: IconName;
  iconColor?: string;
  background: string;
  textColor?: string;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: background }]}>
      {icon ? <MaterialCommunityIcons name={icon} size={12} color={iconColor} /> : null}
      <Text variant="labelSmall" style={[styles.pillText, { color: textColor }]}>
        {label}
      </Text>
    </View>
  );
}

function Step({ icon, filled, children }: { icon: IconName; filled?: boolean; children: ReactNode }) {
  return (
    <View style={styles.step}>
      <StepIcon name={icon} filled={filled} />
      <View style={styles.stepBody}>{children}</View>
    </View>
  );
}

const Connector = () => <View style={styles.connector} />;

/**
 * Static mock of the request -> session -> approval flow. Decorative, so it
 * is exposed to assistive tech as a single labelled image.
 */
export function ProductPreview() {
  return (
    <View
      style={styles.wrapper}
      accessible
      role="img"
      aria-label="Example: an elder asks for tech help, Maya logs 1.5 hours, the elder confirms and Lincoln High approves the hours."
    >
      <View style={styles.backing} />
      <View style={[styles.card, webShadow]}>
        <Step icon="account-heart-outline">
          <Text variant="titleSmall" style={styles.rowTitle}>
            Set up video calls with my grandkids
          </Text>
          <View style={styles.pillRow}>
            <Pill
              label="Tech help"
              icon="cellphone"
              iconColor={colors.secondary}
              background={colors.secondaryContainer}
            />
            <Pill
              label="Tuesday 4 pm"
              icon="calendar-clock-outline"
              iconColor={colors.tertiary}
              background={colors.tertiaryContainer}
            />
          </View>
        </Step>
        <Connector />
        <Step icon="clock-check-outline">
          <Text variant="titleSmall" style={styles.rowTitle}>
            Maya logged 1.5 h
          </Text>
          <View style={styles.pillRow}>
            <Pill
              label="Elder confirmed"
              icon="check"
              iconColor={colors.onPrimaryContainer}
              background={colors.primaryContainer}
              textColor={colors.onPrimaryContainer}
            />
          </View>
        </Step>
        <Connector />
        <Step icon="school-outline" filled>
          <View style={styles.approvedRow}>
            <Text variant="titleSmall" style={styles.rowTitle}>
              Lincoln High approved
            </Text>
            <MaterialCommunityIcons name="check-decagram" size={16} color={colors.primary} />
          </View>
          <Text variant="bodySmall" style={styles.rowMeta}>
            1.5 hours added to transcript
          </Text>
        </Step>
      </View>
    </View>
  );
}

const webShadow =
  Platform.OS === "web"
    ? { boxShadow: "0 18px 40px -12px rgba(16, 48, 32, 0.18)" }
    : null;

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    maxWidth: 360 + BACKING_OFFSET,
    paddingRight: BACKING_OFFSET,
    paddingBottom: BACKING_OFFSET,
    alignSelf: "center",
  },
  backing: {
    position: "absolute",
    top: BACKING_OFFSET,
    left: BACKING_OFFSET,
    right: 0,
    bottom: 0,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    transform: [{ rotate: "-2deg" }],
  },
  card: {
    width: "100%",
    padding: 20,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  stepIcon: {
    width: STEP_SIZE,
    height: STEP_SIZE,
    borderRadius: STEP_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryContainer,
  },
  stepIconFilled: {
    backgroundColor: colors.primary,
  },
  stepBody: {
    flex: 1,
    gap: spacing.sm,
    paddingTop: 7,
  },
  rowTitle: {
    color: colors.onSurface,
    fontWeight: "600",
    flexShrink: 1,
  },
  rowMeta: {
    color: colors.onSurfaceVariant,
    marginTop: -4,
  },
  approvedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  pillText: {
    fontWeight: "600",
  },
  connector: {
    width: 2,
    height: 18,
    marginLeft: STEP_SIZE / 2 - 1,
    marginVertical: 4,
    borderRadius: 1,
    backgroundColor: colors.outline,
  },
});
