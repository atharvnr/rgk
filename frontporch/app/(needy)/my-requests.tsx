import { View, FlatList, StyleSheet } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { useRouter } from "expo-router";
import { useGetRequestsQuery } from "../../src/services/api";
import { RequestCard } from "../../src/components/RequestCard";
import { EmptyState } from "../../src/components/EmptyState";
import { ErrorState } from "../../src/components/ErrorState";
import { getErrorMessage } from "../../src/utils/errorMessages";

export default function MyRequests() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useGetRequestsQuery({});

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isError) {
    return <ErrorState description={getErrorMessage(error)} onRetry={refetch} />;
  }

  const requests = data?.items || [];

  if (requests.length === 0) {
    return (
      <EmptyState
        icon="file-document-outline"
        title="No requests yet"
        description="Create your first request to connect with student volunteers"
        actionLabel="New Request"
        onAction={() => router.push("/(needy)/new-request")}
      />
    );
  }

  return (
    <FlatList
      data={requests}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <RequestCard
          request={item}
          onPress={() => router.push(`/(needy)/request/${item.id}`)}
        />
      )}
      contentContainerStyle={styles.listContainer}
      onRefresh={refetch}
      refreshing={isLoading}
    />
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  listContainer: {
    paddingVertical: 8,
    backgroundColor: "#f5f5f5",
  },
});
