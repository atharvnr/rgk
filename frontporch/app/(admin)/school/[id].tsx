import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Text } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  useCreateAdminSchoolMutation,
  useDeleteAdminSchoolMutation,
  useGetAdminSchoolQuery,
  useGetAdminUsersQuery,
  useUpdateAdminSchoolMutation,
} from "../../../src/services/api";
import {
  AdminCard,
  AdminHeader,
  AdminScreen,
  CardTitle,
  ConfirmDialog,
  FormRow,
  SwitchRow,
  TextField,
  UserRow,
  UserRowSkeleton,
  useAdminLayout,
  useColumnStyle,
} from "../../../src/components/admin";
import { ErrorState } from "../../../src/components/ErrorState";
import { useAppSnackbar } from "../../../src/hooks/useAppSnackbar";
import { useBackTo } from "../../../src/hooks/useBackTo";
import { getErrorMessage, type ApiError } from "../../../src/utils/errorMessages";
import { formatNumber } from "../../../src/utils/formatNumber";
import { formatShortDate } from "../../../src/utils/relativeTime";
import { spacing, theme } from "../../../src/theme";
import type { School, SchoolCreate, SchoolUpdate } from "../../../src/types";

const { colors } = theme;

interface SchoolForm {
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  contact_email: string;
  contact_phone: string;
  is_active: boolean;
}

type TextKey = Exclude<keyof SchoolForm, "is_active">;

const EMPTY_FORM: SchoolForm = {
  name: "",
  address: "",
  city: "",
  state: "",
  zip_code: "",
  contact_email: "",
  contact_phone: "",
  is_active: true,
};

const REQUIRED: { key: TextKey; message: string }[] = [
  { key: "name", message: "Name is required" },
  { key: "address", message: "Address is required" },
  { key: "city", message: "City is required" },
  { key: "state", message: "State is required" },
  { key: "zip_code", message: "ZIP is required" },
  { key: "contact_email", message: "Contact email is required" },
];

function formFromSchool(school: School): SchoolForm {
  return {
    name: school.name ?? "",
    address: school.address ?? "",
    city: school.city ?? "",
    state: school.state ?? "",
    zip_code: school.zip_code ?? "",
    contact_email: school.contact_email ?? "",
    contact_phone: school.contact_phone ?? "",
    is_active: school.is_active,
  };
}

function validateSchool(form: SchoolForm): Partial<Record<TextKey, string>> {
  const errors: Partial<Record<TextKey, string>> = {};
  for (const { key, message } of REQUIRED) {
    if (!form[key].trim()) errors[key] = message;
  }
  if (!errors.contact_email && !form.contact_email.includes("@")) {
    errors.contact_email = "Enter a valid email address";
  }
  return errors;
}

function buildUpdate(initial: SchoolForm, form: SchoolForm): SchoolUpdate {
  const body: SchoolUpdate = {};
  const keys: TextKey[] = [
    "name",
    "address",
    "city",
    "state",
    "zip_code",
    "contact_email",
    "contact_phone",
  ];
  for (const key of keys) {
    const next = form[key].trim();
    if (next !== initial[key].trim()) body[key] = next;
  }
  if (form.is_active !== initial.is_active) body.is_active = form.is_active;
  return body;
}

export default function AdminSchoolScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const schoolId = Array.isArray(id) ? id[0] : id ?? "";
  // Tabs keep this screen mounted; "new" and each school get a fresh form.
  return <SchoolEditor key={schoolId} schoolId={schoolId} />;
}

