import { useState } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import {
  TextInput,
  Button,
  SegmentedButtons,
  Text,
  ActivityIndicator,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { useCreateRequestMutation } from "../../src/services/api";
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
  const [createRequest, { isLoading }] = useCreateRequestMutation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<RequestCategory>("companionship");
  const [location, setLocation] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTimeSlot, setPreferredTimeSlot] = useState("");

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Error", "Please enter a description");
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

      Alert.alert("Success", "Request created successfully", [
        {
          text: "OK",
          onPress: () => router.push("/(elder)/my-requests"),
        },
      ]);

      // Reset form
      setTitle("");
      setDescription("");
      setCategory("companionship");
      setLocation("");
      setPreferredDate("");
      setPreferredTimeSlot("");
    } catch (error: any) {
      Alert.alert("Error", error.data?.detail || "Failed to create request");
    }
  };

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
