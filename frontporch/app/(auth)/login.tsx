import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Button, Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../src/store";
import { useAuth0Config, exchangeCodeForTokens, storeTokens } from "../../src/services/auth";
import { setToken } from "../../src/store/authSlice";

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { request, result, promptAsync } = useAuth0Config();

  useEffect(() => {
    if (result?.type === "success") {
      handleAuthSuccess(result.params.code);
    }
  }, [result]);

  const handleAuthSuccess = async (code: string) => {
    try {
      const { accessToken, refreshToken } = await exchangeCodeForTokens(code);
      await storeTokens(accessToken, refreshToken);
      dispatch(setToken(accessToken));
      router.replace("/(auth)/role-select");
    } catch (error) {
      console.error("Auth error:", error);
    }
  };

  const handleSignIn = async () => {
    try {
      await promptAsync();
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="displaySmall" style={styles.title}>
          RentGrandKids
        </Text>
        <Text variant="titleMedium" style={styles.subtitle}>
          Connecting generations through service
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSignIn}
          disabled={!request}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Sign In with Auth0
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    padding: 24,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    color: "#666",
  },
  buttonContainer: {
    paddingBottom: 40,
  },
  button: {
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
