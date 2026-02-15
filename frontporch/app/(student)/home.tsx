import { View, StyleSheet, ScrollView, FlatList } from "react-native";
import { Text, Divider, ActivityIndicator } from "react-native-paper";
import { useGetMeQuery, useGetSessionsQuery } from "../../src/services/api";
import { StatCard } from "../../src/components/StatCard";
import { SessionCard } from "../../src/components/SessionCard";
import { useRouter } from "expo-router";
import type { VolunteerSession } from "../../src/types";

export default function StudentHomeScreen() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useGetMeQuery();
  const { data: sessionsData, isLoading: sessionsLoading } =
    useGetSessionsQuery({ limit: 5 });

  if (userLoading || sessionsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const sessions = sessionsData?.items || [];
  const assignedCount = sessions.filter(
    (s) => s.status === "pending_approval"
  ).length;
  const completedCount = sessions.filter((s) => s.status === "approved").length;
  const totalHours = sessions
    .filter((s) => s.status === "approved")
    .reduce((sum, s) => sum + s.hours_logged, 0);

  const renderSessionItem = ({ item }: { item: VolunteerSession }) => (
    <SessionCard session={item} />
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.welcomeSection}>
        <Text variant="headlineMedium" style={styles.welcome}>
          Welcome, {user?.name?.split(" ")[0] || "Student"}!
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Here's your volunteer summary
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <StatCard
          title="Assigned"
          value={assignedCount}
          subtitle="requests"
        />
        <StatCard
          title="Completed"
          value={completedCount}
          subtitle="sessions"
        />
        <StatCard title="Total Hours" value={totalHours.toFixed(1)} />
      </View>

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Recent Sessions
        </Text>
        {sessions.length === 0 ? (
          <Text variant="bodyMedium" style={styles.emptyText}>
            No sessions yet. Start by browsing open requests!
          </Text>
        ) : (
          <FlatList
            data={sessions}
            renderItem={renderSessionItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
      </View>
    </ScrollView>
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
  welcomeSection: {
    padding: 16,
    backgroundColor: "#fff",
  },
  welcome: {
    fontWeight: "bold",
  },
  subtitle: {
    marginTop: 4,
    color: "#757575",
  },
  statsContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    backgroundColor: "#fff",
    paddingVertical: 16,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    marginBottom: 12,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    color: "#757575",
    paddingHorizontal: 16,
    marginTop: 8,
  },
});
