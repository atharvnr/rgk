import { useState } from "react";
import { Platform, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Button, IconButton, Text } from "react-native-paper";
import {
  useGetAdminAnalyticsQuery,
  useGetAdminVerificationRequestsQuery,
  useResolveVerificationRequestMutation,
  useVerifyUserMutation,
} from "../../src/services/api";
import {
  AdminCard,
  AdminHeader,
  AdminScreen,
  Pill,
  useAdminLayout,
  useColumnStyle,
} from "../../src/components/admin";
import { StatCard } from "../../src/components/StatCard";
import { EmptyState } from "../../src/components/EmptyState";
import { ErrorState } from "../../src/components/ErrorState";
import { useAppSnackbar } from "../../src/hooks/useAppSnackbar";
import { formatNumber } from "../../src/utils/formatNumber";
import { getErrorMessage, type ApiError } from "../../src/utils/errorMessages";
import { relativeTime } from "../../src/utils/relativeTime";
import { spacing, theme } from "../../src/theme";
import type { PlatformAnalytics, VerificationRequest } from "../../src/types";

const { colors } = theme;
const isWeb = Platform.OS === "web";

const STATS: { key: keyof PlatformAnalytics; title: string; decimals?: number }[] = [
  { key: "total_users", title: "Users" },
  { key: "total_schools", title: "Schools" },
  { key: "total_volunteers", title: "Volunteers" },
  { key: "total_needy", title: "Elders" },
  { key: "total_hours", title: "Hours served", decimals: 1 },
  { key: "total_sessions", title: "Sessions" },
];

type Decision = "verify" | "decline";

