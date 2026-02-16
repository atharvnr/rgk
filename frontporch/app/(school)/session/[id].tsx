import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  ActivityIndicator,
  Divider,
  Button,
  Card,
} from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  useGetSessionQuery,
  useGetUserQuery,
  useApproveSessionMutation,
} from "../../../src/services/api";
import { ErrorState } from "../../../src/components/ErrorState";
import { getErrorMessage } from "../../../src/utils/errorMessages";
import { useAppSnackbar } from "../../../src/hooks/useAppSnackbar";

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showError, showSuccess } = useAppSnackbar();
  const { data: session, isLoading: sessionLoading, isError, error, refetch } = useGetSessionQuery(
    id || ""
  );
  const { data: student, isLoading: studentLoading } = useGetUserQuery(
    session?.student_id || "",
    { skip: !session?.student_id }
  );
  const [approveSession, { isLoading: isApproving }] =
    useApproveSessionMutation();

  if (sessionLoading || studentLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isError) {
    return <ErrorState description={getErrorMessage(error)} onRetry={refetch} />;
  }

  if (!session) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Session not found</Text>
      </View>
    );
  }

  const handleApprove = async (approved: boolean) => {
    try {
      await approveSession({ id: session.id, approved }).unwrap();
      showSuccess(`Session ${approved ? "approved" : "rejected"} successfully`);
      router.back();
    } catch (err) {
      showError(err as any, "Failed to update session");
    }
  };

  const statusColor =
    session.status === "approved"
      ? "#4CAF50"
      : session.status === "rejected"
      ? "#F44336"
      : "#FF9800";

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            Volunteer Session
          </Text>
          <Text variant="bodyMedium" style={[styles.status, { color: statusColor }]}>
            Status: {session.status.replace("_", " ").toUpperCase()}
          </Text>
        </Card.Content>
      </Card>

      <Divider style={styles.divider} />

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Session Details
          </Text>
          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.label}>
              Hours Logged:
            </Text>
            <Text variant="bodyMedium" style={styles.value}>
              {session.hours_logged} hours
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.label}>
              Date:
            </Text>
            <Text variant="bodyMedium" style={styles.value}>
              {new Date(session.date).toLocaleDateString()}
            </Text>
          </View>
          {session.notes && (
            <View style={styles.notesContainer}>
              <Text variant="bodyMedium" style={styles.label}>
                Notes:
              </Text>
              <Text variant="bodyMedium" style={styles.notesText}>
                {session.notes}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      <Divider style={styles.divider} />

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Student Information
          </Text>
          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.label}>
              Name:
            </Text>
            <Text variant="bodyMedium" style={styles.value}>
              {student?.name || "Loading..."}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.label}>
              Email:
            </Text>
            <Text variant="bodyMedium" style={styles.value}>
              {student?.email || "Loading..."}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {session.status === "pending_approval" && (
        <>
          <Divider style={styles.divider} />
          <View style={styles.actionsContainer}>
            <Button
              mode="outlined"
              onPress={() => handleApprove(false)}
              disabled={isApproving}
              textColor="#F44336"
              style={styles.actionButton}
            >
              Reject Session
            </Button>
            <Button
              mode="contained"
              onPress={() => handleApprove(true)}
              disabled={isApproving}
              buttonColor="#4CAF50"
              style={styles.actionButton}
            >
              Approve Session
            </Button>
          </View>
        </>
      )}

      {session.approved_by && session.approved_at && (
        <>
          <Divider style={styles.divider} />
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="bodySmall" style={styles.approvalInfo}>
                {session.status === "approved" ? "Approved" : "Rejected"} on{" "}
                {new Date(session.approved_at).toLocaleDateString()}
              </Text>
            </Card.Content>
          </Card>
        </>
      )}
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
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  status: {
    fontWeight: "600",
    textTransform: "uppercase",
  },
  divider: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    color: "#757575",
    fontWeight: "500",
  },
  value: {
    fontWeight: "400",
  },
  notesContainer: {
    marginTop: 8,
  },
  notesText: {
    marginTop: 4,
    color: "#424242",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionButton: {
    flex: 1,
  },
  approvalInfo: {
    color: "#757575",
    textAlign: "center",
  },
});
