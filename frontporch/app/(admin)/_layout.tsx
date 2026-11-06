import { Redirect, Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import type { RootState } from "../../src/store";
import { LoadingScreen } from "../../src/components/LoadingScreen";
import { theme } from "../../src/theme";

const { colors } = theme;

export default function AdminLayout() {
  const { isLoading, user } = useSelector((state: RootState) => state.auth);

  // Wait for the stored session before mounting screens that call root-only
  // endpoints; the root layout sends signed-out visitors to login.
  if (isLoading || !user) return <LoadingScreen />;
  if (user.role !== "root") return <Redirect href="/" />;

  return (
    <Tabs
      // Detail screens are hidden tabs; "history" makes back return to the
      // list (or school) they were opened from rather than the first tab.
      backBehavior="history"
      screenOptions={{
        // Screens draw their own AdminHeader.
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.outlineVariant,
        },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="overview"
        options={{
          title: "Overview",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: "Users",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-multiple-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schools"
        options={{
          title: "Schools",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="school-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="user/[id]" options={{ href: null, title: "User" }} />
      <Tabs.Screen name="school/[id]" options={{ href: null, title: "School" }} />
    </Tabs>
  );
}
