import { View, StyleSheet, FlatList } from "react-native";
import { ActivityIndicator, Card, Button, Text } from "react-native-paper";
import { useSelector } from "react-redux";
import type { RootState } from "../../src/store";
import {
  useGetSessionsQuery,
  useApproveSessionMutation,
} from "../../src/services/api";
import { EmptyState } from "../../src/components/EmptyState";
import { ErrorState } from "../../src/components/ErrorState";
import { getErrorMessage } from "../../src/utils/errorMessages";
import { useAppSnackbar } from "../../src/hooks/useAppSnackbar";
import type { VolunteerSession } from "../../src/types";
import { useRouter } from "expo-router";

export default function ApprovalsScreen() {
  const router = useRouter();
  const { showError, showSuccess } = useAppSnackbar();
  const { data: sessionsData, isLoading, isError, error, refetch } = useGetSessionsQuery({
    status: "pending_approval",
    limit: 100,
  });
  const [approveSession, { isLoading: isApproving }] =
    useApproveSessionMutation();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isError) {
    return <ErrorState description={getErrorMessage(error)} onRetry={refetch} />;
  }

  const sessions = sessionsData?.items || [];

  const handleApprove = async (sessionId: string, approved: boolean) => {
    try {
      await approveSession({ id: sessionId, approved }).unwrap();
      showSuccess(`Session ${approved ? "approved" : "rejected"} successfully`);
    } catch (err) {
      showError(err as any, "Failed to update session");
    }
  };

  const renderSessionItem = ({ item }: { item: VolunteerSession }) => (
    <Card
      style={styles.card}
      onPress={() => router.push(`/(school)/session/${item.id}`)}
    >
      <Card.Content>
        <Text variant="titleMedium">{item.hours_logged} hours logged</Text>
        <Text variant="bodySmall" style={styles.date}>
          {new Date(item.date).toLocaleDateString()}
        </Text>
        {item.notes && (
          <Text variant="bodySmall" style={styles.notes} numberOfLines={2}>
            {item.notes}
          </Text>
        )}
      </Card.Content>
      <Card.Actions>
        <Button
          mode="outlined"
          onPress={() => handleApprove(item.id, false)}
          disabled={isApproving}
          textColor="#F44336"
        >
          Reject
        </Button>
        <Button
          mode="contained"
          onPress={() => handleApprove(item.id, true)}
          disabled={isApproving}
          buttonColor="#4CAF50"
        >
          Approve
        </Button>
      </Card.Actions>
    </Card>
  );

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon="check-circle-outline"
        title="No Pending Approvals"
        description="All volunteer sessions have been reviewed. New sessions will appear here for approval."
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        renderItem={renderSessionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
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
  listContainer: {
    paddingVertical: 8,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  date: {
    color: "#757575",
    marginTop: 2,
  },
  notes: {
    marginTop: 4,
    color: "#757575",
  },
});
