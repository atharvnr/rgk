import { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { TextInput, Button, Text, ActivityIndicator } from "react-native-paper";
import { useRouter } from "expo-router";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../src/store";
import { useRegisterMutation } from "../../src/services/api";
import { setUser } from "../../src/store/authSlice";
import { useAppSnackbar } from "../../src/hooks/useAppSnackbar";

export default function OnboardingScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const onboardingRole = useSelector((state: RootState) => state.auth.onboardingRole);

  const { showError } = useAppSnackbar();
  const [register, { isLoading: isRegistering }] = useRegisterMutation();

  // Common fields
  const [name, setName] = useState("");

  // Needy / Needy Proxy fields
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = async () => {
    if (!onboardingRole) return;

    try {
      const userData: Record<string, string> = {
        name,
        role: onboardingRole,
      };

      if (onboardingRole === "needy") {
        userData.address = address;
        userData.phone = phone;
      } else if (onboardingRole === "needy_proxy") {
        userData.phone = phone;
      }

      const user = await register(userData).unwrap();
      dispatch(setUser(user));
      router.replace("/");
    } catch (err) {
      showError(err as any, "Registration failed. Please try again.");
    }
  };

  const isValid = () => {
    if (!name) return false;

    if (onboardingRole === "volunteer") {
      return true;
    } else if (onboardingRole === "needy") {
      return !!address && !!phone;
    } else if (onboardingRole === "needy_proxy") {
      return !!phone;
    }

    return false;
  };

  if (!onboardingRole) {
    return (
      <View style={styles.container}>
        <Text>No role selected</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Complete Your Profile
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          {onboardingRole === "volunteer" && "Tell us about yourself as a volunteer"}
          {onboardingRole === "needy" && "Tell us about yourself"}
          {onboardingRole === "needy_proxy" && "Tell us about yourself as a proxy"}
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          label="Full Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
        />

        {onboardingRole === "needy" && (
          <>
            <TextInput
              label="Address"
              value={address}
              onChangeText={setAddress}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={2}
            />
            <TextInput
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              mode="outlined"
              style={styles.input}
              keyboardType="phone-pad"
            />
          </>
        )}

        {onboardingRole === "needy_proxy" && (
          <TextInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            mode="outlined"
            style={styles.input}
            keyboardType="phone-pad"
          />
        )}
      </View>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          disabled={!isValid() || isRegistering}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          {isRegistering ? <ActivityIndicator color="#fff" /> : "Complete Setup"}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginTop: 60,
    marginBottom: 32,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    color: "#666",
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: "#fff",
  },
  buttonContainer: {
    marginTop: 32,
  },
  button: {
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
