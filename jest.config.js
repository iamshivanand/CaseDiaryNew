module.exports = {
  preset: 'jest-expo',
  // setupFiles: ["./jest-preload.js"], // Removed
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)"
  ],
  setupFilesAfterEnv: ["./jest-setup.js"],
  testEnvironment: 'react-native/jest/react-native-env.js', // Explicitly set to RN's environment
  clearMocks: true,
};