function SchoolEditor({ schoolId }: { schoolId: string }) {
  const router = useRouter();
  const back = useBackTo("/(admin)/schools");
  const column = useColumnStyle();
  const { isCompact } = useAdminLayout();
  const { showError, showSuccess } = useAppSnackbar();
  const isNew = schoolId === "new";

  const { data: school, isLoading, isError, error, refetch } = useGetAdminSchoolQuery(schoolId, {
    skip: isNew || !schoolId,
  });
  const members = useGetAdminUsersQuery(
    { school_id: schoolId, limit: 100 },
    { skip: isNew || !schoolId }
  );
  const [createSchool, { isLoading: creating }] = useCreateAdminSchoolMutation();
  const [updateSchool, { isLoading: updating }] = useUpdateAdminSchoolMutation();
  const [deactivateSchool, { isLoading: deactivating }] = useDeleteAdminSchoolMutation();

  const [initial, setInitial] = useState<SchoolForm | null>(isNew ? EMPTY_FORM : null);
  const [form, setForm] = useState<SchoolForm | null>(isNew ? EMPTY_FORM : null);
  const [submitted, setSubmitted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (school) {
      const next = formFromSchool(school);
      setInitial(next);
      setForm(next);
    }
  }, [school]);

  if (!isNew && (isLoading || (school && !form))) {
    return (
      <AdminScreen>
        <View style={column}>
          <AdminHeader title="School" onBack={back} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      </AdminScreen>
    );
  }

  if (!form || !initial || (!isNew && (isError || !school))) {
    return (
      <AdminScreen>
        <View style={column}>
          <AdminHeader title="School" onBack={back} />
        </View>
        <ErrorState
          title="Couldn't load this school"
          description={getErrorMessage(error, "This school could not be found.")}
          onRetry={schoolId ? refetch : undefined}
          actionLabel="Back to schools"
          onAction={() => router.navigate("/(admin)/schools")}
        />
      </AdminScreen>
    );
  }

  const errors = validateSchool(form);
  const shownErrors = submitted ? errors : {};
  const update = buildUpdate(initial, form);
  const dirty = Object.keys(update).length > 0;
  const saving = creating || updating;

  const set = <K extends keyof SchoolForm>(key: K, value: SchoolForm[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const save = async () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;

    if (isNew) {
      const body: SchoolCreate = {
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zip_code: form.zip_code.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim() || undefined,
      };
      try {
        const created = await createSchool(body).unwrap();
        showSuccess("School created");
        router.replace({ pathname: "/(admin)/school/[id]", params: { id: created.id } });
      } catch (e) {
        showError(e as ApiError, "Couldn't create the school");
      }
      return;
    }

    if (!school || !dirty) return;
    try {
      const saved = await updateSchool({ id: school.id, body: update }).unwrap();
      const next = formFromSchool(saved);
      setInitial(next);
      setForm(next);
      setSubmitted(false);
      showSuccess("Saved");
    } catch (e) {
      showError(e as ApiError, "Couldn't save changes");
    }
  };

  const deactivate = async () => {
    if (!school) return;
    try {
      await deactivateSchool(school.id).unwrap();
      showSuccess("School deactivated");
    } catch (e) {
      showError(e as ApiError, "Couldn't deactivate the school");
    } finally {
      setConfirmOpen(false);
    }
  };

  const place = school ? [school.city, school.state].filter(Boolean).join(", ") : "";
  const added = school ? formatShortDate(school.created_at) : "";
  const memberItems = members.data?.items ?? [];

  const field = (key: TextKey, label: string, extra?: Partial<Parameters<typeof TextField>[0]>) => (
    <TextField
      label={label}
      value={form[key]}
      onChangeText={(text) => set(key, text)}
      error={shownErrors[key]}
      testID={`school-${key}`}
      {...extra}
    />
  );

  return (
    <AdminScreen testID="admin-school">
      <ScrollView contentContainerStyle={[column, styles.content]} keyboardShouldPersistTaps="handled">
        <AdminHeader
          title={isNew ? "New school" : school?.name || "School"}
          subtitle={
            isNew
              ? "Add a school so its staff and students can join."
              : [place, added ? `added ${added}` : ""].filter(Boolean).join(" · ")
          }
          onBack={back}
        />

        <AdminCard>
          <CardTitle>Details</CardTitle>
          <View style={styles.fields}>
            {field("name", "Name", { maxLength: 200 })}
            {field("address", "Address", { maxLength: 300 })}
            <FormRow>
              {field("city", "City", { maxLength: 100 })}
              {field("state", "State", { maxLength: 50 })}
              {field("zip_code", "ZIP", { maxLength: 10, keyboardType: "number-pad" })}
            </FormRow>
            <FormRow>
              {field("contact_email", "Contact email", {
                keyboardType: "email-address",
                autoCapitalize: "none",
                autoComplete: "email",
              })}
              {field("contact_phone", "Contact phone", {
                keyboardType: "phone-pad",
                maxLength: 20,
                helper: "Optional",
              })}
            </FormRow>
            {isNew ? null : (
              <SwitchRow
                label="Active"
                description="Inactive schools are hidden from school lists."
                value={form.is_active}
                onValueChange={(value) => set("is_active", value)}
                testID="school-active"
              />
            )}
          </View>
          <View style={styles.actions}>
            {!isNew && dirty ? (
              <Button
                mode="text"
                onPress={() => {
                  setForm(initial);
                  setSubmitted(false);
                }}
                disabled={saving}
              >
                Discard
              </Button>
            ) : null}
            <Button
              mode="contained"
              onPress={save}
              loading={saving}
              disabled={saving || (!isNew && !dirty)}
              testID="school-save"
            >
              {isNew ? "Create school" : "Save changes"}
            </Button>
          </View>
        </AdminCard>

        {isNew || !school ? null : (
          <>
            <AdminCard flush style={styles.membersCard}>
              <View style={styles.membersHeader}>
                <CardTitle
                  subtitle={
                    members.data
                      ? `${formatNumber(members.data.total)} ${
                          members.data.total === 1 ? "person" : "people"
                        } linked to this school`
                      : undefined
                  }
                >
                  Members
                </CardTitle>
              </View>
              {members.isError ? (
                <View style={styles.membersNote}>
                  <Text variant="bodyMedium" style={styles.muted}>
                    {getErrorMessage(members.error, "Couldn't load members.")}
                  </Text>
                </View>
              ) : members.isLoading ? (
                [0, 1].map((i) => <UserRowSkeleton key={i} style={styles.memberRow} />)
              ) : memberItems.length === 0 ? (
                <View style={styles.membersNote}>
                  <Text variant="bodyMedium" style={styles.muted}>
                    No one is linked to this school yet.
                  </Text>
                </View>
              ) : (
                memberItems.map((member) => (
                  <UserRow
                    key={member.id}
                    user={member}
                    style={styles.memberRow}
                    onPress={() =>
                      router.push({ pathname: "/(admin)/user/[id]", params: { id: member.id } })
                    }
                    testID={`member-${member.id}`}
                  />
                ))
              )}
            </AdminCard>

            {school.is_active ? (
              <AdminCard danger>
                <CardTitle>Danger zone</CardTitle>
                <View style={[styles.dangerRow, isCompact && styles.dangerRowCompact]}>
                  <View style={styles.dangerText}>
                    <Text variant="bodyLarge" style={styles.dangerTitle}>
                      Deactivate school
                    </Text>
                    <Text variant="bodySmall" style={styles.muted}>
                      Hide this school from lists. Its members and history are kept, and you
                      can turn it back on with the Active switch.
                    </Text>
                  </View>
                  <Button
                    mode="outlined"
                    textColor={colors.error}
                    style={styles.dangerButton}
                    onPress={() => setConfirmOpen(true)}
                    testID="school-deactivate"
                  >
                    Deactivate school
                  </Button>
                </View>
              </AdminCard>
            ) : null}
          </>
        )}
      </ScrollView>

      {school ? (
        <ConfirmDialog
          visible={confirmOpen}
          title="Deactivate this school?"
          message={`${school.name} will be hidden from school lists. You can reactivate it later.`}
          confirmLabel="Deactivate"
          destructive
          loading={deactivating}
          onConfirm={deactivate}
          onDismiss={() => setConfirmOpen(false)}
          testID="confirm-deactivate-school"
        />
      ) : null}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fields: {
    gap: spacing.md,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  membersCard: {
    overflow: "hidden",
  },
  membersHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  membersNote: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  memberRow: {
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    paddingHorizontal: spacing.lg,
  },
  dangerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  dangerRowCompact: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  dangerText: {
    flex: 1,
    gap: 2,
  },
  dangerTitle: {
    color: colors.onSurface,
    fontWeight: "600",
  },
  dangerButton: {
    borderColor: "#F2C9C5",
  },
  muted: {
    color: colors.onSurfaceVariant,
  },
});
