# eCourts Client-Side Case Importer

Implement a client-side scraping workflow to allow advocates to import case details directly from the public eCourts Services portal. Advocates enter a search keyword or CNR number, manually solve the CAPTCHA prompted by the eCourts portal inside an overlay WebView, and the app automatically parses the details and pre-fills the case registration form.

## User Review Required

> [!WARNING]
> **Dependency Installation Required**
> We must run `npx expo install react-native-webview` to install the compatible WebView component. This will modify `package.json` and `app.json` (if automated).
> Since this is a native library, for Expo Go it will work immediately in Expo SDK 51, but if you are running custom dev clients, you might need a rebuild.

## Open Questions

- **Review and Consent**: To address the user's feedback, the imported data will *only* pre-fill the Formik form fields in `AddCase.tsx`. It will **not** be saved directly to the database automatically. The advocate has full visibility to review, edit, or discard the imported details, and the case will only be saved to the local database when they manually press the "Save Case" button at the bottom of the form.

---

## Proposed Changes

### Dependency Configuration

#### [MODIFY] [package.json](file:///e:/Projects/2026/CaseDiaryNew/package.json)
- Add `"react-native-webview": "13.8.6"` (or compatible Expo SDK 51 version) to `dependencies`.

---

### Core Components

#### [NEW] [ECourtsImportModal.tsx](file:///e:/Projects/2026/CaseDiaryNew/Screens/Addcase/components/ECourtsImportModal.tsx)
- Create a reusable React Native modal overlay.
- Render `<WebView>` pointing to the eCourts search services page (`https://services.ecourts.gov.in/ecourts_v2/`).
- Embed `injectedJavaScript` to interact with and parse case tables.
- Handle `onMessage` to receive the scraped JSON data (CNRNumber, Case Title, Parties, Next Date, Case Type, Court Name) and callback to the parent form.

#### [NEW] [ecourtsParser.ts](file:///e:/Projects/2026/CaseDiaryNew/utils/ecourtsParser.ts)
- Create a utility script to contain the Javascript scraper injection string.
- Provide helper mappings to convert eCourts values into clean local CaseDiary schema options (e.g. converting date formats to `YYYY-MM-DD`).

#### [MODIFY] [AddCase.tsx](file:///e:/Projects/2026/CaseDiaryNew/Screens/Addcase/AddCase.tsx)
- Add a new "Import Case from eCourts" button at the top of the scroll container.
- Include the `ECourtsImportModal` in the render tree.
- When data is received, update Formik values dynamically using `setFieldValue` for:
  - `CaseTitle`
  - `CNRNumber`
  - `case_number`
  - `FirstParty`
  - `OppositeParty`
  - `HearingDate` (mapped to `NextDate`)

---

## Verification Plan

### Automated Tests
- Run `npm run test` to verify that existing test suites are not broken.
- Create unit tests in `Screens/Addcase/__tests__/AddCase.test.tsx` (or new component tests) to mock and verify modal triggering.

### Manual Verification
- Launch the application, click "Add New Case", click "Import from eCourts", verify that the eCourts webview loads, input a query, solve the CAPTCHA, and ensure fields are populated upon success.
