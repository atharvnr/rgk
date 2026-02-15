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
    case "student":
      return <Redirect href="/(student)/home" />;
    case "school_admin":
      return <Redirect href="/(school)/dashboard" />;
    case "elder":
      return <Redirect href="/(elder)/home" />;
    default:
      return <Redirect href="/(auth)/login" />;
  }
}
