import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { Provider } from "react-redux";
import { store } from "../src/store";
import { theme } from "../src/theme";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <PaperProvider theme={theme}>
        <Stack screenOptions={{ headerShown: false }} />
      </PaperProvider>
    </Provider>
  );
}
