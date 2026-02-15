import React from "react";
import { render } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { StatCard } from "../src/components/StatCard";

function renderWithProvider(component: React.ReactElement) {
  return render(<PaperProvider>{component}</PaperProvider>);
}

describe("StatCard", () => {
  it("renders title and value", () => {
    const { getByText } = renderWithProvider(
      <StatCard title="Hours" value={42} />
    );
    expect(getByText("Hours")).toBeTruthy();
    expect(getByText("42")).toBeTruthy();
  });

  it("renders subtitle when provided", () => {
    const { getByText } = renderWithProvider(
      <StatCard title="Sessions" value={10} subtitle="this month" />
    );
    expect(getByText("this month")).toBeTruthy();
  });

  it("renders without subtitle", () => {
    const { queryByText } = renderWithProvider(
      <StatCard title="Count" value={5} />
    );
    expect(queryByText("this month")).toBeNull();
  });
});
