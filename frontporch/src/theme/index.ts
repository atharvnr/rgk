import { MD3LightTheme, configureFonts } from "react-native-paper";

const fontConfig = {
  fontFamily: "System",
};

export const theme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    primary: "#1F6F4A",
    primaryContainer: "#DDF3E6",
    onPrimaryContainer: "#0B3B25",
    secondary: "#3D5A80",
    secondaryContainer: "#DCE6F2",
    tertiary: "#C7792A",
    tertiaryContainer: "#FBE8D3",
    surface: "#FFFFFF",
    surfaceVariant: "#F1F3EF",
    background: "#FBFBF9",
    error: "#B3261E",
    onPrimary: "#FFFFFF",
    onSecondary: "#FFFFFF",
    onTertiary: "#FFFFFF",
    onSurface: "#1B1F1C",
    onSurfaceVariant: "#5C645E",
    outline: "#D5DAD6",
    outlineVariant: "#E8ECE9",
  },
  roundness: 14,
};

export type AppTheme = typeof theme;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 72,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export const layout = {
  maxWidth: 1120,
  breakpoint: 900,
} as const;
