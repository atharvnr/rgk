import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Button, Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../src/store";
import { useAuth0Config, exchangeCodeForTokens, storeTokens } from "../../src/services/auth";
import { setToken, setUser, setLoading } from "../../src/store/authSlice";
import { api } from "../../src/services/api";

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { request, result, promptAsync } = useAuth0Config();

  useEffect(() => {
    console.log("[Auth] result changed:", JSON.stringify(result, null, 2));
    if (result?.type === "success" && request?.codeVerifier) {
      handleAuthSuccess(result.params.code, request.codeVerifier);
    }
  }, [result]);

  const handleAuthSuccess = async (code: string, codeVerifier: string) => {
    try {
      const { accessToken, refreshToken } = await exchangeCodeForTokens(code, codeVerifier);
      console.log("[Auth] Login tokens received — refresh token:", refreshToken ? "present" : "MISSING");
      await storeTokens(accessToken, refreshToken);
      dispatch(setToken(accessToken));

      // Check if user is already registered
      const result = await dispatch(api.endpoints.getMe.initiate(undefined));
      if (result.data) {
        dispatch(setUser(result.data));
        dispatch(setLoading(false));
        router.replace("/");
      } else {
        dispatch(setLoading(false));
        router.replace("/(auth)/role-select");
      }
    } catch (error) {
      console.error("Auth error:", error);
      dispatch(setLoading(false));
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
          Login with Auth0
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
