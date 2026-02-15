import { View, StyleSheet, FlatList } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { useGetSessionsQuery } from "../../src/services/api";
import { SessionCard } from "../../src/components/SessionCard";
import { EmptyState } from "../../src/components/EmptyState";
import type { VolunteerSession } from "../../src/types";

export default function SessionsScreen() {
  const { data: sessionsData, isLoading } = useGetSessionsQuery({});

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const sessions = sessionsData?.items || [];

  const renderSessionItem = ({ item }: { item: VolunteerSession }) => (
    <SessionCard session={item} />
  );

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon="clock-outline"
        title="No Sessions Yet"
        description="You haven't logged any volunteer sessions yet. Accept a request to get started!"
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        renderItem={renderSessionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  list: {
    paddingVertical: 8,
  },
});
