import React from "react";
import { render } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { theme } from "../../src/theme";
import { StatusChip } from "../../src/components/admin/StatusChip";
import type { VerificationStatus } from "../../src/types";

function renderChip(status: VerificationStatus) {
  return render(
    <PaperProvider theme={theme}>
      <StatusChip status={status} />
    </PaperProvider>
  );
}

describe("StatusChip", () => {
  it.each<[VerificationStatus, string, string]>([
    ["verified", "Verified", "check-circle-outline"],
    ["pending_verification", "Pending", "clock-outline"],
    ["verification_failed", "Failed", "close-circle-outline"],
    ["unverified", "Unverified", "help-circle-outline"],
  ])("renders %s with label %s and icon %s", (status, label, icon) => {
    const { getByText, getByTestId } = renderChip(status);
    expect(getByText(label)).toBeTruthy();
    expect(getByTestId("status-chip-icon").props.name).toBe(icon);
  });

  it("colours verified green, pending amber and failed red", () => {
    expect(renderChip("verified").getByText("Verified")).toHaveStyle({ color: "#1E7A46" });
    expect(renderChip("pending_verification").getByText("Pending")).toHaveStyle({
      color: "#9A5B00",
    });
    expect(renderChip("verification_failed").getByText("Failed")).toHaveStyle({
      color: theme.colors.error,
    });
  });

  it("renders nothing for not_required", () => {
    const { queryByTestId, queryByText } = renderChip("not_required");
    expect(queryByTestId("status-chip")).toBeNull();
    expect(queryByText(/not required/i)).toBeNull();
  });
});
