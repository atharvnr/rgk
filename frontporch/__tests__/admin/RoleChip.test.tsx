import React from "react";
import { render } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { theme } from "../../src/theme";
import { RoleChip } from "../../src/components/admin/RoleChip";
import type { UserRole } from "../../src/types";

function renderChip(role: UserRole) {
  return render(
    <PaperProvider theme={theme}>
      <RoleChip role={role} />
    </PaperProvider>
  );
}

const { colors } = theme;

describe("RoleChip", () => {
  it.each<[UserRole, string, string]>([
    ["root", "Root", colors.tertiaryContainer],
    ["school_admin", "School admin", colors.secondaryContainer],
    ["school_user", "School staff", colors.secondaryContainer],
    ["volunteer", "Volunteer", colors.primaryContainer],
    ["needy", "Elder", colors.surfaceVariant],
    ["needy_proxy", "Caregiver", colors.surfaceVariant],
  ])("renders %s as %s on its role colour", (role, label, background) => {
    const { getByText, getByTestId } = renderChip(role);
    expect(getByText(label)).toBeTruthy();
    expect(getByTestId("role-chip")).toHaveStyle({ backgroundColor: background });
  });

  it("uses the role's strong colour for the label", () => {
    const { getByText } = renderChip("volunteer");
    expect(getByText("Volunteer")).toHaveStyle({ color: colors.primary });
  });
});
