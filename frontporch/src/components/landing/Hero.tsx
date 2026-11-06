import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { radius, spacing, theme } from "../../theme";
import { LandingButton } from "./LandingButton";
import { ProductPreview } from "./ProductPreview";
import { Section, useLandingLayout } from "./Section";

const { colors } = theme;

const CHECKS = ["Identity verified", "School approved", "Free for families"];

interface HeroProps {
  onGetStarted: () => void;
  onForSchools: () => void;
  signInReady: boolean;
  signingIn: boolean;
}

export function Hero({ onGetStarted, onForSchools, signInReady, signingIn }: HeroProps) {
  const { isWide, isCompact } = useLandingLayout();

  return (
    <Section contentStyle={{ paddingTop: isWide ? spacing.xxl : spacing.xl }}>
      <View style={[styles.layout, isWide && styles.layoutWide]}>
        <View style={isWide ? styles.copyWide : styles.copy}>
          <View style={[styles.overline, { borderRadius: isWide ? radius.pill : radius.md }]}>
            <Text variant="labelMedium" style={styles.overlineText}>
              Student volunteers · Elderly neighbors · Verified hours
            </Text>
          </View>

          <Text
            variant={isWide ? "displayMedium" : "displaySmall"}
            role="heading"
            aria-level={1}
            style={styles.headline}
          >
            {/* Break after the comma on desktop so "count." never wraps alone. */}
            {isWide ? "Help next door,\nhours that count." : "Help next door, hours that count."}
          </Text>

          <Text variant="bodyLarge" style={styles.subhead}>
            RentGrandKids matches high-school volunteers with elderly neighbors who
            need a hand, and gives schools a verified record of every hour served.
          </Text>

          <View style={styles.buttons}>
            <LandingButton
              label="Get started"
              mode="contained"
              size="lg"
              onPress={onGetStarted}
              disabled={!signInReady}
              loading={signingIn}
              style={isCompact ? styles.buttonCompact : null}
              testID="hero-get-started"
            />
            <LandingButton
              label="For schools"
              mode="outlined"
              size="lg"
              onPress={onForSchools}
              style={isCompact ? styles.buttonCompact : null}
            />
          </View>

          <View style={styles.checks}>
            {CHECKS.map((label) => (
              <View key={label} style={styles.check}>
                <MaterialCommunityIcons name="check-circle" size={16} color={colors.primary} />
                <Text variant="bodyMedium" style={styles.checkText}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={isWide ? styles.previewWide : styles.preview}>
          <ProductPreview />
        </View>
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  layout: {
    flexDirection: "column",
    gap: spacing.xxl,
  },
  layoutWide: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xl,
  },
  copy: {
    width: "100%",
  },
  copyWide: {
    width: "55%",
  },
  overline: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primaryContainer,
    marginBottom: spacing.lg,
  },
  overlineText: {
    color: colors.onPrimaryContainer,
    fontWeight: "600",
  },
  headline: {
    color: colors.onSurface,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subhead: {
    color: colors.onSurfaceVariant,
    maxWidth: 520,
    marginTop: spacing.md,
    lineHeight: 26,
  },
  buttons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: spacing.xl,
  },
  buttonCompact: {
    flexGrow: 1,
    flexBasis: 140,
  },
  checks: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: spacing.md,
    rowGap: spacing.sm,
    marginTop: spacing.lg,
  },
  check: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  checkText: {
    color: colors.onSurfaceVariant,
    fontWeight: "500",
  },
  preview: {
    width: "100%",
    alignItems: "center",
  },
  previewWide: {
    flex: 1,
    alignItems: "center",
  },
});
