import { View, ScrollView, StyleSheet, Alert } from "react-native";
import {
  Text,
  Card,
  Chip,
  Button,
  ActivityIndicator,
  Divider,
} from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  useGetRequestQuery,
  useGetUserQuery,
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

export default function RequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: request, isLoading: requestLoading } = useGetRequestQuery(
    id || ""
  );
  const { data: student, isLoading: studentLoading } = useGetUserQuery(
    request?.assigned_student_id || "",
    { skip: !request?.assigned_student_id }
  );
  const [updateStatus, { isLoading: updating }] =
    useUpdateRequestStatusMutation();

  const handleCancel = async () => {
    if (!request) return;

    Alert.alert(
      "Cancel Request",
      "Are you sure you want to cancel this request?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              await updateStatus({
                id: request.id,
                status: "cancelled",
              }).unwrap();
              Alert.alert("Success", "Request cancelled successfully", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.data?.detail || "Failed to cancel request"
              );
            }
          },
        },
      ]
    );
  };

  if (requestLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="titleMedium">Request not found</Text>
      </View>
    );
  }

  const canCancel =
    request.status === "open" ||
    request.status === "assigned" ||
    request.status === "in_progress";

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            {request.title}
          </Text>

          <View style={styles.chipsContainer}>
            <Chip style={styles.chip}>
              {CATEGORY_LABELS[request.category] || request.category}
            </Chip>
            <Chip
              style={styles.chip}
              textStyle={{
                color: STATUS_COLORS[request.status] || "#757575",
              }}
            >
              {request.status.replace("_", " ")}
            </Chip>
          </View>

          <Divider style={styles.divider} />

          <Text variant="labelLarge" style={styles.label}>
            Description
          </Text>
          <Text variant="bodyMedium" style={styles.description}>
            {request.description}
          </Text>

          {request.location && (
            <>
              <Text variant="labelLarge" style={styles.label}>
                Location
              </Text>
              <Text variant="bodyMedium" style={styles.value}>
                {request.location}
              </Text>
            </>
          )}

          {request.preferred_date && (
            <>
              <Text variant="labelLarge" style={styles.label}>
                Preferred Date
              </Text>
              <Text variant="bodyMedium" style={styles.value}>
                {request.preferred_date}
              </Text>
            </>
          )}

          {request.preferred_time_slot && (
            <>
              <Text variant="labelLarge" style={styles.label}>
                Preferred Time
              </Text>
              <Text variant="bodyMedium" style={styles.value}>
                {request.preferred_time_slot}
              </Text>
            </>
          )}

          <Divider style={styles.divider} />

          <Text variant="labelSmall" style={styles.timestamp}>
            Created: {new Date(request.created_at).toLocaleDateString()}
          </Text>
        </Card.Content>
      </Card>

      {request.assigned_student_id && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Assigned Student
            </Text>
            {studentLoading ? (
              <ActivityIndicator />
            ) : student ? (
              <>
                <Text variant="bodyLarge" style={styles.studentName}>
                  {student.name}
                </Text>
                <Text variant="bodyMedium" style={styles.studentEmail}>
                  {student.email}
                </Text>
                {student.phone && (
                  <Text variant="bodyMedium" style={styles.studentPhone}>
                    {student.phone}
                  </Text>
                )}
              </>
            ) : (
              <Text variant="bodyMedium" style={styles.noStudent}>
                Student information unavailable
              </Text>
            )}
          </Card.Content>
        </Card>
      )}

      {canCancel && (
        <Button
          mode="outlined"
          onPress={handleCancel}
          disabled={updating}
          style={styles.cancelButton}
          contentStyle={styles.buttonContent}
          textColor="#F44336"
        >
          {updating ? <ActivityIndicator /> : "Cancel Request"}
        </Button>
      )}
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
    backgroundColor: "#f5f5f5",
  },
  card: {
    margin: 16,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    alignSelf: "flex-start",
  },
  divider: {
    marginVertical: 16,
  },
  label: {
    marginTop: 12,
    marginBottom: 4,
    color: "#424242",
  },
  description: {
    color: "#424242",
    lineHeight: 22,
  },
  value: {
    color: "#424242",
  },
  timestamp: {
    marginTop: 8,
    color: "#757575",
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 12,
  },
  studentName: {
    fontWeight: "600",
    marginBottom: 4,
  },
  studentEmail: {
    color: "#757575",
    marginBottom: 2,
  },
  studentPhone: {
    color: "#757575",
  },
  noStudent: {
    color: "#757575",
    fontStyle: "italic",
  },
  cancelButton: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderColor: "#F44336",
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
