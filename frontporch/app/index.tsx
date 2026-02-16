import { Redirect } from "expo-router";
import { useSelector } from "react-redux";
import type { RootState } from "../src/store";
import { LoadingScreen } from "../src/components/LoadingScreen";

export default function Index() {
  const { isAuthenticated, isLoading, user } = useSelector(
    (state: RootState) => state.auth
  );

  if (isLoading) return <LoadingScreen />;

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  if (!user) return <Redirect href="/(auth)/role-select" />;

  switch (user.role) {
    case "volunteer":
      return <Redirect href="/(volunteer)/home" />;
    case "school_admin":
    case "school_user":
      return <Redirect href="/(school)/dashboard" />;
    case "needy":
    case "needy_proxy":
      return <Redirect href="/(needy)/home" />;
    default:
      return <Redirect href="/(auth)/login" />;
  }
}
