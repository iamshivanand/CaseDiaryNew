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

// Mock for expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('mock-notification-id')),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
}), { virtual: true });

// Mock for expo-print
jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(() => Promise.resolve({ uri: 'file:///mock/print/file.pdf' })),
}), { virtual: true });

// Mock for expo-sharing
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}), { virtual: true });

// Mock for AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}), { virtual: true });

// Mock for @react-native-picker/picker
jest.mock('@react-native-picker/picker', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  const Picker = (props) => {
    return React.createElement(View, { testID: props.testID }, props.children);
  };
  
  Picker.Item = (props) => {
    const { Text } = require('react-native');
    return React.createElement(Text, null, props.label);
  };
  
  return { Picker };
}, { virtual: true });

// Note: The __mocks__/expo-sqlite.js will be automatically picked up by Jest.
// No need to explicitly mock it here unless you want to override that manual mock.

// console.log('jest-setup.js loaded'); // Keep this for debugging if tests still fail to find it

// Mock for react-native-autocomplete-input
jest.mock('react-native-autocomplete-input', () => {
  const React = require('react');
  const { TextInput, View } = require('react-native');
  
  const Autocomplete = (props) => {
    const { data, renderResultList, onChangeText, defaultValue, placeholder } = props;
    return React.createElement(
      View,
      null,
      React.createElement(TextInput, {
        placeholder,
        value: defaultValue,
        onChangeText,
        ...props,
      }),
      data && data.length > 0 && typeof renderResultList === 'function'
        ? renderResultList({ data })
        : null
    );
  };
  
  return Autocomplete;
}, { virtual: true });

// Mock for react-native-google-mobile-ads
jest.mock('react-native-google-mobile-ads', () => {
  const React = require('react');
  const { View, Text } = require('react-native');

  const BannerAd = (props) => {
    return React.createElement(View, { style: props.style }, React.createElement(Text, null, "BannerAd"));
  };

  const InterstitialAd = {
    createForAdRequest: jest.fn(() => ({
      load: jest.fn(),
      show: jest.fn(),
      addAdEventListener: jest.fn(() => jest.fn()),
    })),
  };

  const RewardedAd = {
    createForAdRequest: jest.fn(() => ({
      load: jest.fn(),
      show: jest.fn(),
      addAdEventListener: jest.fn(() => jest.fn()),
    })),
  };

  const AppOpenAd = {
    createForAdRequest: jest.fn(() => ({
      load: jest.fn(),
      show: jest.fn(),
      addAdEventListener: jest.fn(() => jest.fn()),
    })),
  };

  const mobileAds = jest.fn(() => ({
    initialize: jest.fn(() => Promise.resolve({})),
  }));

  return {
    __esModule: true,
    default: mobileAds,
    BannerAd,
    BannerAdSize: {
      ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
      BANNER: 'BANNER',
    },
    TestIds: {
      BANNER: 'ca-app-pub-3940256099942544/6300978111',
      INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
      APP_OPEN: 'ca-app-pub-3940256099942544/9257395921',
      REWARDED: 'ca-app-pub-3940256099942544/5224354917',
    },
    InterstitialAd,
    RewardedAd,
    AppOpenAd,
    AdEventType: {
      LOADED: 'loaded',
      CLOSED: 'closed',
    },
    RewardedAdEventType: {
      LOADED: 'loaded',
      CLOSED: 'closed',
      EARNED_REWARD: 'earned_reward',
    },
  };
}, { virtual: true });

// Mock for local AdManager utility
jest.mock('./Screens/CommonComponents/AdManager', () => ({
  AdProvider: ({ children }) => children,
  useAdTrigger: () => ({
    showAdWithPreload: jest.fn((adType, onComplete) => {
      onComplete(true);
    }),
  }),
}));
