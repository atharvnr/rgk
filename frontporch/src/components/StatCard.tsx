import { StyleSheet } from "react-native";
import { Card, Text } from "react-native-paper";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

export function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <Card style={styles.card}>
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
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    marginHorizontal: 4,
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
