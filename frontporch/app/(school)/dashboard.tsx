import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Divider, ActivityIndicator } from "react-native-paper";
import { useSelector } from "react-redux";
import type { RootState } from "../../src/store";
import {
  useGetMeQuery,
  useGetSchoolHoursQuery,
} from "../../src/services/api";
import { StatCard } from "../../src/components/StatCard";

export default function SchoolDashboardScreen() {
  const { data: user, isLoading: userLoading } = useGetMeQuery();
  const { data: schoolHours, isLoading: hoursLoading } =
    useGetSchoolHoursQuery(user?.school_id || "", {
      skip: !user?.school_id,
    });

  if (userLoading || hoursLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const totalHours = schoolHours?.total_hours || 0;
  const approvedSessions = schoolHours?.approved_sessions || 0;
  const schoolName = schoolHours?.school_name || "School";

  return (
    <ScrollView style={styles.container}>
      <View style={styles.welcomeSection}>
        <Text variant="headlineMedium" style={styles.welcome}>
          {schoolName}
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          School volunteer dashboard
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <StatCard
          title="Total Hours"
          value={totalHours.toFixed(1)}
          subtitle="logged"
        />
        <StatCard
          title="Approved"
          value={approvedSessions}
          subtitle="sessions"
        />
        <StatCard
          title="Active Students"
          value={0}
          subtitle="this month"
        />
      </View>

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Quick Actions
        </Text>
        <Text variant="bodyMedium" style={styles.infoText}>
          Use the tabs below to manage students and approve volunteer sessions.
        </Text>
      </View>
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
  welcomeSection: {
    padding: 16,
    backgroundColor: "#fff",
  },
  welcome: {
    fontWeight: "bold",
  },
  subtitle: {
    marginTop: 4,
    color: "#757575",
  },
  statsContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: "600",
  },
  infoText: {
    color: "#757575",
  },
});
