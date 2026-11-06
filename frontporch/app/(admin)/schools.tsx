import { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Button, ProgressBar, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useGetAdminSchoolsQuery } from "../../src/services/api";
import {
  AdminHeader,
  AdminScreen,
  Pill,
  SearchBar,
  ToggleChip,
  UserRowSkeleton,
  groupedRowStyle,
  useAdminLayout,
  useColumnStyle,
} from "../../src/components/admin";
import { IconCircle } from "../../src/components/landing/IconCircle";
import { EmptyState } from "../../src/components/EmptyState";
import { ErrorState } from "../../src/components/ErrorState";
import { useHover } from "../../src/hooks/useHover";
import { formatNumber } from "../../src/utils/formatNumber";
import { getErrorMessage } from "../../src/utils/errorMessages";
import { spacing, theme } from "../../src/theme";
import type { School } from "../../src/types";

const { colors } = theme;
const LIMIT = 100;
const isWeb = Platform.OS === "web";

function adminCount(school: School): string {
  const count = school.admin_ids?.length ?? 0;
  if (count === 0) return "No admins";
  return `${count} ${count === 1 ? "admin" : "admins"}`;
}

function SchoolRow({
  school,
  onPress,
  style,
}: {
  school: School;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { hovered, hoverProps } = useHover();
  const { isCompact } = useAdminLayout();
  const inactive = !school.is_active;
  const place = [school.city, school.state].filter(Boolean).join(", ");

  const chips = (
    <View style={styles.chips}>
      <Pill
        label={adminCount(school)}
        color={colors.onSurfaceVariant}
        background={colors.surfaceVariant}
        style={inactive ? styles.dimmed : undefined}
      />
      {inactive ? (
        <Pill
          label="Inactive"
          color={colors.onSurfaceVariant}
          background={colors.surfaceVariant}
          borderColor={colors.outline}
        />
      ) : null}
    </View>
  );

  return (
    <Pressable
      {...hoverProps}
      onPress={onPress}
      role="button"
      aria-label={`${school.name}${place ? `, ${place}` : ""}${inactive ? ", inactive" : ""}`}
      testID={`school-row-${school.id}`}
      style={({ pressed }) => [
        styles.row,
        style,
        hovered && styles.hovered,
        pressed && styles.pressed,
        isWeb ? styles.webPointer : null,
      ]}
    >
      <View style={inactive ? styles.dimmed : undefined}>
        <IconCircle name="school-outline" size={40} />
      </View>
      <View style={styles.body}>
        <View style={inactive ? styles.dimmed : undefined}>
          <Text variant="titleSmall" numberOfLines={1} style={styles.name}>
            {school.name}
          </Text>
          {place ? (
            <Text variant="bodySmall" numberOfLines={1} style={styles.muted}>
              {place}
            </Text>
          ) : null}
        </View>
        {isCompact ? chips : null}
      </View>
      {isCompact ? null : chips}
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.onSurfaceVariant} />
    </Pressable>
  );
}

export default function SchoolsScreen() {
  const router = useRouter();
  const column = useColumnStyle();
  const [q, setQ] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetAdminSchoolsQuery({
    q: q || undefined,
    include_inactive: showInactive,
    limit: LIMIT,
  });
  const schools = data?.items ?? [];
  const total = data?.total ?? 0;

  const refresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const openSchool = (id: string) =>
    router.push({ pathname: "/(admin)/school/[id]", params: { id } });

  const header = (
    <View style={styles.header}>
      <AdminHeader
        title="Schools"
        subtitle={data ? `${formatNumber(total)} ${total === 1 ? "school" : "schools"}` : undefined}
        right={
          <Button
            mode="contained"
            icon="plus"
            onPress={() => openSchool("new")}
            testID="new-school"
          >
            New school
          </Button>
        }
      />
      <SearchBar placeholder="Search schools" onSearch={setQ} testID="schools-search" />
      <View style={styles.filters}>
        <ToggleChip
          label="Show inactive"
          selected={showInactive}
          onToggle={setShowInactive}
          testID="schools-show-inactive"
        />
      </View>
      <ProgressBar
        indeterminate
        visible={isFetching && !isLoading && !refreshing}
        color={colors.primary}
        style={styles.progress}
      />
    </View>
  );

  const empty = isError ? (
    <ErrorState description={getErrorMessage(error)} onRetry={refetch} />
  ) : isLoading ? (
    <View>
      {[0, 1, 2].map((i) => (
        <UserRowSkeleton key={i} style={groupedRowStyle(i, 3)} />
      ))}
    </View>
  ) : (
    <EmptyState
      icon="school-outline"
      title={q ? "No schools match" : "No schools yet"}
      description={q ? "Try a different search." : "Add the first school to get started."}
      actionLabel={q ? undefined : "New school"}
      onAction={q ? undefined : () => openSchool("new")}
    />
  );

  return (
    <AdminScreen testID="admin-schools">
      <FlatList
        data={isError ? [] : schools}
        keyExtractor={(school) => school.id}
        renderItem={({ item, index }) => (
          <SchoolRow
            school={item}
            style={groupedRowStyle(index, schools.length)}
            onPress={() => openSchool(item.id)}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={
          <View style={styles.footer}>
            {total > schools.length ? (
              <Text variant="bodySmall" style={styles.muted}>
                Showing the first {schools.length} of {formatNumber(total)}. Search to narrow
                the list.
              </Text>
            ) : null}
          </View>
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
  filters: {
    flexDirection: "row",
  },
  progress: {
    height: 2,
    backgroundColor: "transparent",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    minHeight: 64,
    backgroundColor: colors.surface,
  },
  hovered: {
    backgroundColor: "#F7FAF8",
  },
  pressed: {
    backgroundColor: "#EEF4F0",
  },
  webPointer: {
    cursor: "pointer",
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  name: {
    color: colors.onSurface,
    fontWeight: "600",
  },
  muted: {
    color: colors.onSurfaceVariant,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  dimmed: {
    opacity: 0.5,
  },
  footer: {
    alignItems: "center",
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
