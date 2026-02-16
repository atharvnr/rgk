import { useState } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Text,
  TextInput,
  Button,
  Avatar,
  Divider,
  ActivityIndicator,
} from "react-native-paper";
import { useDispatch } from "react-redux";
import { useRouter } from "expo-router";
import { useGetMeQuery, useUpdateMeMutation } from "../../src/services/api";
import { logout } from "../../src/store/authSlice";
import { clearTokens } from "../../src/services/auth";
import { ErrorState } from "../../src/components/ErrorState";
import { getErrorMessage } from "../../src/utils/errorMessages";
import { useAppSnackbar } from "../../src/hooks/useAppSnackbar";

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { showError, showSuccess } = useAppSnackbar();
  const { data: user, isLoading: userLoading, isError, error, refetch } = useGetMeQuery();
  const [updateMe, { isLoading: updateLoading }] = useUpdateMeMutation();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [isEditing, setIsEditing] = useState(false);

  if (userLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isError) {
    return <ErrorState description={getErrorMessage(error)} onRetry={refetch} />;
  }

  const handleSave = async () => {
    try {
      await updateMe({
        name,
        phone,
        bio,
      }).unwrap();
      setIsEditing(false);
      showSuccess("Profile updated successfully");
    } catch (err) {
      showError(err as any, "Failed to update profile");
    }
  };

  const handleCancel = () => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
    setBio(user?.bio || "");
    setIsEditing(false);
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await clearTokens();
          dispatch(logout());
          router.replace("/");
        },
      },
    ]);
  };

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text size={80} label={initials} style={styles.avatar} />
        <Text variant="headlineSmall" style={styles.email}>
          {user?.email}
        </Text>
        <Text variant="bodyMedium" style={styles.role}>
          {user?.role.replace("_", " ").toUpperCase()}
        </Text>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.form}>
        <TextInput
          label="Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          disabled={!isEditing}
        />
        <TextInput
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          mode="outlined"
          style={styles.input}
          disabled={!isEditing}
          keyboardType="phone-pad"
        />
        <TextInput
          label="Bio"
          value={bio}
          onChangeText={setBio}
          mode="outlined"
          style={styles.input}
          disabled={!isEditing}
          multiline
          numberOfLines={4}
        />

        {isEditing ? (
          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              onPress={handleCancel}
              style={styles.button}
              disabled={updateLoading}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.button}
              loading={updateLoading}
              disabled={updateLoading}
            >
              Save
            </Button>
          </View>
        ) : (
          <Button
            mode="contained"
            onPress={() => setIsEditing(true)}
            style={styles.editButton}
          >
            Edit Profile
          </Button>
        )}
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
  header: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  avatar: {
    backgroundColor: "#6200ee",
  },
  email: {
    marginTop: 12,
  },
  role: {
    marginTop: 4,
    color: "#757575",
  },
  divider: {
    marginVertical: 16,
  },
  form: {
    padding: 16,
    backgroundColor: "#fff",
  },
  input: {
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  editButton: {
    marginTop: 8,
  },
  section: {
    padding: 16,
    backgroundColor: "#fff",
  },
  logoutButton: {
    borderColor: "#F44336",
  },
});
