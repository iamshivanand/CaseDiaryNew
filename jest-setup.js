// jest-setup.js

// This file is run by `setupFilesAfterEnv` in jest.config.js

// Mock for react-native-get-random-values, as uuid might depend on it.
jest.mock('react-native-get-random-values', () => ({
  getRandomBase64: jest.fn(() => 'mockRandomBase64'), // Return a consistent mock value
}));

// Mock for expo-document-picker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(() => Promise.resolve({ type: 'cancel', assets: null, canceled: true })),
}));

// Mock for expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mockDocumentDirectory/',
  cacheDirectory: 'file:///mockCacheDirectory/',
  getInfoAsync: jest.fn(uri => {
    if (uri.includes('CaseDiaryTestDb') || (typeof uri === 'string' && (uri.startsWith('file:///mockDocumentDirectory/documents/') || uri.startsWith('file:///mockCacheDirectory/')))) {
      return Promise.resolve({ exists: true, isDirectory: uri.endsWith('/'), uri });
    }
    return Promise.resolve({ exists: false, isDirectory: false, uri });
  }),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  copyAsync: jest.fn(({ from, to }) => Promise.resolve()), // Assume copy always succeeds
  deleteAsync: jest.fn(() => Promise.resolve()),
  readAsStringAsync: jest.fn(() => Promise.resolve("mock file content")),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  getContentUriAsync: jest.fn(uri => Promise.resolve('content://mocked/' + uri.split('/').pop())),
  downloadAsync: jest.fn((uri, fileUri, options) => Promise.resolve({ uri: fileUri, status: 200, md5: 'mockmd5', headers: {} })),
}));

// Mock for expo-intent-launcher
jest.mock('expo-intent-launcher', () => ({
  startActivityAsync: jest.fn(() => Promise.resolve({ resultCode: 0, data: null, extra: null })),
}));

// Mock for expo-sqlite - this will be used if __mocks__/expo-sqlite.js is not found or if explicitly unmocked.
// However, we have a manual mock in __mocks__/expo-sqlite.js, which Jest should pick up automatically.
// So, this explicit mock here is more of a fallback or for clarity if needed.
// jest.mock('expo-sqlite', () => {
//   const mockDb = {
//     transaction: jest.fn(callback => {
//       const tx = {
//         executeSql: jest.fn((sql, params, successCallback, errorCallback) => {
//           // Basic mock, can be expanded
//           if (successCallback) {
//             successCallback(tx, { rows: { _array: [], length: 0 }, rowsAffected: 0, insertId: 0 });
//           }
//         }),
//       };
//       callback(tx);
//     }),
//     closeAsync: jest.fn(),
//     deleteAsync: jest.fn(),
//   };
//   return {
//     openDatabase: jest.fn((name, version, description, size, callback) => mockDb),
//     SQLiteDatabase: jest.fn(() => mockDb) // For type checking if needed
//   };
// });

// Mock for react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: jest.fn(({ children }) => children),
    SafeAreaConsumer: jest.fn(({ children }) => children(inset)),
    useSafeAreaInsets: jest.fn(() => inset),
    useSafeAreaFrame: jest.fn(() => ({ x: 0, y: 0, width: 390, height: 844 })), // Mock frame
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: 0, height: 0 },
      insets: { top: 0, left: 0, right: 0, bottom: 0 },
    },
  };
});

// Mock for @react-navigation/native
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      dispatch: jest.fn(),
      goBack: jest.fn(),
      setParams: jest.fn(),
      addListener: jest.fn((event, callback) => {
        if (event === 'focus' || event === 'blur') {
          // Simulate focus/blur immediately for tests if needed, or provide a way to trigger
          // callback();
        }
        return jest.fn(); // Unsubscribe function
      }),
      isFocused: jest.fn(() => true),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: jest.fn(actualNav.useFocusEffect), // Keep actual implementation
    useIsFocused: jest.fn(() => true), // Default to focused
  };
});

// It might be useful to mock other @react-navigation modules if they cause issues
// e.g., @react-navigation/stack, @react-navigation/bottom-tabs

// If using AsyncStorage directly or indirectly
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// console.log('jest-setup.js: All custom mocks applied.');
