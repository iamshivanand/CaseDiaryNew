# 📋 Google AdMob Integration & Rollout Guide

This guide details the step-by-step procedure to transition from AdMob Test Ads to live Production Ads in the **Advocase** application.

---

## 🔑 1. Ad Credentials Required from AdMob

Please log into your [Google AdMob Console](https://admob.google.com/) and generate/copy the following identifiers:

### A. Application IDs
Used by the native OS to initialize the Google Mobile Ads SDK on startup:
1. **AdMob Android App ID** (Format: `ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX`)
2. **AdMob iOS App ID** (Format: `ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX`)

### B. Ad Unit IDs
Used in the source code to request specific ad formats:
3. **Android Rewarded Ad Unit ID** (Format: `ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX`)
4. **iOS Rewarded Ad Unit ID** (Format: `ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX`)
5. **Android Interstitial Ad Unit ID** (Format: `ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX`)
6. **iOS Interstitial Ad Unit ID** (Format: `ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX`)

---

## ⚙️ 2. Code Configuration

### Step A: Update Application IDs in `app.json`
Open [app.json](file:///e:/Projects/2026/CaseDiaryNew/app.json) and locate the `"react-native-google-mobile-ads"` plugin section. Replace the test values with your production IDs:

```json
"plugins": [
  [
    "react-native-google-mobile-ads",
    {
      "androidAppId": "YOUR_REAL_ANDROID_APP_ID",
      "iosAppId": "YOUR_REAL_IOS_APP_ID"
    }
  ]
]
```

> [!IMPORTANT]
> Because App IDs are compiled directly into the binary plist/manifest, modifying this file **requires a fresh native compilation** (OTA javascript bundle updates will not apply changes to `app.json`).

---

### Step B: Update Ad Unit IDs in `AdManager.tsx`
Open [AdManager.tsx](file:///e:/Projects/2026/CaseDiaryNew/Screens/CommonComponents/AdManager.tsx) and find the ID definition variables at the top. Replace the placeholder strings inside the production branches (`__DEV__` is false):

```typescript
const rewardedAdUnitId = __DEV__
  ? TestIds.REWARDED
  : Platform.OS === "ios"
  ? "YOUR_REAL_IOS_REWARDED_UNIT_ID" // <-- Paste iOS Rewarded ID here
  : "YOUR_REAL_ANDROID_REWARDED_UNIT_ID"; // <-- Paste Android Rewarded ID here

const interstitialAdUnitId = __DEV__
  ? TestIds.INTERSTITIAL
  : Platform.OS === "ios"
  ? "YOUR_REAL_IOS_INTERSTITIAL_UNIT_ID" // <-- Paste iOS Interstitial ID here
  : "YOUR_REAL_ANDROID_INTERSTITIAL_UNIT_ID"; // <-- Paste Android Interstitial ID here
```

---

## 🌐 3. Setting Up `app-ads.txt` (Authorized Ad Sellers)

Google blocks advertisers from bidding on your app's inventory unless you list your Publisher ID on a developer website. If you don't own a website, set up a free one:

### Choice A: GitHub Pages (Easiest for Developers)
1. Create a public repository on GitHub named **`your-username.github.io`** (replace `your-username` with your GitHub name).
2. Create a file in this repository named **`app-ads.txt`**.
3. Paste your authorized line from AdMob into this file:
   ```text
   google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
   ```
   *(Replace `pub-XXXXXXXXXXXXXXXX` with your actual AdMob Publisher ID)*
4. Save and commit. Your file will be live at: `https://your-username.github.io/app-ads.txt`

### Choice B: Google Blogger
1. Go to [Blogger.com](https://www.blogger.com/) and create a free blog (e.g., `advocase.blogspot.com`).
2. Go to **Settings > Monetization**.
3. Enable **Custom ads.txt** and paste the AdMob line.
4. Save changes. Your file will be live at: `https://advocase.blogspot.com/app-ads.txt`

---

## 📲 4. Store Console Settings

Link your hosted file to your App Store listings so Google AdMob's crawler can verify ownership:

1. Log into your **Google Play Console** (Android) or **App Store Connect** (iOS).
2. Select your App Listing.
3. Locate **Store Presence > Store Listing > Contact Information** (or App Info).
4. In the **Website** field, enter the **root URL** where your file is hosted:
   * Enter: `https://your-username.github.io` (Do NOT add `/app-ads.txt` at the end).
5. Submit the app store update for review. Google AdMob will crawl the site and verify it within 24 hours.

---

## 📦 5. Native Compilation & Testing

Google AdMob requires native libraries and **will not work inside the standard Expo Go client**. You must test with a Custom Dev Client or standalone build:

* **To test locally on an Android device**:
  ```bash
  npm run android
  ```
* **To test locally on an iOS device**:
  ```bash
  npm run ios
  ```
* **To build production binaries for deployment via EAS**:
  ```bash
  eas build --platform all
  ```
