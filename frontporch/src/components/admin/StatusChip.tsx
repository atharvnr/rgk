import type { StyleProp, ViewStyle } from "react-native";
import { theme } from "../../theme";
import type { VerificationStatus } from "../../types";
import type { IconName } from "../landing/IconCircle";
import { Pill } from "./Pill";

const { colors } = theme;

interface StatusTone {
  label: string;
  icon: IconName;
  color: string;
  border: string;
}

export const STATUS_TONES: Record<
  Exclude<VerificationStatus, "not_required">,
  StatusTone
> = {
  verified: {
    label: "Verified",
    icon: "check-circle-outline",
    color: "#1E7A46",
    border: "#BFE3CD",
  },
  pending_verification: {
    label: "Pending",
    icon: "clock-outline",
    color: "#9A5B00",
    border: "#F2D6A8",
  },
  verification_failed: {
    label: "Failed",
    icon: "close-circle-outline",
    color: colors.error,
    border: "#F2C9C5",
  },
  unverified: {
    label: "Unverified",
    icon: "help-circle-outline",
    color: colors.onSurfaceVariant,
    border: colors.outline,
  },
};

interface StatusChipProps {
  status: VerificationStatus;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Outlined verification badge (RoleChip is filled, so the two read apart).
 * Renders nothing for "not_required".
 */
export function StatusChip({ status, style, testID = "status-chip" }: StatusChipProps) {
  if (status === "not_required") return null;
  const tone = STATUS_TONES[status];
  if (!tone) return null;
  return (
    <Pill
      label={tone.label}
      icon={tone.icon}
      color={tone.color}
      background={colors.surface}
      borderColor={tone.border}
      style={style}
      testID={testID}
    />
  );
}
