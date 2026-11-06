import { useCallback, useEffect, useState, type ReactElement } from "react";
import { FlatList, Platform, StyleSheet, View } from "react-native";
import { Button, ProgressBar } from "react-native-paper";
import { useRouter } from "expo-router";
import { useGetAdminUsersQuery } from "../../src/services/api";
import {
  AdminHeader,
  AdminScreen,
  FilterChips,
  SearchBar,
  ToggleChip,
  UserRow,
  UserRowSkeleton,
  groupedRowStyle,
  useColumnStyle,
  type FilterOption,
} from "../../src/components/admin";
import { EmptyState } from "../../src/components/EmptyState";
import { ErrorState } from "../../src/components/ErrorState";
import { formatNumber } from "../../src/utils/formatNumber";
import { getErrorMessage } from "../../src/utils/errorMessages";
import { spacing, theme } from "../../src/theme";
import type { AdminUsersQuery, User, UserRole } from "../../src/types";

const { colors } = theme;
const PAGE_SIZE = 25;
const isWeb = Platform.OS === "web";

type RoleFilter = "all" | UserRole;

const ROLE_FILTERS: FilterOption<RoleFilter>[] = [
  { value: "all", label: "All" },
  { value: "volunteer", label: "Volunteer" },
  { value: "needy", label: "Elder" },
  { value: "needy_proxy", label: "Caregiver" },
  { value: "school_admin", label: "School admin" },
  { value: "school_user", label: "School staff" },
  { value: "root", label: "Root" },
];

/**
 * Keeps page `skip` of the current filters subscribed (so it refetches after a
 * mutation) and reports its rows to the screen.
 */
function UsersPage({
  args,
  onLoad,
}: {
  args: AdminUsersQuery;
  onLoad: (skip: number, items: User[]) => void;
}) {
  const { data } = useGetAdminUsersQuery(args);
  useEffect(() => {
    if (data) onLoad(args.skip ?? 0, data.items);
  }, [data, args.skip, onLoad]);
  return null;
}

export default function UsersScreen() {
  const router = useRouter();
  const column = useColumnStyle();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [showInactive, setShowInactive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const filters: AdminUsersQuery = {
    q: q || undefined,
    role: role === "all" ? undefined : role,
    // Default view is active users; "Show inactive" drops the filter.
    is_active: showInactive ? undefined : true,
  };
  const filterKey = JSON.stringify(filters);

  // Pages beyond the first, keyed by the filters they were loaded for so a new
  // search starts again from page one without an extra render.
  const [paging, setPaging] = useState<{ key: string; pages: number }>({
    key: filterKey,
    pages: 1,
  });
  const [extra, setExtra] = useState<{ key: string; bySkip: Record<number, User[]> }>({
    key: filterKey,
    bySkip: {},
  });
  const pages = paging.key === filterKey ? paging.pages : 1;
  const extraBySkip = extra.key === filterKey ? extra.bySkip : {};

  const first = useGetAdminUsersQuery({ ...filters, skip: 0, limit: PAGE_SIZE });

  const onPageLoad = useCallback(
    (skip: number, items: User[]) => {
      setExtra((prev) => ({
        key: filterKey,
        bySkip: { ...(prev.key === filterKey ? prev.bySkip : {}), [skip]: items },
      }));
    },
    [filterKey]
  );

  const seen = new Set<string>();
  const items: User[] = [];
  const loaded = [first.data?.items ?? []];
  for (let page = 1; page < pages; page += 1) {
    loaded.push(extraBySkip[page * PAGE_SIZE] ?? []);
  }
  for (const user of loaded.flat()) {
    if (!seen.has(user.id)) {
      seen.add(user.id);
      items.push(user);
    }
  }

  const total = first.data?.total ?? 0;
  const loadingMore = pages > 1 && extraBySkip[(pages - 1) * PAGE_SIZE] === undefined;
  const hasMore = Boolean(first.data) && items.length < total;

  const refresh = async () => {
    setRefreshing(true);
    try {
      await first.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const header = (
    <View style={styles.header}>
      <AdminHeader
        title="Users"
        subtitle={
          first.data
            ? `${formatNumber(total)} ${total === 1 ? "user" : "users"}`
            : undefined
        }
      />
      <SearchBar placeholder="Search by name or email" onSearch={setQ} testID="users-search" />
      <FilterChips options={ROLE_FILTERS} value={role} onChange={setRole} testID="role-filter">
        <View style={styles.divider} />
        <ToggleChip
          label="Show inactive"
          selected={showInactive}
          onToggle={setShowInactive}
          testID="show-inactive"
        />
      </FilterChips>
      <ProgressBar
        indeterminate
        visible={first.isFetching && !first.isLoading && !refreshing}
        color={colors.primary}
        style={styles.progress}
      />
    </View>
  );

  let empty: ReactElement | null = null;
  if (first.isError) {
    empty = (
      <ErrorState description={getErrorMessage(first.error)} onRetry={first.refetch} />
    );
  } else if (first.isLoading) {
    empty = (
      <View>
        {[0, 1, 2].map((i) => (
          <UserRowSkeleton key={i} style={groupedRowStyle(i, 3)} />
        ))}
      </View>
    );
  } else {
    empty = (
      <EmptyState
        icon="account-search-outline"
        title="No users match"
        description="Try a different search or filter."
      />
    );
  }

  return (
    <AdminScreen testID="admin-users">
      {Array.from({ length: pages - 1 }, (_, index) => {
        const skip = (index + 1) * PAGE_SIZE;
        return (
          <UsersPage
            key={`${filterKey}:${skip}`}
            args={{ ...filters, skip, limit: PAGE_SIZE }}
            onLoad={onPageLoad}
          />
        );
      })}
      <FlatList
        data={first.isError ? [] : items}
        keyExtractor={(user) => user.id}
        renderItem={({ item, index }) => (
          <UserRow
            user={item}
            style={groupedRowStyle(index, items.length)}
            onPress={() =>
              router.push({ pathname: "/(admin)/user/[id]", params: { id: item.id } })
            }
            testID={`user-row-${item.id}`}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={
          hasMore ? (
            <View style={styles.footer}>
              <Button
                mode="outlined"
                onPress={() => setPaging({ key: filterKey, pages: pages + 1 })}
                loading={loadingMore}
                disabled={loadingMore}
                testID="users-load-more"
              >
                Load more
              </Button>
            </View>
          ) : (
            <View style={styles.footerSpacer} />
          )
        }
        contentContainerStyle={column}
        keyboardShouldPersistTaps="handled"
        refreshing={isWeb ? undefined : refreshing}
        onRefresh={isWeb ? undefined : refresh}
      />
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  divider: {
    width: 1,
    height: 20,
    marginHorizontal: 4,
    backgroundColor: colors.outline,
  },
  progress: {
    height: 2,
    backgroundColor: "transparent",
  },
  footer: {
    alignItems: "center",
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  footerSpacer: {
    height: spacing.xxl,
  },
});
