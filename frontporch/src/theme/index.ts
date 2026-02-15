import { MD3LightTheme, configureFonts } from "react-native-paper";

const fontConfig = {
  fontFamily: "System",
};

export const theme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    primary: "#2E7D32",
    primaryContainer: "#C8E6C9",
    secondary: "#5C6BC0",
    secondaryContainer: "#C5CAE9",
    tertiary: "#FF8F00",
    tertiaryContainer: "#FFE0B2",
    surface: "#FFFFFF",
    surfaceVariant: "#F5F5F5",
    background: "#FAFAFA",
    error: "#D32F2F",
    onPrimary: "#FFFFFF",
    onSecondary: "#FFFFFF",
    onTertiary: "#FFFFFF",
    onSurface: "#212121",
    onSurfaceVariant: "#757575",
    outline: "#BDBDBD",
  },
  roundness: 12,
};

export type AppTheme = typeof theme;
