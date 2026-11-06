import { useEffect } from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSignIn } from "../../src/hooks/useSignIn";
import { LandingButton } from "../../src/components/landing/LandingButton";
import { spacing, theme } from "../../src/theme";

const { colors } = theme;
const logo = require("../../assets/rgk.png");

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, isReady, isSigningIn } = useSignIn();

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = "Sign in · RentGrandKids";
    }
  }, []);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
        },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.content}>
        <Image
          source={logo}
          style={styles.logo}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          role="img"
          aria-label="RentGrandKids"
        />
        <Text
          variant="headlineMedium"
          role="heading"
          aria-level={1}
          style={styles.title}
        >
          Welcome back
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Sign in to pick up where you left off.
        </Text>

        <LandingButton
          label="Sign in"
          mode="contained"
          size="lg"
          fullWidth
          onPress={() => void signIn()}
          disabled={!isReady}
          loading={isSigningIn}
          style={styles.button}
          testID="login-sign-in"
        />

        <LandingButton
          label="Back to home"
          mode="link"
          onPress={() => router.replace("/")}
          style={styles.back}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  content: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    alignItems: "center",
  },
  logo: {
    width: 88,
    height: 88,
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.onSurface,
    fontWeight: "700",
    letterSpacing: -0.25,
    textAlign: "center",
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  button: {
    marginTop: spacing.xl,
  },
  back: {
    marginTop: spacing.md,
  },
});
