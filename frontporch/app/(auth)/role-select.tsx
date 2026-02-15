import { View, StyleSheet } from "react-native";
import { Card, Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../src/store";
import { setOnboardingRole } from "../../src/store/authSlice";
import type { UserRole } from "../../src/types";

interface RoleCardProps {
  title: string;
  description: string;
  icon: string;
  role: UserRole;
  onSelect: (role: UserRole) => void;
}

function RoleCard({ title, description, icon, role, onSelect }: RoleCardProps) {
  return (
    <Card style={styles.card} onPress={() => onSelect(role)}>
      <Card.Content style={styles.cardContent}>
        <Text variant="displayMedium" style={styles.icon}>
          {icon}
        </Text>
        <Text variant="titleLarge" style={styles.cardTitle}>
          {title}
        </Text>
        <Text variant="bodyMedium" style={styles.cardDescription}>
          {description}
        </Text>
      </Card.Content>
    </Card>
  );
}

export default function RoleSelectScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const handleRoleSelect = (role: UserRole) => {
    dispatch(setOnboardingRole(role));
    router.push("/(auth)/onboarding");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          How will you use RentGrandKids?
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Select your role to continue
        </Text>
      </View>

      <View style={styles.cardsContainer}>
        <RoleCard
          title="Student"
          description="Earn community service hours by helping elders in your community"
          icon="🎓"
          role="student"
          onSelect={handleRoleSelect}
        />
        <RoleCard
          title="School Admin"
          description="Manage students and track community service hours for your school"
          icon="🏫"
          role="school_admin"
          onSelect={handleRoleSelect}
        />
        <RoleCard
          title="Elder"
          description="Request help with daily tasks from student volunteers"
          icon="👵"
          role="elder"
          onSelect={handleRoleSelect}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
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
  cardsContainer: {
    gap: 16,
  },
  card: {
    elevation: 2,
    borderRadius: 12,
  },
  cardContent: {
    alignItems: "center",
    paddingVertical: 24,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  cardDescription: {
    textAlign: "center",
    color: "#666",
  },
});
