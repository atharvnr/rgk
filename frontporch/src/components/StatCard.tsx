import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { Card, Text } from "react-native-paper";
import { radius, theme } from "../theme";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  /** Flat white card with a 1px outlineVariant border instead of a shadow. */
  outlined?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  outlined = false,
  style,
  testID,
}: StatCardProps) {
  const content = (
    <Card.Content style={styles.content}>
      <Text variant="labelMedium" style={styles.title}>
        {title}
      </Text>
      <Text variant="headlineMedium" style={styles.value}>
        {value}
      </Text>
      {subtitle && (
        <Text variant="bodySmall" style={styles.subtitle}>
          {subtitle}
        </Text>
      )}
    </Card.Content>
  );

  if (outlined) {
    return (
      <Card mode="outlined" style={[styles.card, styles.outlined, style]} testID={testID}>
        {content}
      </Card>
    );
  }

  return (
    <Card style={[styles.card, style]} testID={testID}>
      {content}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    marginHorizontal: 4,
  },
  outlined: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.outlineVariant,
    borderRadius: radius.md,
  },
  content: {
    alignItems: "center",
    paddingVertical: 12,
  },
  title: {
    color: "#757575",
    textTransform: "uppercase",
  },
  value: {
    marginTop: 4,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#757575",
    marginTop: 2,
  },
});
