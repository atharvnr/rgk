import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Text,
  Card,
  Button,
  Chip,
  Divider,
  ActivityIndicator,
} from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  useGetRequestQuery,
  useAcceptRequestMutation,
  useUpdateRequestStatusMutation,
} from "../../../src/services/api";

const CATEGORY_LABELS: Record<string, string> = {
  companionship: "Companionship",
  errands: "Errands",
  tech_help: "Tech Help",
  yard_work: "Yard Work",
  transportation: "Transportation",
  other: "Other",
};

const STATUS_COLORS: Record<string, string> = {
  open: "#4CAF50",
  assigned: "#2196F3",
  in_progress: "#FF9800",
  completed: "#9E9E9E",
  cancelled: "#F44336",
};

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: request, isLoading } = useGetRequestQuery(id as string);
  const [acceptRequest, { isLoading: accepting }] = useAcceptRequestMutation();
  const [updateStatus, { isLoading: updating }] =
    useUpdateRequestStatusMutation();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="titleMedium">Request not found</Text>
      </View>
    );
  }

  const handleAccept = async () => {
    Alert.alert(
      "Accept Request",
      "Are you sure you want to accept this volunteer request?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: async () => {
            try {
              await acceptRequest(request.id).unwrap();
              Alert.alert("Success", "Request accepted successfully");
              router.back();
            } catch (error) {
              Alert.alert("Error", "Failed to accept request");
            }
          },
        },
      ]
    );
  };

  const handleStatusUpdate = async (newStatus: string) => {
    const statusLabels: Record<string, string> = {
      in_progress: "In Progress",
      completed: "Completed",
    };

    Alert.alert(
      `Update Status`,
      `Mark this request as ${statusLabels[newStatus]}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Update",
          onPress: async () => {
            try {
              await updateStatus({
                id: request.id,
                status: newStatus,
              }).unwrap();
              Alert.alert("Success", "Status updated successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to update status");
            }
          },
        },
      ]
    );
  };

  const canAccept = request.status === "open";
  const isAssigned = request.status === "assigned";
  const isInProgress = request.status === "in_progress";

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.title}>
              {request.title}
            </Text>
            <View style={styles.chips}>
              <Chip
                textStyle={[
                  styles.chipText,
                  { color: STATUS_COLORS[request.status] || "#757575" },
                ]}
              >
                {request.status.replace("_", " ")}
              </Chip>
              <Chip textStyle={styles.chipText}>
                {CATEGORY_LABELS[request.category] || request.category}
              </Chip>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.section}>
            <Text variant="labelLarge" style={styles.label}>
              Description
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              {request.description}
            </Text>
          </View>

          {request.location && (
            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.label}>
                Location
              </Text>
              <Text variant="bodyMedium">{request.location}</Text>
            </View>
          )}

          {request.preferred_date && (
            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.label}>
                Preferred Date
              </Text>
              <Text variant="bodyMedium">{request.preferred_date}</Text>
            </View>
          )}

          {request.preferred_time_slot && (
            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.label}>
                Preferred Time
              </Text>
              <Text variant="bodyMedium">{request.preferred_time_slot}</Text>
            </View>
          )}

          <Divider style={styles.divider} />

          {canAccept && (
            <Button
              mode="contained"
              onPress={handleAccept}
              loading={accepting}
              disabled={accepting}
              style={styles.actionButton}
            >
              Accept Request
            </Button>
          )}

          {isAssigned && (
            <Button
              mode="contained"
              onPress={() => handleStatusUpdate("in_progress")}
              loading={updating}
              disabled={updating}
              style={styles.actionButton}
            >
              Mark as In Progress
            </Button>
          )}

          {isInProgress && (
            <Button
              mode="contained"
              onPress={() => handleStatusUpdate("completed")}
              loading={updating}
              disabled={updating}
              style={styles.actionButton}
            >
              Mark as Completed
            </Button>
          )}
        </Card.Content>
      </Card>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  card: {
    margin: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontWeight: "600",
    marginBottom: 12,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chipText: {
    fontSize: 11,
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    color: "#757575",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  description: {
    lineHeight: 20,
  },
  actionButton: {
    marginTop: 8,
  },
});
