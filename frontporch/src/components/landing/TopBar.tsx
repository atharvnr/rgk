import { Image, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { layout, theme } from "../../theme";
import { LandingButton } from "./LandingButton";
import { useLandingLayout } from "./Section";

const { colors } = theme;
const logo = require("../../../assets/rgk-128.png");

interface TopBarProps {
  onGetStarted: () => void;
  signInReady: boolean;
  signingIn: boolean;
  /** Top safe-area inset; the bar sits above the scrolling content. */
  topInset?: number;
}

export function TopBar({
  onGetStarted,
  signInReady,
  signingIn,
  topInset = 0,
}: TopBarProps) {
  const router = useRouter();
  const { gutter, isCompact } = useLandingLayout();
  const buttonSize = isCompact ? "sm" : "md";

  return (
    <View style={[styles.bar, { paddingTop: topInset }]}>
      <View
        style={[
          styles.row,
          { paddingHorizontal: gutter, height: isCompact ? 56 : 64 },
        ]}
      >
        <View style={styles.brand}>
          <Image
            source={logo}
            style={styles.logo}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
            role="img"
            aria-label="RentGrandKids"
          />
          {!isCompact && (
            <Text variant="titleMedium" style={styles.wordmark}>
              RentGrandKids
            </Text>
          )}
        </View>
        <View style={styles.actions}>
          <LandingButton
            label="Sign in"
            mode="text"
            size={buttonSize}
            onPress={() => router.push("/(auth)/login")}
          />
          <LandingButton
            label="Get started"
            mode="contained"
            size={buttonSize}
            onPress={onGetStarted}
            disabled={!signInReady}
            loading={signingIn}
            testID="topbar-get-started"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: "100%",
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  row: {
    width: "100%",
    maxWidth: layout.maxWidth,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  logo: {
    width: 28,
    height: 28,
  },
  wordmark: {
    color: colors.onSurface,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
