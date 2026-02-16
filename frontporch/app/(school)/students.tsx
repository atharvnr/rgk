import { View, StyleSheet, FlatList } from "react-native";
import { List, ActivityIndicator } from "react-native-paper";
import { useSelector } from "react-redux";
import type { RootState } from "../../src/store";
import {
  useGetMeQuery,
  useGetSchoolStudentsQuery,
} from "../../src/services/api";
import { EmptyState } from "../../src/components/EmptyState";
import { ErrorState } from "../../src/components/ErrorState";
import { getErrorMessage } from "../../src/utils/errorMessages";
import type { User } from "../../src/types";

export default function StudentsScreen() {
  const { data: user, isLoading: userLoading, isError: userError, error: userErr, refetch: refetchUser } = useGetMeQuery();
  const { data: studentsData, isLoading: studentsLoading, isError: studentsError, error: studentsErr, refetch: refetchStudents } =
    useGetSchoolStudentsQuery(
      { id: user?.school_id || "", limit: 100 },
      { skip: !user?.school_id }
    );

  if (userLoading || studentsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (userError || studentsError) {
    return (
      <ErrorState
        description={getErrorMessage(userErr || studentsErr)}
        onRetry={() => { refetchUser(); refetchStudents(); }}
      />
    );
  }

  const students = studentsData?.items || [];

  const renderStudentItem = ({ item }: { item: User }) => (
    <List.Item
      title={item.name}
      description={item.email}
      left={(props) => <List.Icon {...props} icon="account" />}
      style={styles.listItem}
    />
  );

  if (students.length === 0) {
    return (
      <EmptyState
        icon="account-group"
        title="No Students Yet"
        description="Students from your school will appear here once they register."
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={students}
        renderItem={renderStudentItem}
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
  listItem: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
  },
});
