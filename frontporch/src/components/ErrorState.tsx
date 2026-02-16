import { View, StyleSheet } from "react-native";
import { Text, Icon, Button } from "react-native-paper";

interface ErrorStateProps {
  icon?: string;
  title?: string;
  description: string;
  onRetry?: () => void;
}

export function ErrorState({
  icon = "alert-circle-outline",
  title = "Something went wrong",
  description,
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Icon source={icon} size={64} color="#D32F2F" />
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={styles.description}>
        {description}
      </Text>
      {onRetry && (
        <Button mode="contained" onPress={onRetry} style={styles.button}>
          Try Again
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  title: {
    marginTop: 16,
    textAlign: "center",
  },
  description: {
    marginTop: 8,
    textAlign: "center",
    color: "#757575",
  },
  button: {
    marginTop: 24,
  },
});
