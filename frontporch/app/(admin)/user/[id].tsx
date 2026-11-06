import { useEffect, useState, type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Divider, Text } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  useDeleteAdminUserMutation,
  useGetAdminSchoolsQuery,
  useGetAdminUserQuery,
  useGetMeQuery,
  useUpdateAdminUserMutation,
} from "../../../src/services/api";
import {
  AdminCard,
  AdminHeader,
  AdminScreen,
  CardTitle,
  ConfirmDialog,
  FormRow,
  ROLE_LABELS,
  SelectField,
  SwitchRow,
  TextField,
  useAdminLayout,
  useColumnStyle,
  type SelectOption,
} from "../../../src/components/admin";
import { ErrorState } from "../../../src/components/ErrorState";
import { useAppSnackbar } from "../../../src/hooks/useAppSnackbar";
import { useBackTo } from "../../../src/hooks/useBackTo";
import { getErrorMessage, type ApiError } from "../../../src/utils/errorMessages";
import { formatShortDate } from "../../../src/utils/relativeTime";
import { spacing, theme } from "../../../src/theme";
import type {
  AdminUserUpdate,
  User,
  UserRole,
  VerificationStatus,
} from "../../../src/types";

const { colors } = theme;

/** Roles that belong to a school and carry a school-issued ID. */
const SCHOOL_ROLES: UserRole[] = ["volunteer", "school_admin", "school_user"];

const ROLE_OPTIONS: SelectOption<UserRole>[] = (
  ["volunteer", "needy", "needy_proxy", "school_admin", "school_user", "root"] as UserRole[]
).map((value) => ({ value, label: ROLE_LABELS[value] }));

const VERIFICATION_OPTIONS: SelectOption<VerificationStatus>[] = [
  { value: "unverified", label: "Unverified" },
  { value: "pending_verification", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "verification_failed", label: "Failed" },
  { value: "not_required", label: "Not required" },
];

interface FormState {
  name: string;
  phone: string;
  address: string;
  role: UserRole;
  school_id: string | null;
  school_issued_id: string;
  verification_status: VerificationStatus;
  is_active: boolean;
}

function formFromUser(user: User): FormState {
  return {
    name: user.name ?? "",
    phone: user.phone ?? "",
    address: user.address ?? "",
    role: user.role,
    school_id: user.school_id ?? null,
    school_issued_id: user.school_issued_id ?? "",
    verification_status: user.verification_status,
    is_active: user.is_active,
  };
}

/** Only the fields that changed; school fields only while the role has a school. */
function buildUpdate(initial: FormState, form: FormState): AdminUserUpdate {
  const body: AdminUserUpdate = {};
  if (form.name.trim() !== initial.name.trim()) body.name = form.name.trim();
  if (form.phone.trim() !== initial.phone.trim()) body.phone = form.phone.trim();
  if (form.address.trim() !== initial.address.trim()) body.address = form.address.trim();
  if (form.role !== initial.role) body.role = form.role;
  if (SCHOOL_ROLES.includes(form.role)) {
    if (form.school_id !== initial.school_id) body.school_id = form.school_id;
    if (form.school_issued_id.trim() !== initial.school_issued_id.trim()) {
      body.school_issued_id = form.school_issued_id.trim();
    }
  }
  if (form.verification_status !== initial.verification_status) {
    body.verification_status = form.verification_status;
  }
  if (form.is_active !== initial.is_active) body.is_active = form.is_active;
  return body;
}

export default function AdminUserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Array.isArray(id) ? id[0] : id ?? "";
  // Tabs keep this screen mounted; a new id gets a fresh form.
  return <UserEditor key={userId} userId={userId} />;
}

