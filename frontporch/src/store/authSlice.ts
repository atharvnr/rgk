import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { User, UserRole } from "../types";

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  onboardingRole: UserRole | null;
}

const initialState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
  onboardingRole: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
      // Do not mark authenticated until we have a user profile
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    setOnboardingRole(state, action: PayloadAction<UserRole>) {
      state.onboardingRole = action.payload;
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.onboardingRole = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
});

export const { setToken, setUser, setOnboardingRole, logout, setLoading } =
  authSlice.actions;
export default authSlice.reducer;
