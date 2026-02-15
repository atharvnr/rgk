import { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import {
  TextInput,
  Button,
  Text,
  Avatar,
  ActivityIndicator,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import { useGetMeQuery, useUpdateMeMutation } from "../../src/services/api";
import { logout } from "../../src/store/authSlice";
import { clearTokens } from "../../src/services/auth";

export default function Profile() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { data: user, isLoading: userLoading } = useGetMeQuery();
  const [updateMe, { isLoading: updating }] = useUpdateMeMutation();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
      setBio(user.bio || "");
    }
  }, [user]);

  const handleSave = async () => {
    try {
      await updateMe({
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        bio: bio.trim() || undefined,
      }).unwrap();

      Alert.alert("Success", "Profile updated successfully");
    } catch (error: any) {
      Alert.alert("Error", error.data?.detail || "Failed to update profile");
    }
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
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  if (userLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text
          size={80}
          label={user?.name?.substring(0, 2).toUpperCase() || "EL"}
          style={styles.avatar}
        />
        <Text variant="titleMedium" style={styles.email}>
          {user?.email}
        </Text>
        <Text variant="labelMedium" style={styles.role}>
          Elder
        </Text>
      </View>

      <View style={styles.form}>
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

        <TextInput
          label="Address"
          value={address}
          onChangeText={setAddress}
          mode="outlined"
          multiline
          numberOfLines={2}
          style={styles.input}
        />

        <TextInput
          label="Bio"
          value={bio}
          onChangeText={setBio}
          mode="outlined"
          multiline
          numberOfLines={4}
          style={styles.input}
          placeholder="Tell students a bit about yourself"
        />

        <Button
          mode="contained"
          onPress={handleSave}
          disabled={updating}
          style={styles.saveButton}
          contentStyle={styles.buttonContent}
        >
          {updating ? <ActivityIndicator color="white" /> : "Save Changes"}
        </Button>

        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
          contentStyle={styles.buttonContent}
          textColor="#F44336"
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: 24,
    backgroundColor: "white",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  avatar: {
    backgroundColor: "#6200ee",
  },
  email: {
    marginTop: 12,
    color: "#424242",
  },
  role: {
    marginTop: 4,
    color: "#757575",
    textTransform: "uppercase",
  },
  form: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "white",
  },
  saveButton: {
    marginTop: 8,
  },
  logoutButton: {
    marginTop: 12,
    borderColor: "#F44336",
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
