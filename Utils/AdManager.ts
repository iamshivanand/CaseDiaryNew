import {
  AdMobInterstitial,
  AdMobRewarded,
  setTestDeviceIDAsync,
} from 'expo-ads-admob';

const interstitialAdUnitId = 'ca-app-pub-3940256099942544/1033173712';
const rewardedAdUnitId = 'ca-app-pub-3940256099942544/5224354917';

export const initializeAds = async () => {
  await setTestDeviceIDAsync('EMULATOR');
};

export const showInterstitialAd = async () => {
  await AdMobInterstitial.setAdUnitID(interstitialAdUnitId);
  await AdMobInterstitial.requestAdAsync({ servePersonalizedAds: true });
  await AdMobInterstitial.showAdAsync();
};

export const showRewardedAd = (onReward: () => void) => {
  AdMobRewarded.setAdUnitID(rewardedAdUnitId);
  AdMobRewarded.requestAdAsync({ servePersonalizedAds: true });

  const rewardListener = AdMobRewarded.addEventListener('rewardedVideoUserDidEarnReward', () => {
    onReward();
    rewardListener.remove();
  });

  const adClosedListener = AdMobRewarded.addEventListener('rewardedVideoDidDismiss', () => {
    adClosedListener.remove();
  });

  AdMobRewarded.showAdAsync();
};
