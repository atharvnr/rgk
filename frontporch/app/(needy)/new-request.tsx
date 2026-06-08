import { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import {
  TextInput,
  Button,
  SegmentedButtons,
  Text,
  ActivityIndicator,
} from "react-native-paper";
import { useRouter } from "expo-router";
import {
  useCreateRequestMutation,
  useGetMeQuery,
  useGetMyProxyLinksQuery,
  useCreateVerificationRequestMutation,
} from "../../src/services/api";
import { useAppSnackbar } from "../../src/hooks/useAppSnackbar";
import { ErrorState } from "../../src/components/ErrorState";
import type { RequestCategory } from "../../src/types";

const CATEGORIES: { value: RequestCategory; label: string }[] = [
  { value: "companionship", label: "Companionship" },
  { value: "errands", label: "Errands" },
  { value: "tech_help", label: "Tech Help" },
  { value: "yard_work", label: "Yard Work" },
  { value: "transportation", label: "Transportation" },
  { value: "other", label: "Other" },
];

export default function NewRequest() {
  const router = useRouter();
  const { showError, showSuccess, showInfo } = useAppSnackbar();
  const { data: user, isLoading: userLoading } = useGetMeQuery();
  const isProxy = user?.role === "needy_proxy";
  const {
    data: proxyLinks,
    isLoading: linksLoading,
  } = useGetMyProxyLinksQuery(undefined, { skip: !isProxy });
  const [createRequest, { isLoading }] = useCreateRequestMutation();

  const isVerified = user?.verification_status === "verified";
  const hasActiveLink = proxyLinks?.some((l) => l.status === "active") ?? false;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<RequestCategory>("companionship");
  const [location, setLocation] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTimeSlot, setPreferredTimeSlot] = useState("");

  const handleSubmit = async () => {
    if (!title.trim()) {
      showInfo("Please enter a title");
      return;
    }
    if (!description.trim()) {
      showInfo("Please enter a description");
      return;
    }

    try {
      await createRequest({
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim() || undefined,
        preferred_date: preferredDate.trim() || undefined,
        preferred_time_slot: preferredTimeSlot.trim() || undefined,
      }).unwrap();

      showSuccess("Request created successfully");
      router.push("/(needy)/my-requests");
    } catch (err: any) {
      showError(err, "Failed to create request");
    }
  };

  if (userLoading || linksLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isVerified) {
    const [createVerificationRequest] = useCreateVerificationRequestMutation();

    const handleNotifyAdmin = async () => {
      try {
        await createVerificationRequest({ message: "User requests help with verification" }).unwrap();
        showInfo("Verification request sent to admins. They will follow up by email or phone.");
      } catch (e) {
        showError(e as any, "Failed to notify admins. Please email your documents to the platform admin.");
      }
    };

    return (
      <ErrorState
        icon="shield-check-outline"
        title="Verification Required"
        description={
          user?.verification_status === "pending_verification"
            ? "Your identity verification is being reviewed. You'll be able to create requests once approved."
            : "You need to complete identity verification before creating requests. You can notify platform admins to request a verification review."
        }
        actionLabel={user?.verification_status === "pending_verification" ? undefined : "Notify Admin"}
        onAction={user?.verification_status === "pending_verification" ? undefined : handleNotifyAdmin}
      />
    );
  }

  if (isProxy && !hasActiveLink) {
    return (
      <ErrorState
        icon="account-arrow-right-outline"
        title="No Elder Linked"
        description="You need an approved proxy link to an elder before creating requests on their behalf. Please set up a proxy link first."
      />
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text variant="titleLarge" style={styles.formTitle}>
          Create New Request
        </Text>

        <TextInput
          label="Title"
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          style={styles.input}
          placeholder="Brief title for your request"
        />

        <TextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          multiline
          numberOfLines={4}
          style={styles.input}
          placeholder="Describe what help you need"
        />

        <Text variant="labelLarge" style={styles.label}>
          Category
        </Text>
        <SegmentedButtons
          value={category}
          onValueChange={(value) => setCategory(value as RequestCategory)}
          buttons={CATEGORIES.map((cat) => ({
            value: cat.value,
            label: cat.label,
          }))}
          style={styles.segmentedButtons}
        />

        <TextInput
          label="Location (optional)"
          value={location}
          onChangeText={setLocation}
          mode="outlined"
          style={styles.input}
          placeholder="Where is this needed?"
        />

        <TextInput
          label="Preferred Date (optional)"
          value={preferredDate}
          onChangeText={setPreferredDate}
          mode="outlined"
          style={styles.input}
          placeholder="e.g., 2026-03-15"
        />

        <TextInput
          label="Preferred Time (optional)"
          value={preferredTimeSlot}
          onChangeText={setPreferredTimeSlot}
          mode="outlined"
          style={styles.input}
          placeholder="e.g., Morning, Afternoon, Evening"
        />

        <Button
          mode="contained"
          onPress={handleSubmit}
          disabled={isLoading}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
        >
          {isLoading ? <ActivityIndicator color="white" /> : "Submit Request"}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  form: {
    padding: 16,
  },
  formTitle: {
    marginBottom: 16,
    fontWeight: "bold",
  },
  input: {
    marginBottom: 16,
    backgroundColor: "white",
  },
  label: {
    marginBottom: 8,
    color: "#424242",
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
});
