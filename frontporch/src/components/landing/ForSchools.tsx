import * as Linking from "expo-linking";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { Text } from "react-native-paper";
import { radius, spacing, theme } from "../../theme";
import { useAppSnackbar } from "../../hooks/useAppSnackbar";
import { LandingButton } from "./LandingButton";
import { Section, useLandingLayout } from "./Section";

const { colors } = theme;

const CONTACT_EMAIL =
  process.env.EXPO_PUBLIC_CONTACT_EMAIL || "hello@rentgrandkids.org";
const SUBJECT = "RentGrandKids for our school";

export const SCHOOLS_MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(SUBJECT)}`;

interface ForSchoolsProps {
  /** Reports the section's y offset so the hero can scroll to it. */
  onLayout?: (event: LayoutChangeEvent) => void;
}

export function ForSchools({ onLayout }: ForSchoolsProps) {
  const { isWide } = useLandingLayout();
  const { showError } = useAppSnackbar();

  const emailUs = async () => {
    try {
      await Linking.openURL(SCHOOLS_MAILTO);
    } catch {
      showError(undefined, `Couldn't open your email app. Write to us at ${CONTACT_EMAIL}.`);
    }
  };

  return (
    <Section onLayout={onLayout} testID="for-schools">
      <View
        style={[
          styles.panel,
          isWide ? styles.panelWide : null,
          { padding: isWide ? spacing.xxl : spacing.lg },
        ]}
      >
        <View style={styles.copy}>
          <Text
            variant={isWide ? "headlineMedium" : "headlineSmall"}
            role="heading"
            aria-level={2}
            style={styles.title}
          >
            Bring RentGrandKids to your school
          </Text>
          <Text variant="bodyLarge" style={styles.body}>
            We set up your school, your staff accounts and your approval workflow.
            Students join with their school ID.
          </Text>
        </View>
        <LandingButton
          label="Email us"
          icon="email-outline"
          mode="contained"
          size="lg"
          onPress={emailUs}
          style={isWide ? null : styles.buttonNarrow}
        />
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceVariant,
    gap: spacing.lg,
  },
  panelWide: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xl,
  },
  copy: {
    flexShrink: 1,
    flexGrow: 1,
    gap: spacing.sm,
  },
  title: {
    color: colors.onSurface,
    fontWeight: "700",
    letterSpacing: -0.25,
  },
  body: {
    color: colors.onSurfaceVariant,
    maxWidth: 560,
    lineHeight: 26,
  },
  buttonNarrow: {
    alignSelf: "flex-start",
  },
});
