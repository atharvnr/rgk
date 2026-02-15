import { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { TextInput, Button, Text, ActivityIndicator } from "react-native-paper";
import { useRouter } from "expo-router";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../src/store";
import { useRegisterMutation, useGetMeQuery } from "../../src/services/api";
import { setUser } from "../../src/store/authSlice";

export default function OnboardingScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const onboardingRole = useSelector((state: RootState) => state.auth.onboardingRole);

  const [register, { isLoading: isRegistering }] = useRegisterMutation();
  const { refetch: refetchMe } = useGetMeQuery(undefined, { skip: true });

  // Common fields
  const [name, setName] = useState("");

  // Student fields
  const [schoolId, setSchoolId] = useState("");

  // School Admin fields
  const [schoolName, setSchoolName] = useState("");
  const [schoolAddress, setSchoolAddress] = useState("");
  const [schoolCity, setSchoolCity] = useState("");
  const [schoolState, setSchoolState] = useState("");
  const [schoolZipCode, setSchoolZipCode] = useState("");

  // Elder fields
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = async () => {
    if (!onboardingRole) return;

    try {
      let userData: any = {
        name,
        role: onboardingRole,
      };

      if (onboardingRole === "student") {
        userData.school_id = schoolId;
      } else if (onboardingRole === "school_admin") {
        // For school admin, we'll send school data separately if needed
        // For now, just register the user
        userData.address = schoolAddress;
      } else if (onboardingRole === "elder") {
        userData.address = address;
        userData.phone = phone;
      }

      await register(userData).unwrap();
      const { data: user } = await refetchMe();

      if (user) {
        dispatch(setUser(user));

        // Navigate to appropriate home based on role
        if (onboardingRole === "student") {
          router.replace("/(student)");
        } else if (onboardingRole === "school_admin") {
          router.replace("/(school)");
        } else if (onboardingRole === "elder") {
          router.replace("/(elder)");
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  const isValid = () => {
    if (!name) return false;

    if (onboardingRole === "student") {
      return !!schoolId;
    } else if (onboardingRole === "school_admin") {
      return !!schoolName && !!schoolAddress && !!schoolCity && !!schoolState && !!schoolZipCode;
    } else if (onboardingRole === "elder") {
      return !!address && !!phone;
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
          {onboardingRole === "student" && "Tell us about yourself as a student volunteer"}
          {onboardingRole === "school_admin" && "Set up your school information"}
          {onboardingRole === "elder" && "Tell us about yourself"}
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

        {onboardingRole === "student" && (
          <TextInput
            label="School ID"
            value={schoolId}
            onChangeText={setSchoolId}
            mode="outlined"
            style={styles.input}
            placeholder="Enter your school ID"
          />
        )}

        {onboardingRole === "school_admin" && (
          <>
            <TextInput
              label="School Name"
              value={schoolName}
              onChangeText={setSchoolName}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="School Address"
              value={schoolAddress}
              onChangeText={setSchoolAddress}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="City"
              value={schoolCity}
              onChangeText={setSchoolCity}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="State"
              value={schoolState}
              onChangeText={setSchoolState}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Zip Code"
              value={schoolZipCode}
              onChangeText={setSchoolZipCode}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
            />
          </>
        )}

        {onboardingRole === "elder" && (
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
