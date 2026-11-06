import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { Provider } from "react-redux";
import { useRouter } from "expo-router";
import { store } from "../src/store";
import { logout } from "../src/store/authSlice";
import { hideSnackbar } from "../src/store/uiSlice";
import { useSignIn } from "../src/hooks/useSignIn";
import type { User } from "../src/types";

type MockAuthResult =
  | null
  | { type: "success"; params: { code: string } }
  | { type: "dismiss" | "error" };

const mockAuth: {
  request: { codeVerifier: string } | null;
  result: MockAuthResult;
  promptAsync: jest.Mock;
} = { request: { codeVerifier: "verifier" }, result: null, promptAsync: jest.fn() };

const mockExchange = jest.fn();
const mockStoreTokens = jest.fn();
jest.mock("../src/services/auth", () => ({
  useAuth0Config: () => mockAuth,
  exchangeCodeForTokens: (...args: unknown[]) => mockExchange(...args),
  storeTokens: (...args: unknown[]) => mockStoreTokens(...args),
  clearTokens: jest.fn(),
  refreshAccessToken: jest.fn(),
}));

// Stub getMe so no network is involved; the rest of the api stays real.
const mockGetMe = jest.fn();
jest.mock("../src/services/api", () => {
  const actual = jest.requireActual("../src/services/api");
  return {
    ...actual,
    api: {
      ...actual.api,
      endpoints: {
        ...actual.api.endpoints,
        getMe: { initiate: () => () => mockGetMe() },
      },
    },
  };
});

const user: User = {
  id: "u1",
  auth0_id: "auth0|1",
  email: "maya@example.org",
  name: "Maya",
  role: "volunteer",
  verification_status: "verified",
  is_active: true,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
};

const router = useRouter() as unknown as { replace: jest.Mock };

function wrapper({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}

beforeEach(() => {
  store.dispatch(logout());
  store.dispatch(hideSnackbar());
  mockAuth.request = { codeVerifier: "verifier" };
  mockAuth.result = null;
  mockAuth.promptAsync = jest.fn().mockResolvedValue(undefined);
  mockExchange.mockReset().mockResolvedValue({ accessToken: "at", refreshToken: "rt" });
  mockStoreTokens.mockReset().mockResolvedValue(undefined);
  mockGetMe.mockReset();
  router.replace.mockClear();
});

describe("useSignIn", () => {
  it("is not ready until the auth request exists", () => {
    mockAuth.request = null;
    const { result } = renderHook(() => useSignIn(), { wrapper });
    expect(result.current.isReady).toBe(false);
  });

  it("prompts, stores tokens and routes a registered user home", async () => {
    mockGetMe.mockResolvedValue({ data: user });
    const { result, rerender } = renderHook(() => useSignIn(), { wrapper });

    await act(async () => {
      await result.current.signIn();
    });
    expect(mockAuth.promptAsync).toHaveBeenCalled();
    expect(result.current.isSigningIn).toBe(true);

    mockAuth.result = { type: "success", params: { code: "abc" } };
    rerender({});

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
    expect(mockExchange).toHaveBeenCalledWith("abc", "verifier");
    expect(mockStoreTokens).toHaveBeenCalledWith("at", "rt");
    expect(store.getState().auth.token).toBe("at");
    expect(store.getState().auth.user?.id).toBe("u1");
    expect(store.getState().auth.isLoading).toBe(false);
    await waitFor(() => expect(result.current.isSigningIn).toBe(false));
  });

  it("sends a new user to role selection", async () => {
    mockGetMe.mockResolvedValue({ error: { status: 404 } });
    const { rerender } = renderHook(() => useSignIn(), { wrapper });

    mockAuth.result = { type: "success", params: { code: "abc" } };
    rerender({});

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/(auth)/role-select")
    );
    expect(store.getState().auth.user).toBeNull();
  });

  it("shows the error snackbar when the token exchange fails", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    mockExchange.mockRejectedValue(new Error("invalid_grant"));
    const { result, rerender } = renderHook(() => useSignIn(), { wrapper });

    mockAuth.result = { type: "success", params: { code: "abc" } };
    rerender({});

    await waitFor(() => expect(store.getState().ui.snackbar.visible).toBe(true));
    expect(store.getState().ui.snackbar.type).toBe("error");
    expect(router.replace).not.toHaveBeenCalled();
    expect(result.current.isSigningIn).toBe(false);
    consoleError.mockRestore();
  });

  it("resets isSigningIn when the user closes the prompt", async () => {
    const { result, rerender } = renderHook(() => useSignIn(), { wrapper });

    await act(async () => {
      await result.current.signIn();
    });
    expect(result.current.isSigningIn).toBe(true);

    mockAuth.result = { type: "dismiss" };
    rerender({});

    await waitFor(() => expect(result.current.isSigningIn).toBe(false));
    expect(store.getState().ui.snackbar.visible).toBe(false);
  });
});
