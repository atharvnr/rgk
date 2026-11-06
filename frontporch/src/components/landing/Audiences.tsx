import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { radius, spacing, theme } from "../../theme";
import { useHover } from "../../hooks/useHover";
import { IconCircle, type IconName } from "./IconCircle";
import { Section, useLandingLayout } from "./Section";

const { colors } = theme;

const AUDIENCES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "school-outline",
    title: "Students",
    body: "Earn service hours doing something that matters, with a record your school already trusts.",
  },
  {
    icon: "hand-heart-outline",
    title: "Elders & caregivers",
    body: "Ask for help in plain words. A caregiver can manage requests on an elder's behalf.",
  },
  {
    icon: "office-building-outline",
    title: "Schools",
    body: "A dashboard of every student, every hour, and every pending approval, with nothing to chase.",
  },
];

function AudienceCard({
  icon,
  title,
  body,
  wide,
}: {
  icon: IconName;
  title: string;
  body: string;
  wide: boolean;
}) {
  const { hovered, hoverProps } = useHover();

  return (
    // Pressable only for hover tracking; the card itself is not actionable.
    <Pressable
      {...hoverProps}
      focusable={false}
      style={[
        styles.card,
        wide ? styles.cardWide : styles.cardNarrow,
        hovered && styles.cardHovered,
      ]}
    >
      <IconCircle name={icon} />
      <View style={[styles.copy, !wide && styles.copyNarrow]}>
        <Text variant="titleMedium" style={styles.title}>
          {title}
        </Text>
        <Text variant="bodyMedium" style={styles.body}>
          {body}
        </Text>
      </View>
    </Pressable>
  );
}

export function Audiences() {
  const { isWide } = useLandingLayout();

  return (
    <Section title="Built for everyone at the table">
      <View style={[styles.grid, isWide && styles.gridWide]}>
        {AUDIENCES.map((audience) => (
          <AudienceCard key={audience.title} {...audience} wide={isWide} />
        ))}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: spacing.md,
  },
  gridWide: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surface,
  },
  cardWide: {
    flex: 1,
    gap: spacing.md,
  },
  cardNarrow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  copy: {
    gap: spacing.xs,
  },
  copyNarrow: {
    flex: 1,
  },
  cardHovered: {
    backgroundColor: "#F7FAF8",
    borderColor: colors.outline,
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
