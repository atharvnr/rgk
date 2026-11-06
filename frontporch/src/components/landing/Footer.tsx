import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { spacing, theme } from "../../theme";
import { LandingButton } from "./LandingButton";
import { Section, useLandingLayout } from "./Section";

const { colors } = theme;

interface FooterProps {
  bottomInset?: number;
}

export function Footer({ bottomInset = 0 }: FooterProps) {
  const router = useRouter();
  const { isWide } = useLandingLayout();
  const year = new Date().getFullYear();

  const brand = (
    <Text variant="titleSmall" style={styles.brand}>
      RentGrandKids.org
    </Text>
  );
  const tagline = (
    <Text variant="bodySmall" style={styles.muted}>
      A student-built nonprofit project · {year}
    </Text>
  );
  const signIn = (
    <LandingButton
      label="Sign in"
      mode="link"
      onPress={() => router.push("/(auth)/login")}
    />
  );

  return (
    <Section
      style={styles.band}
      contentStyle={{ paddingTop: spacing.lg, paddingBottom: spacing.lg + bottomInset }}
    >
      {isWide ? (
        <View style={styles.row}>
          <View style={styles.group}>
            {brand}
            {tagline}
          </View>
          {signIn}
        </View>
      ) : (
        <View style={styles.stack}>
          <View style={styles.row}>
            {brand}
            {signIn}
          </View>
          {tagline}
        </View>
      )}
    </Section>
  );
}

const styles = StyleSheet.create({
  band: {
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  group: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flexShrink: 1,
  },
  stack: {
    gap: spacing.xs,
  },
  brand: {
    color: colors.onSurface,
    fontWeight: "700",
  },
  muted: {
    color: colors.onSurfaceVariant,
  },
});
