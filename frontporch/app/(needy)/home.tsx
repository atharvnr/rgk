import { View, ScrollView, StyleSheet } from "react-native";
import { Text, ActivityIndicator } from "react-native-paper";
import { useRouter } from "expo-router";
import { useGetMeQuery, useGetRequestsQuery } from "../../src/services/api";
import { StatCard } from "../../src/components/StatCard";
import { RequestCard } from "../../src/components/RequestCard";
import { EmptyState } from "../../src/components/EmptyState";
import { ErrorState } from "../../src/components/ErrorState";
import { getErrorMessage } from "../../src/utils/errorMessages";

export default function ElderHome() {
  const router = useRouter();
  const { data: user, isLoading: userLoading, isError: userError, error: userErr, refetch: refetchUser } = useGetMeQuery();
  const { data: requestsData, isLoading: requestsLoading, isError: requestsError, error: requestsErr, refetch: refetchRequests } =
    useGetRequestsQuery({ limit: 5 });

  if (userLoading || requestsLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (userError || requestsError) {
    return (
      <ErrorState
        description={getErrorMessage(userErr || requestsErr)}
        onRetry={() => { refetchUser(); refetchRequests(); }}
      />
    );
  }

  const requests = requestsData?.items || [];
  const activeRequests = requests.filter(
    (r) => r.status === "open" || r.status === "assigned" || r.status === "in_progress"
  );
  const completedRequests = requests.filter((r) => r.status === "completed");

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.welcomeText}>
          Welcome, {user?.name || "Elder"}
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Manage your volunteer requests
        </Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard title="Active" value={activeRequests.length} />
        <StatCard title="Completed" value={completedRequests.length} />
      </View>

      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Recent Requests
        </Text>
        {requests.length === 0 ? (
          <EmptyState
            icon="file-document-outline"
            title="No requests yet"
            description="Create your first request to get started"
            actionLabel="New Request"
            onAction={() => router.push("/(needy)/new-request")}
          />
        ) : (
          requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onPress={() => router.push(`/(needy)/request/${request.id}`)}
            />
          ))
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  welcomeText: {
    fontWeight: "bold",
  },
  subtitle: {
    marginTop: 4,
    color: "#757575",
  },
  statsRow: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
  },
  section: {
    marginTop: 8,
    paddingVertical: 16,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    marginBottom: 12,
    fontWeight: "bold",
  },
});
