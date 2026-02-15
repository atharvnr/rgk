import { StyleSheet } from "react-native";
import { Card, Chip, Text } from "react-native-paper";
import type { VolunteerSession } from "../types";

const STATUS_COLORS: Record<string, string> = {
  pending_approval: "#FF9800",
  approved: "#4CAF50",
  rejected: "#F44336",
};

interface SessionCardProps {
  session: VolunteerSession;
  onPress?: () => void;
}

export function SessionCard({ session, onPress }: SessionCardProps) {
  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <Text variant="titleMedium">{session.hours_logged} hours</Text>
        <Text variant="bodySmall" style={styles.date}>
          {session.date}
        </Text>
        {session.notes && (
          <Text variant="bodySmall" style={styles.notes} numberOfLines={2}>
            {session.notes}
          </Text>
        )}
        <Card.Actions style={styles.chips}>
          <Chip
            compact
            textStyle={[
              styles.chipText,
              { color: STATUS_COLORS[session.status] || "#757575" },
            ]}
          >
            {session.status.replace("_", " ")}
          </Chip>
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
  date: {
    color: "#757575",
    marginTop: 2,
  },
  notes: {
    marginTop: 4,
    color: "#757575",
  },
  chips: {
    marginTop: 8,
    paddingHorizontal: 0,
    justifyContent: "flex-start",
  },
  chipText: {
    fontSize: 11,
  },
});
