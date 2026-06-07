import React from "react";
import { View, Button } from "react-native";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Unmock AdManager to test the actual implementation
jest.unmock("../AdManager");

import { AdProvider, useAdTrigger } from "../AdManager";
import ThemeProvider from "../../../Providers/ThemeProvider";
import LanguageProvider from "../../../Providers/LanguageProvider";
import * as Network from "expo-network";

// Declare global storage for listeners
declare global {
  var rewardedListeners: { [key: string]: Function };
  var interstitialListeners: { [key: string]: Function };
}

global.rewardedListeners = {};
global.interstitialListeners = {};

// Create mocks inside the mock definition to prevent undefined reference due to hoisting
jest.mock("react-native-google-mobile-ads", () => {
  const mockRewarded = {
    loaded: false,
    load: jest.fn(),
    show: jest.fn(),
    addAdEventListener: jest.fn((event, callback) => {
      global.rewardedListeners[event] = callback;
      return () => {};
    }),
  };

  const mockInterstitial = {
    loaded: false,
    load: jest.fn(),
    show: jest.fn(),
    addAdEventListener: jest.fn((event, callback) => {
      global.interstitialListeners[event] = callback;
      return () => {};
    }),
  };

  return {
    __esModule: true,
    RewardedAd: {
      createForAdRequest: jest.fn(() => mockRewarded),
    },
    InterstitialAd: {
      createForAdRequest: jest.fn(() => mockInterstitial),
    },
    TestIds: {
      REWARDED: "mock-rewarded",
      INTERSTITIAL: "mock-interstitial",
    },
    AdEventType: {
      LOADED: "loaded",
      ERROR: "error",
      CLOSED: "closed",
    },
    RewardedAdEventType: {
      EARNED_REWARD: "earned_reward",
    },
  };
});

jest.mock("expo-network", () => ({
  getNetworkStateAsync: jest.fn(() => Promise.resolve({ isConnected: true })),
}), { virtual: true });

const getMockRewarded = () => {
  const { RewardedAd } = require("react-native-google-mobile-ads");
  return RewardedAd.createForAdRequest();
};

const getMockInterstitial = () => {
  const { InterstitialAd } = require("react-native-google-mobile-ads");
  return InterstitialAd.createForAdRequest();
};

const TestComponent = ({ onComplete }: { onComplete: (success: boolean) => void }) => {
  const { showAdWithPreload } = useAdTrigger();
  return (
    <View>
      <Button title="Show Rewarded" onPress={() => showAdWithPreload("rewarded", onComplete)} />
      <Button title="Show Interstitial" onPress={() => showAdWithPreload("interstitial", onComplete)} />
    </View>
  );
};

const renderWithProviders = (onComplete: (success: boolean) => void) => {
  return render(
    <ThemeProvider>
      <LanguageProvider>
        <AdProvider>
          <TestComponent onComplete={onComplete} />
        </AdProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

describe("AdManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.rewardedListeners = {};
    global.interstitialListeners = {};
    getMockRewarded().loaded = false;
    getMockInterstitial().loaded = false;
  });

  it("should bypass ads and succeed immediately if user is premium", async () => {
    jest.spyOn(AsyncStorage, "getItem").mockResolvedValue("true");
    const onComplete = jest.fn();
    const { getByText } = renderWithProviders(onComplete);

    fireEvent.press(getByText("Show Rewarded"));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(true);
    });
    expect(getMockRewarded().show).not.toHaveBeenCalled();
  });

  it("should warn user and not proceed if internet connection is offline", async () => {
    jest.spyOn(AsyncStorage, "getItem").mockResolvedValue("false");
    (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({ isConnected: false });
    const alertSpy = jest.spyOn(require("react-native").Alert, "alert");
    const onComplete = jest.fn();
    const { getByText } = renderWithProviders(onComplete);

    fireEvent.press(getByText("Show Rewarded"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Internet Connection Required",
        expect.stringContaining("An active internet connection is required"),
        expect.any(Array)
      );
    });
    expect(onComplete).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it("should show ad immediately if it is already loaded", async () => {
    jest.spyOn(AsyncStorage, "getItem").mockResolvedValue("false");
    (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({ isConnected: true });
    getMockRewarded().loaded = true;
    const onComplete = jest.fn();
    const { getByText } = renderWithProviders(onComplete);

    fireEvent.press(getByText("Show Rewarded"));

    await waitFor(() => {
      expect(getMockRewarded().show).toHaveBeenCalled();
    });
  });

  it("should show preloading modal if ad is not loaded, and show ad once it loads", async () => {
    jest.spyOn(AsyncStorage, "getItem").mockResolvedValue("false");
    (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({ isConnected: true });
    getMockRewarded().loaded = false;
    const onComplete = jest.fn();
    const { getByText, queryByText } = renderWithProviders(onComplete);

    fireEvent.press(getByText("Show Rewarded"));

    // Verify preload modal is displayed
    await waitFor(() => {
      expect(queryByText("Preloading Ad...")).toBeTruthy();
    });

    // Simulate ad loaded event
    act(() => {
      if (global.rewardedListeners["loaded"]) {
        global.rewardedListeners["loaded"]();
      }
    });

    await waitFor(() => {
      expect(queryByText("Preloading Ad...")).toBeNull();
      expect(getMockRewarded().show).toHaveBeenCalled();
    });
  });
});