export default function OverviewScreen() {
  const column = useColumnStyle();
  const { width, isCompact } = useAdminLayout();
  const { showError, showSuccess } = useAppSnackbar();
  const analytics = useGetAdminAnalyticsQuery();
  const requests = useGetAdminVerificationRequestsQuery();
  const [verifyUser] = useVerifyUserMutation();
  const [resolveRequest] = useResolveVerificationRequestMutation();
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<{ id: string; decision: Decision } | null>(null);

  const columns = width >= 900 ? 6 : width >= 600 ? 3 : 2;
  const pending = (requests.data ?? []).filter((r) => r.status === "pending");

  const refresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([analytics.refetch(), requests.refetch()]);
    } finally {
      setRefreshing(false);
    }
  };

  const decide = async (request: VerificationRequest, decision: Decision) => {
    const who = request.user_name || request.user_email;
    setBusy({ id: request.id, decision });
    try {
      await verifyUser({
        userId: request.user_id,
        verification_status: decision === "verify" ? "verified" : "verification_failed",
      }).unwrap();
      await resolveRequest({
        id: request.id,
        notes: decision === "verify" ? "Verified" : "Declined",
      }).unwrap();
      showSuccess(decision === "verify" ? `Verified ${who}` : `Declined ${who}`);
    } catch (e) {
      showError(
        e as ApiError,
        decision === "verify" ? "Couldn't verify this user" : "Couldn't decline this request"
      );
    } finally {
      setBusy(null);
    }
  };

  const stats = analytics.data;

  return (
    <AdminScreen testID="admin-overview">
      <ScrollView
        contentContainerStyle={[column, styles.content]}
        refreshControl={
          isWeb ? undefined : (
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          )
        }
      >
        <AdminHeader
          title="Platform overview"
          subtitle="Activity across every school on RentGrandKids"
          right={
            isWeb ? (
              <IconButton
                icon="refresh"
                mode="outlined"
                onPress={refresh}
                loading={refreshing}
                disabled={refreshing}
                accessibilityLabel="Refresh"
                testID="overview-refresh"
              />
            ) : undefined
          }
        />

        {analytics.isError ? (
          <AdminCard>
            <ErrorState
              title="Couldn't load platform numbers"
              description={getErrorMessage(analytics.error)}
              onRetry={analytics.refetch}
            />
          </AdminCard>
        ) : (
          <View style={styles.grid}>
            {STATS.map(({ key, title, decimals }) => (
              <View key={key} style={[styles.cell, { width: `${100 / columns}%` }]}>
                <StatCard
                  outlined
                  title={title}
                  value={stats ? formatNumber(stats[key], decimals ?? 0) : "–"}
                  style={styles.stat}
                  testID={`stat-${key}`}
                />
              </View>
            ))}
          </View>
        )}

        <AdminCard flush style={styles.attention}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Needs attention
              </Text>
              {pending.length > 0 ? (
                <Pill
                  label={String(pending.length)}
                  color={colors.onPrimary}
                  background={colors.tertiary}
                />
              ) : null}
            </View>
            {stats ? (
              <Text variant="bodySmall" style={styles.muted}>
                {formatNumber(stats.pending_verifications)} users pending verification ·{" "}
                {formatNumber(stats.pending_associations)} school associations pending
              </Text>
            ) : null}
          </View>

          {requests.isError ? (
            <ErrorState
              title="Couldn't load requests"
              description={getErrorMessage(requests.error)}
              onRetry={requests.refetch}
            />
          ) : requests.isLoading ? (
            <View style={styles.requestRow}>
              <Text variant="bodyMedium" style={styles.muted}>
                Loading requests…
              </Text>
            </View>
          ) : pending.length === 0 ? (
            <View style={styles.empty}>
              <EmptyState
                icon="check-decagram-outline"
                title="Nothing pending"
                description="Verification requests from users will show up here."
              />
            </View>
          ) : (
            pending.map((request) => {
              const rowBusy = busy?.id === request.id;
              return (
                <View
                  key={request.id}
                  style={[styles.requestRow, isCompact && styles.requestRowCompact]}
                  testID={`verification-${request.id}`}
                >
                  <View style={styles.requestText}>
                    <View style={styles.requestTitleLine}>
                      <Text variant="titleSmall" style={styles.requestName} numberOfLines={1}>
                        {request.user_name || request.user_email}
                      </Text>
                      <Text variant="labelSmall" style={styles.muted}>
                        {relativeTime(request.created_at)}
                      </Text>
                    </View>
                    {request.user_name ? (
                      <Text variant="bodySmall" style={styles.muted} numberOfLines={1}>
                        {request.user_email}
                      </Text>
                    ) : null}
                    {request.message ? (
                      <Text variant="bodyMedium" style={styles.message} numberOfLines={2}>
                        {request.message}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.requestActions}>
                    <Button
                      mode="outlined"
                      compact
                      onPress={() => decide(request, "decline")}
                      disabled={rowBusy}
                      loading={rowBusy && busy?.decision === "decline"}
                      textColor={colors.error}
                      style={styles.declineButton}
                    >
                      Decline
                    </Button>
                    <Button
                      mode="contained"
                      compact
                      onPress={() => decide(request, "verify")}
                      disabled={rowBusy}
                      loading={rowBusy && busy?.decision === "verify"}
                    >
                      Verify
                    </Button>
                  </View>
                </View>
              );
            })
          )}
        </AdminCard>
      </ScrollView>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    margin: -6,
  },
  cell: {
    padding: 6,
  },
  stat: {
    marginHorizontal: 0,
  },
  attention: {
    marginTop: spacing.lg,
    overflow: "hidden",
  },
  cardHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  cardTitle: {
    color: colors.onSurface,
    fontWeight: "700",
  },
  muted: {
    color: colors.onSurfaceVariant,
  },
  empty: {
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  requestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  requestRowCompact: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  requestText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  requestTitleLine: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
  },
  requestName: {
    flexShrink: 1,
    color: colors.onSurface,
    fontWeight: "600",
  },
  message: {
    color: colors.onSurface,
    marginTop: 4,
  },
  requestActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  declineButton: {
    borderColor: "#F2C9C5",
  },
});
