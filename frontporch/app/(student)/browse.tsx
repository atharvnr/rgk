import { View, StyleSheet, FlatList } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { useRouter } from "expo-router";
import { useGetRequestsQuery } from "../../src/services/api";
import { RequestCard } from "../../src/components/RequestCard";
import { EmptyState } from "../../src/components/EmptyState";
import type { VolunteerRequest } from "../../src/types";

export default function BrowseScreen() {
  const router = useRouter();
  const { data: requestsData, isLoading } = useGetRequestsQuery({
    status: "open",
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const requests = requestsData?.items || [];

  const renderRequestItem = ({ item }: { item: VolunteerRequest }) => (
    <RequestCard
      request={item}
      onPress={() => router.push(`/(student)/request/${item.id}`)}
    />
  );

  if (requests.length === 0) {
    return (
      <EmptyState
        icon="file-document-outline"
        title="No Open Requests"
        description="There are currently no open volunteer requests available. Check back soon!"
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={requests}
        renderItem={renderRequestItem}
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
