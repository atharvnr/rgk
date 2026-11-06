import { Children, type ReactNode } from "react";
import {
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { layout, radius, spacing, theme } from "../../theme";

const { colors } = theme;

/** Content column width for admin screens (narrower than the landing). */
export const ADMIN_MAX_WIDTH = 960;

/** Responsive values shared by the admin screens. */
export function useAdminLayout() {
  const { width } = useWindowDimensions();
  const isWide = width >= layout.breakpoint;
  return {
    width,
    isWide,
    /** Phones: stack row content instead of laying it out side by side. */
    isCompact: width < 600,
    gutter: isWide ? spacing.xl : 20,
  };
}

/** Style for a centered column; use as a ScrollView/FlatList contentContainerStyle too. */
export function useColumnStyle(): StyleProp<ViewStyle> {
  const { gutter } = useAdminLayout();
  return [styles.column, { paddingHorizontal: gutter }];
}

interface AdminScreenProps {
  children: ReactNode;
  testID?: string;
}

/**
 * Full-screen warm off-white background that clears the status bar. The tabs
 * hide their header, so each screen draws its own AdminHeader inside.
 */
export function AdminScreen({ children, testID }: AdminScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      testID={testID}
      style={[
        styles.screen,
        {
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      {children}
    </View>
  );
}

/** Centered column for content that does not scroll on its own. */
export function AdminColumn({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const column = useColumnStyle();
  return <View style={[column, style]}>{children}</View>;
}

interface AdminCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Drop the inner padding, e.g. for a card made of full-width rows. */
  flush?: boolean;
  /** Red-tinted border for destructive actions. */
  danger?: boolean;
  testID?: string;
}

/** White card with a 1px outlineVariant border, matching the landing cards. */
export function AdminCard({ children, style, flush, danger, testID }: AdminCardProps) {
  return (
    <View
      testID={testID}
      style={[
        styles.card,
        !flush && styles.cardPadding,
        danger && styles.cardDanger,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Lays fields side by side (equal widths) on wide screens and stacks them on phones. */
export function FormRow({ children }: { children: ReactNode }) {
  const { isCompact } = useAdminLayout();
  const items = Children.toArray(children);
  if (isCompact) return <View style={styles.formColumn}>{items}</View>;
  return (
    <View style={styles.formRow}>
      {items.map((child, index) => (
        <View key={index} style={styles.formCell}>
          {child}
        </View>
      ))}
    </View>
  );
}

/**
 * Border and corner styles for row `index` of `count` rows drawn as one card
 * (each row is its own FlatList item).
 */
export function groupedRowStyle(index: number, count: number): ViewStyle {
  const first = index === 0;
  const last = index === count - 1;
  return {
    borderColor: colors.outlineVariant,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: first ? 1 : 0,
    borderBottomWidth: 1,
    borderTopLeftRadius: first ? radius.md : 0,
    borderTopRightRadius: first ? radius.md : 0,
    borderBottomLeftRadius: last ? radius.md : 0,
    borderBottomRightRadius: last ? radius.md : 0,
    overflow: "hidden",
  };
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  column: {
    width: "100%",
    maxWidth: ADMIN_MAX_WIDTH,
    alignSelf: "center",
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.md,
  },
  cardPadding: {
    padding: spacing.lg,
  },
  cardDanger: {
    borderColor: "#F2C9C5",
  },
  formRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  formCell: {
    flex: 1,
    minWidth: 0,
  },
  formColumn: {
    gap: spacing.md,
  },
});
