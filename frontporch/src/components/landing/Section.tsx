import type { ReactNode } from "react";
import {
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Text } from "react-native-paper";
import { layout, spacing, theme } from "../../theme";

const { colors } = theme;

/** Responsive values shared by every landing section. */
export function useLandingLayout() {
  const { width } = useWindowDimensions();
  const isWide = width >= layout.breakpoint;
  return {
    width,
    isWide,
    /** Narrow phones: hide secondary chrome such as the wordmark. */
    isCompact: width < 600,
    gutter: isWide ? 32 : 20,
    sectionGap: isWide ? spacing.xxxl : spacing.xxl,
  };
}

interface SectionProps {
  children: ReactNode;
  /** Optional section heading rendered above the content. */
  title?: string;
  /** Full-bleed background colour behind the centered column. */
  background?: string;
  onLayout?: (event: LayoutChangeEvent) => void;
  /** Style for the full-width outer band. */
  style?: StyleProp<ViewStyle>;
  /** Style for the centered content column. */
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Full-width band with a centered column (max 1120px). Sections are direct
 * children of the landing ScrollView content, so onLayout's y is the scroll
 * offset of the section.
 */
export function Section({
  children,
  title,
  background,
  onLayout,
  style,
  contentStyle,
  testID,
}: SectionProps) {
  const { gutter, isWide } = useLandingLayout();

  return (
    <View
      onLayout={onLayout}
      testID={testID}
      style={[styles.band, background ? { backgroundColor: background } : null, style]}
    >
      <View style={[styles.column, { paddingHorizontal: gutter }, contentStyle]}>
        {title ? (
          <Text
            variant={isWide ? "headlineMedium" : "headlineSmall"}
            role="heading"
            aria-level={2}
            style={[styles.title, { marginBottom: isWide ? spacing.xl : spacing.lg }]}
          >
            {title}
          </Text>
        ) : null}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    width: "100%",
  },
  column: {
    width: "100%",
    maxWidth: layout.maxWidth,
    alignSelf: "center",
  },
  title: {
    color: colors.onSurface,
    fontWeight: "700",
    letterSpacing: -0.25,
  },
});
