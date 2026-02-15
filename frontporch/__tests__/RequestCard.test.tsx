import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { RequestCard } from "../src/components/RequestCard";
import type { VolunteerRequest } from "../src/types";

const mockRequest: VolunteerRequest = {
  id: "1",
  elder_id: "elder1",
  title: "Help with groceries",
  description: "Need help carrying bags from the store",
  category: "errands",
  status: "open",
  created_at: "2026-02-14",
  updated_at: "2026-02-14",
};

function renderWithProvider(component: React.ReactElement) {
  return render(<PaperProvider>{component}</PaperProvider>);
}

describe("RequestCard", () => {
  it("renders request title and description", () => {
    const { getByText } = renderWithProvider(
      <RequestCard request={mockRequest} />
    );
    expect(getByText("Help with groceries")).toBeTruthy();
    expect(getByText("Need help carrying bags from the store")).toBeTruthy();
  });

  it("renders category chip", () => {
    const { getByText } = renderWithProvider(
      <RequestCard request={mockRequest} />
    );
    expect(getByText("Errands")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProvider(
      <RequestCard request={mockRequest} onPress={onPress} />
    );
    fireEvent.press(getByText("Help with groceries"));
    expect(onPress).toHaveBeenCalled();
  });
});
