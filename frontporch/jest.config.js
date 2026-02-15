module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|react-native-paper|react-native-vector-icons|react-native-safe-area-context|@reduxjs/toolkit|react-redux|immer)",
  ],
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.ts"],
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/__tests__/setup.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
};
