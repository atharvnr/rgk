import { View, FlatList, StyleSheet } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { useRouter } from "expo-router";
import { useGetRequestsQuery } from "../../src/services/api";
import { RequestCard } from "../../src/components/RequestCard";
import { EmptyState } from "../../src/components/EmptyState";

export default function MyRequests() {
  const router = useRouter();
  const { data, isLoading, refetch } = useGetRequestsQuery({});

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const requests = data?.items || [];

  if (requests.length === 0) {
    return (
      <EmptyState
        icon="file-document-outline"
        title="No requests yet"
        description="Create your first request to connect with student volunteers"
        actionLabel="New Request"
        onAction={() => router.push("/(elder)/new-request")}
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
          onPress={() => router.push(`/(elder)/request/${item.id}`)}
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
