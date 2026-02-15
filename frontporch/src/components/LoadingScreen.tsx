import { View, StyleSheet } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";

export function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text variant="bodyLarge" style={styles.text}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  text: {
    marginTop: 16,
    color: "#757575",
  },
});
