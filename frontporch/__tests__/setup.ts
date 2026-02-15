import "@testing-library/jest-native/extend-expect";

// Mock expo modules
jest.mock("expo-constants", () => ({
  expoConfig: {},
  default: {},
}));

// Mock expo-secure-store
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-auth-session
jest.mock("expo-auth-session", () => ({
  useAuthRequest: jest.fn().mockReturnValue([null, null, jest.fn()]),
  makeRedirectUri: jest.fn().mockReturnValue("rentgrandkids://"),
  ResponseType: { Code: "code" },
  exchangeCodeAsync: jest.fn(),
}));

// Mock expo-web-browser
jest.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

// Mock expo-router
jest.mock("expo-router", () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: jest.fn().mockReturnValue({}),
  Redirect: jest.fn().mockReturnValue(null),
  Stack: jest.fn().mockReturnValue(null),
  Tabs: jest.fn().mockReturnValue(null),
  Link: jest.fn().mockReturnValue(null),
}));

// Mock @expo/vector-icons
jest.mock("@expo/vector-icons", () => ({
  MaterialCommunityIcons: "MaterialCommunityIcons",
}));
