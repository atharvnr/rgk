import authReducer, {
  setToken,
  setUser,
  setOnboardingRole,
  logout,
  setLoading,
} from "../src/store/authSlice";
import type { User } from "../src/types";

describe("authSlice", () => {
  const initialState = {
    token: null,
    user: null,
    isAuthenticated: false,
    isLoading: true,
    onboardingRole: null,
  };

  it("should return the initial state", () => {
    expect(authReducer(undefined, { type: "unknown" })).toEqual(initialState);
  });

  it("should handle setToken", () => {
    const state = authReducer(initialState, setToken("test-token"));
    expect(state.token).toBe("test-token");
    // Token alone should not mark the user as authenticated until profile is fetched
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(true); // stays true until hydration completes
  });

  it("should handle setUser", () => {
    const user: User = {
      id: "1",
      auth0_id: "auth0|123",
      email: "test@example.com",
      name: "Test",
      role: "volunteer",
      verification_status: "unverified",
      is_active: true,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    };
    const state = authReducer(initialState, setUser(user));
    expect(state.user).toEqual(user);
    expect(state.isAuthenticated).toBe(true);
  });

  it("should handle setOnboardingRole", () => {
    const state = authReducer(initialState, setOnboardingRole("needy"));
    expect(state.onboardingRole).toBe("needy");
  });

  it("should handle logout", () => {
    const loggedInState = {
      ...initialState,
      token: "token",
      user: { id: "1" } as User,
      isAuthenticated: true,
    };
    const state = authReducer(loggedInState, logout());
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("should handle setLoading", () => {
    const state = authReducer(initialState, setLoading(false));
    expect(state.isLoading).toBe(false);
  });
});
