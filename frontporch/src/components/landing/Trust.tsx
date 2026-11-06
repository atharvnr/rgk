import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { spacing, theme } from "../../theme";
import { IconCircle, type IconName } from "./IconCircle";
import { Section, useLandingLayout } from "./Section";

const { colors } = theme;

const POINTS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "shield-account-outline",
    title: "Identity verification",
    body: "Volunteers, elders and caregivers verify who they are before anything is scheduled.",
  },
  {
    icon: "check-decagram-outline",
    title: "Two-step confirmation",
    body: "Every session is confirmed by the elder and approved by the school.",
  },
  {
    icon: "account-supervisor-outline",
    title: "Caregiver proxies",
    body: "Family members can act for an elder with an approved proxy link.",
  },
];

export function Trust() {
  const { isWide } = useLandingLayout();

  return (
    <Section title="Safety first">
      <View style={[styles.row, isWide && styles.rowWide]}>
        {POINTS.map((point) => (
          <View key={point.title} style={[styles.point, isWide && styles.pointWide]}>
            <IconCircle name={point.icon} />
            <View style={styles.copy}>
              <Text variant="titleMedium" style={styles.title}>
                {point.title}
              </Text>
              <Text variant="bodyMedium" style={styles.body}>
                {point.body}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.lg,
  },
  rowWide: {
    flexDirection: "row",
    gap: spacing.xl,
  },
  point: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  pointWide: {
    flex: 1,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.onSurface,
    fontWeight: "700",
  },
  body: {
    color: colors.onSurfaceVariant,
    lineHeight: 22,
  },
});
