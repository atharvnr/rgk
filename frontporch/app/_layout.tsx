import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "../src/store";
import type { AppDispatch, RootState } from "../src/store";
import { theme } from "../src/theme";
import { setToken, setUser, setLoading } from "../src/store/authSlice";
import { getStoredToken } from "../src/services/auth";
import { api } from "../src/services/api";
import { GlobalSnackbar } from "../src/components/GlobalSnackbar";

function AppInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isLoading } = useSelector(
    (state: RootState) => state.auth
  );
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const token = await getStoredToken();
        if (token) {
          dispatch(setToken(token));
          // Hydrate user profile if already registered
          const result = await dispatch(api.endpoints.getMe.initiate(undefined));
          if (result.data) {
            dispatch(setUser(result.data));
          }
        }
      } catch {
        // Token invalid or user not registered — both fine, just continue
      } finally {
        dispatch(setLoading(false));
      }
    })();
  }, [dispatch]);

  // Auth guard: redirect to login when session ends, regardless of current screen
  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, isLoading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <PaperProvider theme={theme}>
        <AppInitializer>
          <Stack screenOptions={{ headerShown: false }} />
          <GlobalSnackbar />
        </AppInitializer>
      </PaperProvider>
    </Provider>
  );
}