function UserEditor({ userId }: { userId: string }) {
  const router = useRouter();
  const back = useBackTo("/(admin)/users");
  const column = useColumnStyle();
  const { isCompact } = useAdminLayout();
  const { showError, showSuccess } = useAppSnackbar();

  const { data: me } = useGetMeQuery();
  const { data: user, isLoading, isError, error, refetch } = useGetAdminUserQuery(userId, {
    skip: !userId,
  });
  const { data: schools } = useGetAdminSchoolsQuery({ include_inactive: true, limit: 100 });
  const [updateUser, { isLoading: saving }] = useUpdateAdminUserMutation();
  // Separate instance so the danger-zone action doesn't spin the Save button.
  const [setActive, { isLoading: togglingActive }] = useUpdateAdminUserMutation();
  const [deleteUser, { isLoading: deleting }] = useDeleteAdminUserMutation();

  const [initial, setInitial] = useState<FormState | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [confirm, setConfirm] = useState<"active" | "delete" | null>(null);

  useEffect(() => {
    if (user) {
      const next = formFromUser(user);
      setInitial(next);
      setForm(next);
    }
  }, [user]);

  if (isLoading || (user && !form)) {
    return (
      <AdminScreen>
        <View style={column}>
          <AdminHeader title="User" onBack={back} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      </AdminScreen>
    );
  }

  if (isError || !user || !form || !initial) {
    return (
      <AdminScreen>
        <View style={column}>
          <AdminHeader title="User" onBack={back} />
        </View>
        <ErrorState
          title="Couldn't load this user"
          description={getErrorMessage(error, "This user could not be found.")}
          onRetry={userId ? refetch : undefined}
          actionLabel="Back to users"
          onAction={() => router.navigate("/(admin)/users")}
        />
      </AdminScreen>
    );
  }

  const isSelf = Boolean(me && me.id === user.id);
  const hasSchool = SCHOOL_ROLES.includes(form.role);
  const update = buildUpdate(initial, form);
  const dirty = Object.keys(update).length > 0;
  const nameError = form.name.trim() ? undefined : "Name is required";

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const schoolOptions: SelectOption<string | null>[] = [
    { value: null, label: "None" },
    ...(schools?.items ?? []).map((school) => ({
      value: school.id,
      label: school.is_active ? school.name : `${school.name} (inactive)`,
    })),
  ];
  if (form.school_id && !schoolOptions.some((o) => o.value === form.school_id)) {
    schoolOptions.push({ value: form.school_id, label: "Current school" });
  }

  const applySaved = (saved: User) => {
    const next = formFromUser(saved);
    setInitial(next);
    setForm(next);
  };

  const save = async () => {
    if (!dirty || nameError) return;
    try {
      // The mutation invalidates this user's tag, so the query refetches too.
      applySaved(await updateUser({ id: user.id, body: update }).unwrap());
      showSuccess("Saved");
    } catch (e) {
      showError(e as ApiError, "Couldn't save changes");
    }
  };

  const toggleActive = async () => {
    const next = !user.is_active;
    try {
      applySaved(await setActive({ id: user.id, body: { is_active: next } }).unwrap());
      showSuccess(next ? "User reactivated" : "User deactivated");
    } catch (e) {
      showError(e as ApiError, next ? "Couldn't reactivate this user" : "Couldn't deactivate this user");
    } finally {
      setConfirm(null);
    }
  };

  const remove = async () => {
    try {
      await deleteUser(user.id).unwrap();
      setConfirm(null);
      showSuccess("User deleted");
      router.navigate("/(admin)/users");
    } catch (e) {
      setConfirm(null);
      showError(e as ApiError, "Couldn't delete this user");
    }
  };

  const joined = formatShortDate(user.created_at);

  return (
    <AdminScreen testID="admin-user">
      <ScrollView contentContainerStyle={[column, styles.content]} keyboardShouldPersistTaps="handled">
        <AdminHeader
          title={user.name || user.email}
          subtitle={joined ? `${user.email} · joined ${joined}` : user.email}
          onBack={back}
        />

        <AdminCard>
          <CardTitle>Profile</CardTitle>
          <View style={styles.fields}>
            <FormRow>
              <TextField
                label="Name"
                value={form.name}
                onChangeText={(text) => set("name", text)}
                error={nameError}
                autoComplete="off"
                maxLength={100}
                testID="user-name"
              />
              <TextField
                label="Phone"
                value={form.phone}
                onChangeText={(text) => set("phone", text)}
                keyboardType="phone-pad"
                maxLength={20}
                testID="user-phone"
              />
            </FormRow>
            <TextField
              label="Address"
              value={form.address}
              onChangeText={(text) => set("address", text)}
              multiline
              maxLength={300}
              testID="user-address"
            />
          </View>

          <Divider style={styles.divider} />

          <CardTitle>Access</CardTitle>
          <View style={styles.fields}>
            <FormRow>
              <SelectField
                label="Role"
                value={form.role}
                options={ROLE_OPTIONS}
                onChange={(role) => set("role", role)}
                disabled={isSelf}
                helperText={isSelf ? "You can't change your own role." : undefined}
                testID="user-role"
              />
              <SelectField
                label="Verification"
                value={form.verification_status}
                options={VERIFICATION_OPTIONS}
                onChange={(status) => set("verification_status", status)}
                testID="user-verification"
              />
            </FormRow>
            {hasSchool ? (
              <FormRow>
                <SelectField
                  label="School"
                  value={form.school_id}
                  options={schoolOptions}
                  onChange={(schoolId) => set("school_id", schoolId)}
                  testID="user-school"
                />
                <TextField
                  label="School-issued ID"
                  value={form.school_issued_id}
                  onChangeText={(text) => set("school_issued_id", text)}
                  autoCapitalize="none"
                  maxLength={100}
                  testID="user-school-id"
                />
              </FormRow>
            ) : null}
            <SwitchRow
              label="Active"
              description={
                isSelf
                  ? "You can't deactivate your own account."
                  : "Turn off to suspend this account."
              }
              value={form.is_active}
              onValueChange={(value) => set("is_active", value)}
              disabled={isSelf}
              testID="user-active"
            />
          </View>

          <View style={styles.actions}>
            {dirty ? (
              <Button mode="text" onPress={() => setForm(initial)} disabled={saving}>
                Discard
              </Button>
            ) : null}
            <Button
              mode="contained"
              onPress={save}
              loading={saving}
              disabled={!dirty || Boolean(nameError) || saving}
              testID="user-save"
            >
              Save changes
            </Button>
          </View>
        </AdminCard>

        {isSelf ? null : (
          <AdminCard danger>
            <CardTitle>Danger zone</CardTitle>
            <DangerRow
              title={user.is_active ? "Deactivate account" : "Reactivate account"}
              body={
                user.is_active
                  ? "Suspend this account without deleting any of its data."
                  : "Let this person use RentGrandKids again."
              }
              compact={isCompact}
            >
              <Button
                mode="outlined"
                onPress={() => setConfirm("active")}
                textColor={user.is_active ? colors.error : colors.primary}
                style={user.is_active ? styles.dangerButton : undefined}
                testID="user-toggle-active"
              >
                {user.is_active ? "Deactivate" : "Reactivate"}
              </Button>
            </DangerRow>
            <Divider style={styles.dangerDivider} />
            <DangerRow
              title="Delete user"
              body="Permanently remove this account. This can't be undone."
              compact={isCompact}
            >
              <Button
                mode="outlined"
                onPress={() => setConfirm("delete")}
                textColor={colors.error}
                style={styles.dangerButton}
                testID="user-delete"
              >
                Delete user
              </Button>
            </DangerRow>
          </AdminCard>
        )}
      </ScrollView>

      <ConfirmDialog
        visible={confirm === "active"}
        title={user.is_active ? "Deactivate this user?" : "Reactivate this user?"}
        message={
          user.is_active
            ? `${user.email} won't be able to use RentGrandKids until you reactivate the account.`
            : `${user.email} will be able to use RentGrandKids again.`
        }
        confirmLabel={user.is_active ? "Deactivate" : "Reactivate"}
        destructive={user.is_active}
        loading={togglingActive}
        onConfirm={toggleActive}
        onDismiss={() => setConfirm(null)}
        testID="confirm-active"
      />
      <ConfirmDialog
        visible={confirm === "delete"}
        title="Delete this user?"
        message={`${user.email} and their profile will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete user"
        destructive
        loading={deleting}
        onConfirm={remove}
        onDismiss={() => setConfirm(null)}
        testID="confirm-delete"
      />
    </AdminScreen>
  );
}

function DangerRow({
  title,
  body,
  compact,
  children,
}: {
  title: string;
  body: string;
  compact: boolean;
  children: ReactNode;
}) {
  return (
    <View style={[styles.dangerRow, compact && styles.dangerRowCompact]}>
      <View style={styles.dangerText}>
        <Text variant="bodyLarge" style={styles.dangerTitle}>
          {title}
        </Text>
        <Text variant="bodySmall" style={styles.muted}>
          {body}
        </Text>
      </View>
      {children}
    </View>
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
  divider: {
    marginVertical: spacing.lg,
    backgroundColor: colors.outlineVariant,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.lg,
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
  dangerDivider: {
    marginVertical: spacing.md,
    backgroundColor: colors.outlineVariant,
  },
  dangerButton: {
    borderColor: "#F2C9C5",
  },
  muted: {
    color: colors.onSurfaceVariant,
  },
});
