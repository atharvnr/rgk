import { Alert } from "react-native";
import { useDispatch } from "react-redux";
import { useRouter } from "expo-router";
import { logout } from "../store/authSlice";
import { clearTokens, logoutFromAuth0 } from "../services/auth";

export function useLogout() {
  const dispatch = useDispatch();
  const router = useRouter();

  const auth0Logout = async () => {
    try {
      await logoutFromAuth0();
      await clearTokens();
      dispatch(logout());
      router.replace("/(auth)/login");
    } catch (e) {
      console.log("Logout error", e);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to logout?")) {
        auth0Logout();
      }
    } else {
      Alert.alert("Logout", "Are you sure you want to logout?", [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: auth0Logout },
      ]);
    }
  };

  return handleLogout;
}