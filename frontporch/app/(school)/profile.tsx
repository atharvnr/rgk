import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  TextInput,
  Button,
  ActivityIndicator,
  Divider,
  Text,
} from "react-native-paper";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useGetMeQuery, useUpdateMeMutation } from "../../src/services/api";
import { logout } from "../../src/store/authSlice";
import { clearTokens, logoutFromAuth0 } from "../../src/services/auth";
import { useRouter } from "expo-router";
import { ErrorState } from "../../src/components/ErrorState";
import { getErrorMessage } from "../../src/utils/errorMessages";
import { useAppSnackbar } from "../../src/hooks/useAppSnackbar";

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
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
      await updateMe({ name, phone }).unwrap();
      showSuccess("Profile updated successfully");
    } catch (err) {
      showError(err as any, "Failed to update profile");
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {

          try {
            // 🔴 STEP 1 — logout from Auth0 session
            await logoutFromAuth0();

            // 🔴 STEP 2 — clear local tokens
            await clearTokens();

            // 🔴 STEP 3 — clear redux state
            dispatch(logout());

            // 🔴 STEP 4 — go to login screen
            router.replace("/(auth)/login");
          } catch (e) {
            console.log("Logout error", e);
          }
        },
      },
    ]);
  };

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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Account Information
        </Text>
        <TextInput
          label="Email"
          value={user?.email || ""}
          mode="outlined"
          disabled
          style={styles.input}
        />
        <TextInput
          label="Role"
          value="School Admin"
          mode="outlined"
          disabled
          style={styles.input}
        />
      </View>

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Personal Information
        </Text>
        <TextInput
          label="Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          mode="outlined"
          keyboardType="phone-pad"
          style={styles.input}
        />
        <Button
          mode="contained"
          onPress={handleSave}
          loading={isUpdating}
          disabled={isUpdating}
          style={styles.saveButton}
        >
          Save Changes
        </Button>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <Button
          mode="outlined"
          onPress={handleLogout}
          textColor="#F44336"
          style={styles.logoutButton}
        >
          Logout
        </Button>
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
  section: {
    backgroundColor: "#fff",
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: "600",
  },
  input: {
    marginBottom: 12,
  },
  saveButton: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 16,
  },
  logoutButton: {
    borderColor: "#F44336",
  },
});
