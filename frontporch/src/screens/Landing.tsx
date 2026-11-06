import { useCallback, useEffect, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing, theme } from "../theme";
import { useSignIn } from "../hooks/useSignIn";
import { TopBar } from "../components/landing/TopBar";
import { Hero } from "../components/landing/Hero";
import { ImpactStrip } from "../components/landing/ImpactStrip";
import { HowItWorks } from "../components/landing/HowItWorks";
import { Audiences } from "../components/landing/Audiences";
import { Trust } from "../components/landing/Trust";
import { ForSchools } from "../components/landing/ForSchools";
import { Footer } from "../components/landing/Footer";
import { useLandingLayout } from "../components/landing/Section";

const { colors } = theme;

/** Public landing page shown at "/" to signed-out visitors. */
export function Landing() {
  const insets = useSafeAreaInsets();
  const { sectionGap } = useLandingLayout();
  // One auth request for the whole page; both "Get started" buttons share it.
  const { signIn, isReady, isSigningIn } = useSignIn();

  const scrollRef = useRef<ScrollView>(null);
  const schoolsY = useRef(0);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = "RentGrandKids";
    }
  }, []);

  const onSchoolsLayout = useCallback((event: LayoutChangeEvent) => {
    schoolsY.current = event.nativeEvent.layout.y;
  }, []);

  const scrollToSchools = useCallback(() => {
    scrollRef.current?.scrollTo({
      y: Math.max(0, schoolsY.current - spacing.md),
      animated: true,
    });
  }, []);

  const getStarted = useCallback(() => {
    void signIn();
  }, [signIn]);

  return (
    <View
      style={[
        styles.screen,
        { paddingLeft: insets.left, paddingRight: insets.right },
      ]}
    >
      <TopBar
        onGetStarted={getStarted}
        signInReady={isReady}
        signingIn={isSigningIn}
        topInset={insets.top}
      />
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={{ gap: sectionGap }}
        testID="landing-scroll"
      >
        <Hero
          onGetStarted={getStarted}
          onForSchools={scrollToSchools}
          signInReady={isReady}
          signingIn={isSigningIn}
        />
        <ImpactStrip />
        <HowItWorks />
        <Audiences />
        <Trust />
        <ForSchools onLayout={onSchoolsLayout} />
        <Footer bottomInset={insets.bottom} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
});
