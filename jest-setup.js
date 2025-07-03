// jest-setup.js
// You can add global mocks or setup configurations here.

// Mock for react-native-get-random-values if uuid gives trouble in Jest
// Needed because uuid uses it under the hood.
jest.mock('react-native-get-random-values', () => ({
  getRandomBase64: jest.fn(),
  // If you are using other functions from this library, mock them as well.
  // For uuid, getRandomBase64 is often enough if it's the only one indirectly used.
  // A more complete mock for uuid might involve actually returning random values.
  // For basic tests, just ensuring it doesn't crash is key.
}));

// Mock for expo-document-picker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(() => Promise.resolve({ canceled: true, assets: null })), // Default mock for cancelled picking
}));

// Mock for expo-file-system (basic, expand as needed)
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mockDocumentDirectory/', // Expo's FS paths often have file:// prefix
  getInfoAsync: jest.fn((uri) => {
    // console.log(`Mock FS: getInfoAsync for ${uri}`);
    // Simulate file existence based on a known path or a convention
    if (uri.includes('CaseDiaryTestDb') || (typeof uri === 'string' && uri.startsWith('file:///mockDocumentDirectory/documents/'))) {
        // For tests, assume files "exist" if they are in our mock dir or are the DB file
        // This might need to be more sophisticated if tests depend on non-existence.
        return Promise.resolve({ exists: true, isDirectory: uri.endsWith('/') });
    }
    return Promise.resolve({ exists: false, isDirectory: false });
  }),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  copyAsync: jest.fn(() => Promise.resolve()), // Assume copy always succeeds
  deleteAsync: jest.fn(() => Promise.resolve()), // Assume delete always succeeds
  getContentUriAsync: jest.fn(uri => Promise.resolve('content://mocked/' + uri.split('/').pop())),
}));

// Mock for expo-intent-launcher
jest.mock('expo-intent-launcher', () => ({
    startActivityAsync: jest.fn(() => Promise.resolve(null)), // `startActivityAsync` returns Promise<IntentLauncher.IntentLauncherResult>
}));

// Optional: Clear all mocks before each test if you want clean slate,
// but Jest does this by default for jest.fn() call counts etc.
// beforeEach(() => {
//   jest.clearAllMocks();
// });

// Note: The __mocks__/expo-sqlite.js will be automatically picked up by Jest.
// No need to explicitly mock it here unless you want to override that manual mock.

// console.log('jest-setup.js loaded'); // Keep this for debugging if tests still fail to find it
