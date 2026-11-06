import type { StyleProp, ViewStyle } from "react-native";
import { theme } from "../../theme";
import type { UserRole } from "../../types";
import { Pill } from "./Pill";

const { colors } = theme;

export const ROLE_LABELS: Record<UserRole, string> = {
  volunteer: "Volunteer",
  needy: "Elder",
  needy_proxy: "Caregiver",
  school_admin: "School admin",
  school_user: "School staff",
  root: "Root",
};

export interface RoleTone {
  color: string;
  background: string;
}

const ROOT: RoleTone = { color: "#8A4B12", background: colors.tertiaryContainer };
const SCHOOL: RoleTone = { color: colors.secondary, background: colors.secondaryContainer };
const VOLUNTEER: RoleTone = { color: colors.primary, background: colors.primaryContainer };
const NEUTRAL: RoleTone = { color: colors.onSurfaceVariant, background: colors.surfaceVariant };

/** Role colour family: root tertiary, school roles secondary, volunteer primary, elders neutral. */
export const ROLE_TONES: Record<UserRole, RoleTone> = {
  root: ROOT,
  school_admin: SCHOOL,
  school_user: SCHOOL,
  volunteer: VOLUNTEER,
  needy: NEUTRAL,
  needy_proxy: NEUTRAL,
};

export function roleLabel(role: UserRole): string {
  return ROLE_LABELS[role] ?? role;
}

interface RoleChipProps {
  role: UserRole;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function RoleChip({ role, style, testID = "role-chip" }: RoleChipProps) {
  const tone = ROLE_TONES[role] ?? NEUTRAL;
  return (
    <Pill
      label={roleLabel(role)}
      color={tone.color}
      background={tone.background}
      style={style}
      testID={testID}
    />
  );
}
