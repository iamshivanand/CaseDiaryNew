module.exports = {
  preset: "react-native",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|uuid)",
  ],
  setupFilesAfterEnv: ["./jest-setup.js"],
  // Ensure mocks directory is recognized if not at root or if resolution issues occur
  // roots: ['<rootDir>'], // Default, usually fine
  // modulePaths: ['<rootDir>'], // Default
};
