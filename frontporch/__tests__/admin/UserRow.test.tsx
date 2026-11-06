import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { theme } from "../../src/theme";
import { UserRow, getInitials } from "../../src/components/admin/UserRow";
import type { User } from "../../src/types";

const BASE_USER: User = {
  id: "u1",
  auth0_id: "auth0|1",
  email: "ada@example.com",
  name: "Ada Lovelace",
  role: "volunteer",
  verification_status: "verified",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

function renderRow(overrides: Partial<User> = {}, onPress?: () => void) {
  return render(
    <PaperProvider theme={theme}>
      <UserRow user={{ ...BASE_USER, ...overrides }} onPress={onPress} />
    </PaperProvider>
  );
}

describe("UserRow", () => {
  it("renders initials, name, email, role and status", () => {
    const { getByText } = renderRow();
    expect(getByText("AL")).toBeTruthy();
    expect(getByText("Ada Lovelace")).toBeTruthy();
    expect(getByText("ada@example.com")).toBeTruthy();
    expect(getByText("Volunteer")).toBeTruthy();
    expect(getByText("Verified")).toBeTruthy();
  });

  it("hides the status chip when verification is not required", () => {
    const { queryByTestId, getByText } = renderRow({
      role: "school_admin",
      verification_status: "not_required",
    });
    expect(getByText("School admin")).toBeTruthy();
    expect(queryByTestId("user-row-status")).toBeNull();
  });

  it("is not dimmed and has no Inactive chip when active", () => {
    const { queryByText, getByTestId } = renderRow();
    expect(queryByText("Inactive")).toBeNull();
    expect(getByTestId("user-row-text")).not.toHaveStyle({ opacity: 0.5 });
  });

  it("dims an inactive user and shows the Inactive chip", () => {
    const { getByText, getByTestId } = renderRow({ is_active: false });
    expect(getByText("Inactive")).toBeTruthy();
    expect(getByTestId("user-row-text")).toHaveStyle({ opacity: 0.5 });
    expect(getByTestId("user-row-avatar")).toHaveStyle({ opacity: 0.5 });
    // The Inactive chip itself stays at full strength.
    expect(getByTestId("user-row-inactive")).not.toHaveStyle({ opacity: 0.5 });
  });

  it("falls back to the email when the name is blank", () => {
    const { getAllByText, getByText } = renderRow({ name: "  " });
    expect(getAllByText("ada@example.com")).toHaveLength(2);
    expect(getByText("A")).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    const { getByTestId } = renderRow({}, onPress);
    fireEvent.press(getByTestId("user-row"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe("getInitials", () => {
  it("uses the first and last word", () => {
    expect(getInitials("Mary Ann Evans", "m@x.com")).toBe("ME");
    expect(getInitials("cher", "c@x.com")).toBe("C");
    expect(getInitials("", "zed@x.com")).toBe("Z");
  });
});
