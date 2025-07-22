import React, { createContext, useContext, useEffect, useState } from 'react';
import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';

const adUnitId = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyyyyyy';

const rewarded = RewardedAd.createForAdRequest(adUnitId, {
  keywords: ['fashion', 'clothing'],
});

const RewardedAdContext = createContext({
  showRewardedAd: () => {},
  isRewardedAdLoaded: false,
});

export const useRewardedAd = () => {
  return useContext(RewardedAdContext);
};

export const RewardedAdProvider = ({ children }) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setLoaded(true);
    });
    const unsubscribeEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      reward => {
        console.log('User earned reward of ', reward);
      },
    );

    // Start loading the rewarded ad straight away
    rewarded.load();

    // Unsubscribe from events on unmount
    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
    };
  }, []);

  const showRewardedAd = () => {
    if (loaded) {
      rewarded.show();
    }
  };

  return (
    <RewardedAdContext.Provider value={{ showRewardedAd, isRewardedAdLoaded: loaded }}>
      {children}
    </RewardedAdContext.Provider>
  );
};
