import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { Provider } from "react-redux";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { store } from "../../src/store";
import { theme } from "../../src/theme";
import type { PaginatedResponse, User } from "../../src/types";
import UsersScreen from "../../app/(admin)/users";

// Keep the real `api` (its reducer and middleware back the store) and stub
// only the admin users hook.
const mockUseGetAdminUsersQuery = jest.fn();
jest.mock("../../src/services/api", () => {
  const actual = jest.requireActual("../../src/services/api");
  return {
    ...actual,
    useGetAdminUsersQuery: (...args: unknown[]) => mockUseGetAdminUsersQuery(...args),
  };
});

// Paper draws its own icons (search, chips, buttons) through this module; the
// real one loads a font asynchronously and updates outside act().
jest.mock("@expo/vector-icons/MaterialCommunityIcons", () => ({
  __esModule: true,
  default: () => null,
}));

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function makeUser(overrides: Partial<User>): User {
  return {
    id: "u",
    auth0_id: "auth0|u",
    email: "user@example.com",
    name: "User",
    role: "volunteer",
    verification_status: "verified",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

const USERS = [
  makeUser({ id: "u1", name: "Ada Lovelace", email: "ada@example.com" }),
  makeUser({
    id: "u2",
    name: "Grace Hopper",
    email: "grace@example.com",
    role: "school_admin",
    verification_status: "not_required",
  }),
];

function result(data: PaginatedResponse<User> | undefined, overrides = {}) {
  return {
    data,
    isLoading: false,
    isFetching: false,
    isError: false,
    error: undefined,
    refetch: jest.fn(),
    ...overrides,
  };
}

function renderScreen() {
  return render(
    <Provider store={store}>
      <SafeAreaProvider initialMetrics={metrics}>
        <PaperProvider theme={theme}>
          <UsersScreen />
        </PaperProvider>
      </SafeAreaProvider>
    </Provider>
  );
}

beforeEach(() => {
  mockUseGetAdminUsersQuery.mockReset();
  mockUseGetAdminUsersQuery.mockReturnValue(
    result({ items: USERS, total: 2, skip: 0, limit: 25 })
  );
});

afterEach(() => {
  jest.useRealTimers();
});

describe("UsersScreen", () => {
  it("renders both users and the total", () => {
    const { getByText, queryByText } = renderScreen();
    expect(getByText("Users")).toBeTruthy();
    expect(getByText("2 users")).toBeTruthy();
    expect(getByText("Ada Lovelace")).toBeTruthy();
    expect(getByText("Grace Hopper")).toBeTruthy();
    // Everything fits on one page.
    expect(queryByText("Load more")).toBeNull();
  });

  it("asks for active users, first page of 25, by default", () => {
    renderScreen();
    expect(mockUseGetAdminUsersQuery).toHaveBeenLastCalledWith({
      q: undefined,
      role: undefined,
      is_active: true,
      skip: 0,
      limit: 25,
    });
  });

  it("queries with the search text only after the 300 ms debounce", () => {
    jest.useFakeTimers();
    const { getByTestId } = renderScreen();

    fireEvent.changeText(getByTestId("users-search"), "ada");
    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(mockUseGetAdminUsersQuery).not.toHaveBeenCalledWith(
      expect.objectContaining({ q: "ada" })
    );

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(mockUseGetAdminUsersQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: "ada", skip: 0, limit: 25 })
    );
  });

  it("filters by role and can include inactive users", () => {
    const { getByTestId } = renderScreen();

    fireEvent.press(getByTestId("role-filter-needy"));
    expect(mockUseGetAdminUsersQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ role: "needy", is_active: true })
    );

    fireEvent.press(getByTestId("show-inactive"));
    expect(mockUseGetAdminUsersQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ role: "needy", is_active: undefined })
    );
  });

  it("opens the user page when a row is tapped", () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push, replace: jest.fn(), back: jest.fn() });
    const { getByTestId } = renderScreen();

    fireEvent.press(getByTestId("user-row-u2"));
    expect(push).toHaveBeenCalledWith({
      pathname: "/(admin)/user/[id]",
      params: { id: "u2" },
    });
  });

  it("offers Load more when there are more users than shown", () => {
    mockUseGetAdminUsersQuery.mockReturnValue(
      result({ items: USERS, total: 30, skip: 0, limit: 25 })
    );
    const { getByText } = renderScreen();
    expect(getByText("Load more")).toBeTruthy();
  });

  it("shows the empty state when no users match", () => {
    mockUseGetAdminUsersQuery.mockReturnValue(
      result({ items: [], total: 0, skip: 0, limit: 25 })
    );
    const { getByText, queryByText } = renderScreen();
    expect(getByText("No users match")).toBeTruthy();
    expect(queryByText("Ada Lovelace")).toBeNull();
  });

  it("shows three skeleton rows while loading", () => {
    mockUseGetAdminUsersQuery.mockReturnValue(
      result(undefined, { isLoading: true, isFetching: true })
    );
    const { getAllByTestId, queryByText } = renderScreen();
    expect(getAllByTestId("user-row-skeleton")).toHaveLength(3);
    expect(queryByText("No users match")).toBeNull();
  });
});
