import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../store";
import {
  exchangeCodeForTokens,
  storeTokens,
  useAuth0Config,
} from "../services/auth";
import { setLoading, setToken, setUser } from "../store/authSlice";
import { api } from "../services/api";
import { useAppSnackbar } from "./useAppSnackbar";

const SIGN_IN_FAILED = "We couldn't sign you in. Please try again.";

export interface UseSignInResult {
  /** Opens the Auth0 sign-in prompt. */
  signIn: () => Promise<void>;
  /** True once the auth request has been prepared and signIn can be called. */
  isReady: boolean;
  /** True from the moment signIn is called until the flow finishes or is cancelled. */
  isSigningIn: boolean;
}

/**
 * Auth0 sign-in flow shared by the landing page and the login screen.
 * On success it stores the tokens, loads the user profile and routes to "/"
 * (registered users) or to role selection (new users).
 */
export function useSignIn(): UseSignInResult {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { showError } = useAppSnackbar();
  const { request, result, promptAsync } = useAuth0Config();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!result) return;

    if (result.type !== "success" || !request?.codeVerifier) {
      if (result.type === "error") {
        showError(undefined, SIGN_IN_FAILED);
      }
      setIsSigningIn(false);
      return;
    }

    const { code } = result.params;
    const codeVerifier = request.codeVerifier;

    (async () => {
      try {
        const { accessToken, refreshToken } = await exchangeCodeForTokens(
          code,
          codeVerifier
        );
        await storeTokens(accessToken, refreshToken);
        dispatch(setToken(accessToken));

        // Registered users get a profile; new users go pick a role.
        const me = await dispatch(api.endpoints.getMe.initiate(undefined));
        if (me.data) {
          dispatch(setUser(me.data));
          dispatch(setLoading(false));
          router.replace("/");
        } else {
          dispatch(setLoading(false));
          router.replace("/(auth)/role-select");
        }
      } catch (error) {
        console.error("Sign-in failed:", error);
        dispatch(setLoading(false));
        showError(undefined, SIGN_IN_FAILED);
      } finally {
        setIsSigningIn(false);
      }
    })();
    // Only react to a new auth result; the request object is stable per prompt.
  }, [result]);

  const signIn = useCallback(async () => {
    if (!request || isSigningIn) return;
    setIsSigningIn(true);
    try {
      await promptAsync();
    } catch {
      setIsSigningIn(false);
      showError(undefined, "Couldn't open the sign-in window. Please try again.");
    }
  }, [request, isSigningIn, promptAsync, showError]);

  return { signIn, isReady: Boolean(request), isSigningIn };
}
