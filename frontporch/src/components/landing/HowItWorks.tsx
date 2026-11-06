import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { spacing, theme } from "../../theme";
import { Section, useLandingLayout } from "./Section";

const { colors } = theme;

const STEPS = [
  {
    title: "An elder asks",
    body: "Elders or their caregivers post a request: a ride, a yard, a phone that won't cooperate.",
  },
  {
    title: "A student shows up",
    body: "A verified volunteer from a partner school accepts it and logs the time.",
  },
  {
    title: "The school signs off",
    body: "The elder confirms, the school approves, and the hours land on the student's record.",
  },
];

const NUMBER_SIZE = 40;

export function HowItWorks() {
  const { isWide } = useLandingLayout();

  return (
    <Section title="How it works">
      <View style={[styles.steps, isWide && styles.stepsWide]}>
        {STEPS.map((step, index) => (
          <View key={step.title} style={[styles.step, isWide && styles.stepWide]}>
            <View style={styles.number}>
              <Text variant="titleMedium" style={styles.numberText}>
                {index + 1}
              </Text>
            </View>
            <View style={styles.copy}>
              <Text variant="titleMedium" style={styles.title}>
                {step.title}
              </Text>
              <Text variant="bodyMedium" style={styles.body}>
                {step.body}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  steps: {
    gap: spacing.lg,
  },
  stepsWide: {
    flexDirection: "row",
    gap: spacing.xl,
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  stepWide: {
    flex: 1,
    flexDirection: "column",
  },
  number: {
    width: NUMBER_SIZE,
    height: NUMBER_SIZE,
    borderRadius: NUMBER_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  numberText: {
    color: colors.onPrimary,
    fontWeight: "700",
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
