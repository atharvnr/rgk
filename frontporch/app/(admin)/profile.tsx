import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button } from "react-native-paper";
import { useGetMeQuery, useUpdateMeMutation } from "../../src/services/api";
import {
  AdminCard,
  AdminHeader,
  AdminScreen,
  CardTitle,
  FormRow,
  TextField,
  useColumnStyle,
} from "../../src/components/admin";
import { ErrorState } from "../../src/components/ErrorState";
import { useLogout } from "../../src/hooks/useLogout";
import { useAppSnackbar } from "../../src/hooks/useAppSnackbar";
import { getErrorMessage, type ApiError } from "../../src/utils/errorMessages";
import { spacing, theme } from "../../src/theme";

const { colors } = theme;

export default function AdminProfileScreen() {
  const column = useColumnStyle();
  const handleLogout = useLogout();
  const { showError, showSuccess } = useAppSnackbar();
  const { data: user, isLoading, isError, error, refetch } = useGetMeQuery();
  const [updateMe, { isLoading: isUpdating }] = useUpdateMeMutation();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const handleSave = async () => {
    try {
      await updateMe({ name: name.trim(), phone: phone.trim() }).unwrap();
      showSuccess("Profile updated");
    } catch (e) {
      showError(e as ApiError, "Failed to update profile");
    }
  };

  if (isLoading) {
    return (
      <AdminScreen>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      </AdminScreen>
    );
  }

  if (isError) {
    return (
      <AdminScreen>
        <ErrorState description={getErrorMessage(error)} onRetry={refetch} />
      </AdminScreen>
    );
  }

  const dirty = name.trim() !== (user?.name ?? "") || phone.trim() !== (user?.phone ?? "");

  return (
    <AdminScreen testID="admin-profile">
      <ScrollView contentContainerStyle={[column, styles.content]} keyboardShouldPersistTaps="handled">
        <AdminHeader title="Profile" />

        <AdminCard>
          <CardTitle>Account information</CardTitle>
          <View style={styles.fields}>
            <FormRow>
              <TextField label="Email" value={user?.email || ""} onChangeText={() => {}} disabled />
              <TextField label="Role" value="Platform admin" onChangeText={() => {}} disabled />
            </FormRow>
          </View>
        </AdminCard>

        <AdminCard>
          <CardTitle>Personal information</CardTitle>
          <View style={styles.fields}>
            <FormRow>
              <TextField label="Name" value={name} onChangeText={setName} maxLength={100} />
              <TextField
                label="Phone"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={20}
              />
            </FormRow>
          </View>
          <View style={styles.actions}>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={isUpdating}
              disabled={isUpdating || !dirty || !name.trim()}
            >
              Save changes
            </Button>
          </View>
        </AdminCard>

        <View style={styles.signOut}>
          <Button
            mode="outlined"
            icon="logout"
            onPress={handleLogout}
            textColor={colors.error}
            style={styles.signOutButton}
          >
            Sign out
          </Button>
        </View>
      </ScrollView>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fields: {
    gap: spacing.md,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.lg,
  },
  signOut: {
    alignItems: "flex-start",
  },
  signOutButton: {
    borderColor: "#F2C9C5",
  },
});
