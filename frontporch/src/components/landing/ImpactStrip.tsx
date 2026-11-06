import { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useGetPublicStatsQuery } from "../../services/api";
import type { PublicStats } from "../../types";
import { formatNumber } from "../../utils/formatNumber";
import { radius, spacing, theme } from "../../theme";
import { Section, useLandingLayout } from "./Section";

const { colors } = theme;

export const ONBOARDING_MESSAGE =
  "Now onboarding our first schools in Springfield, IL";

const STATS: { key: keyof PublicStats; label: string; decimals: number }[] = [
  { key: "hours_served", label: "Hours served", decimals: 1 },
  { key: "volunteers", label: "Volunteers", decimals: 0 },
  { key: "elders_helped", label: "Elders helped", decimals: 0 },
  { key: "schools", label: "Partner schools", decimals: 0 },
];

function usePulse(active: boolean) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) return;
    const useNativeDriver = Platform.OS !== "web";
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, opacity]);

  return opacity;
}

export function ImpactStrip() {
  const { data, isLoading, isError } = useGetPublicStatsQuery();
  const { isWide } = useLandingLayout();
  const pulse = usePulse(isLoading);

  const hasNumbers =
    !!data && STATS.some(({ key }) => Number(data[key]) > 0);
  const showOnboarding = !isLoading && (isError || !hasNumbers);

  return (
    <Section
      background={colors.primaryContainer}
      testID="impact-strip"
      contentStyle={{ paddingVertical: isWide ? spacing.xxl : spacing.xl }}
    >
      {showOnboarding ? (
        <Text variant="titleMedium" style={styles.onboarding}>
          {ONBOARDING_MESSAGE}
        </Text>
      ) : (
        <View style={styles.grid}>
          {STATS.map(({ key, label, decimals }) => (
            <View
              key={key}
              style={[styles.stat, { flexBasis: isWide ? 0 : "40%" }]}
              accessible={!isLoading}
              aria-label={
                data && !isLoading
                  ? `${formatNumber(data[key], decimals)} ${label}`
                  : undefined
              }
            >
              {isLoading || !data ? (
                <Animated.View
                  testID="impact-placeholder"
                  style={[styles.placeholderValue, { opacity: pulse }]}
                />
              ) : (
                <Text variant="headlineLarge" style={styles.value}>
                  {formatNumber(data[key], decimals)}
                </Text>
              )}
              <Text variant="labelLarge" style={styles.label}>
                {label}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Section>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: spacing.lg,
    columnGap: spacing.md,
  },
  stat: {
    flexGrow: 1,
    alignItems: "center",
    gap: spacing.xs,
  },
  value: {
    color: colors.onPrimaryContainer,
    fontWeight: "700",
  },
  label: {
    color: colors.onSurfaceVariant,
    textAlign: "center",
  },
  placeholderValue: {
    // Matches headlineLarge's line height so nothing shifts when data lands.
    width: 96,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: "rgba(11, 59, 37, 0.10)",
  },
  onboarding: {
    color: colors.onPrimaryContainer,
    fontWeight: "600",
    textAlign: "center",
  },
});
