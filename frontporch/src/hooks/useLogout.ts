import { Alert } from "react-native";
import { useDispatch } from "react-redux";
import { useRouter } from "expo-router";
import { logout } from "../store/authSlice";
import { clearTokens, logoutFromAuth0 } from "../services/auth";

export function useLogout() {
  const dispatch = useDispatch();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logoutFromAuth0();
            await clearTokens();
            dispatch(logout());
            router.replace("/(auth)/login");
          } catch (e) {
            console.log("Logout error", e);
          }
        },
      },
    ]);
  };

  return handleLogout;
}