export const AdMobBanner = () => null;
export const AdMobInterstitial = {
  setAdUnitID: jest.fn(),
  requestAdAsync: jest.fn(),
  showAdAsync: jest.fn(),
};
export const AdMobRewarded = {
  setAdUnitID: jest.fn(),
  requestAdAsync: jest.fn(),
  showAdAsync: jest.fn(),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeAllListeners: jest.fn(),
};
export const setTestDeviceIDAsync = jest.fn();
