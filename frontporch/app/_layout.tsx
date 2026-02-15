import { useEffect } from "react";
import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { Provider, useDispatch } from "react-redux";
import { store } from "../src/store";
import { theme } from "../src/theme";
import { setToken, setLoading } from "../src/store/authSlice";
import { getStoredToken } from "../src/services/auth";

function AppInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();

  useEffect(() => {
    (async () => {
      try {
        const token = await getStoredToken();
        if (token) {
          dispatch(setToken(token));
        } else {
          dispatch(setLoading(false));
        }
      } catch {
        dispatch(setLoading(false));
      }
    })();
  }, [dispatch]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <PaperProvider theme={theme}>
        <AppInitializer>
          <Stack screenOptions={{ headerShown: false }} />
        </AppInitializer>
      </PaperProvider>
    </Provider>
  );
}
