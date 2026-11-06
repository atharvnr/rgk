import React from "react";
import { fireEvent, render, within } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { Provider } from "react-redux";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import { store } from "../src/store";
import { theme } from "../src/theme";
import { Landing } from "../src/screens/Landing";
import { ONBOARDING_MESSAGE } from "../src/components/landing/ImpactStrip";

const mockSignIn = jest.fn();
jest.mock("../src/hooks/useSignIn", () => ({
  useSignIn: () => ({ signIn: mockSignIn, isReady: true, isSigningIn: false }),
}));

// Keep the real `api` (its reducer and middleware back the store) and stub
// only the public stats hook.
const mockUseGetPublicStatsQuery = jest.fn();
jest.mock("../src/services/api", () => {
  const actual = jest.requireActual("../src/services/api");
  return {
    ...actual,
    useGetPublicStatsQuery: (...args: unknown[]) =>
      mockUseGetPublicStatsQuery(...args),
  };
});

jest.mock("expo-linking", () => ({
  openURL: jest.fn().mockResolvedValue(true),
}));

let mockWidth = 390;
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => ({ width: mockWidth, height: 844, scale: 2, fontScale: 1 }),
}));

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderLanding() {
  return render(
    <Provider store={store}>
      <SafeAreaProvider initialMetrics={metrics}>
        <PaperProvider theme={theme}>
          <Landing />
        </PaperProvider>
      </SafeAreaProvider>
    </Provider>
  );
}

function statsResult(overrides: Record<string, unknown>) {
  return { data: undefined, isLoading: false, isError: false, ...overrides };
}

const STATS = {
  hours_served: 12345.5,
  sessions_completed: 900,
  volunteers: 1234,
  elders_helped: 87,
  schools: 3,
};

beforeEach(() => {
  mockWidth = 390;
  mockSignIn.mockClear();
  (Linking.openURL as jest.Mock).mockClear();
  mockUseGetPublicStatsQuery.mockReturnValue(statsResult({ data: STATS }));
});

describe("Landing", () => {
  it("renders the headline, the three steps and Get started", () => {
    const { getByText, getAllByText } = renderLanding();

    expect(getByText("Help next door, hours that count.")).toBeTruthy();
    expect(getByText("An elder asks")).toBeTruthy();
    expect(getByText("A student shows up")).toBeTruthy();
    expect(getByText("The school signs off")).toBeTruthy();
    // TopBar and hero both offer it.
    expect(getAllByText("Get started")).toHaveLength(2);
  });

  it("starts sign-in from the hero Get started button", () => {
    const { getByTestId } = renderLanding();
    fireEvent.press(getByTestId("hero-get-started"));
    expect(mockSignIn).toHaveBeenCalledTimes(1);
  });

  it("shows formatted impact numbers when stats load", () => {
    const { getByTestId } = renderLanding();
    const strip = within(getByTestId("impact-strip"));

    expect(strip.getByText("12,345.5")).toBeTruthy();
    expect(strip.getByText("1,234")).toBeTruthy();
    expect(strip.getByText("87")).toBeTruthy();
    expect(strip.getByText("3")).toBeTruthy();
    expect(strip.getByText("Hours served")).toBeTruthy();
    expect(strip.getByText("Volunteers")).toBeTruthy();
    expect(strip.getByText("Elders helped")).toBeTruthy();
    expect(strip.getByText("Partner schools")).toBeTruthy();
    expect(strip.queryByText(ONBOARDING_MESSAGE)).toBeNull();
  });

  it("drops a trailing .0 from hours served", () => {
    mockUseGetPublicStatsQuery.mockReturnValue(
      statsResult({ data: { ...STATS, hours_served: 1500 } })
    );
    const { getByText } = renderLanding();
    expect(getByText("1,500")).toBeTruthy();
  });

  it("shows the onboarding sentence instead of zeros", () => {
    mockUseGetPublicStatsQuery.mockReturnValue(
      statsResult({
        data: {
          hours_served: 0,
          sessions_completed: 0,
          volunteers: 0,
          elders_helped: 0,
          schools: 0,
        },
      })
    );
    const { getByText, queryByText } = renderLanding();

    expect(getByText(ONBOARDING_MESSAGE)).toBeTruthy();
    expect(queryByText("Hours served")).toBeNull();
  });

  it("shows the onboarding sentence when the stats request fails", () => {
    mockUseGetPublicStatsQuery.mockReturnValue(statsResult({ isError: true }));
    const { getByText } = renderLanding();
    expect(getByText(ONBOARDING_MESSAGE)).toBeTruthy();
  });

  it("shows placeholders while stats are loading", () => {
    mockUseGetPublicStatsQuery.mockReturnValue(statsResult({ isLoading: true }));
    const { getAllByTestId, queryByText } = renderLanding();
    expect(getAllByTestId("impact-placeholder")).toHaveLength(4);
    expect(queryByText(ONBOARDING_MESSAGE)).toBeNull();
  });

  it("opens a mailto link from the schools panel", () => {
    const { getByText } = renderLanding();
    fireEvent.press(getByText("Email us"));
    expect(Linking.openURL).toHaveBeenCalledWith(
      expect.stringMatching(/^mailto:.+\?subject=RentGrandKids%20for%20our%20school$/)
    );
  });

  it("hides the wordmark on phones and shows it on desktop", () => {
    const phone = renderLanding();
    expect(phone.queryByText("RentGrandKids")).toBeNull();
    phone.unmount();

    mockWidth = 1280;
    const desktop = renderLanding();
    expect(desktop.getByText("RentGrandKids")).toBeTruthy();
    // Desktop breaks the headline after the comma.
    expect(desktop.getByText("Help next door,\nhours that count.")).toBeTruthy();
  });
});
