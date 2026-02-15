import { StyleSheet } from "react-native";
import { Card, Chip, Text } from "react-native-paper";
import type { VolunteerRequest } from "../types";

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

interface RequestCardProps {
  request: VolunteerRequest;
  onPress?: () => void;
}

export function RequestCard({ request, onPress }: RequestCardProps) {
  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <Text variant="titleMedium">{request.title}</Text>
        <Text variant="bodySmall" style={styles.description} numberOfLines={2}>
          {request.description}
        </Text>
        <Card.Actions style={styles.chips}>
          <Chip compact textStyle={styles.chipText}>
            {CATEGORY_LABELS[request.category] || request.category}
          </Chip>
          <Chip
            compact
            textStyle={[
              styles.chipText,
              { color: STATUS_COLORS[request.status] || "#757575" },
            ]}
          >
            {request.status.replace("_", " ")}
          </Chip>
          {request.preferred_date && (
            <Chip compact textStyle={styles.chipText}>
              {request.preferred_date}
            </Chip>
          )}
        </Card.Actions>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  description: {
    marginTop: 4,
    color: "#757575",
  },
  chips: {
    marginTop: 8,
    paddingHorizontal: 0,
    justifyContent: "flex-start",
    gap: 8,
  },
  chipText: {
    fontSize: 11,
  },
});
