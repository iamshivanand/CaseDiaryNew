import React from "react";
import { Alert } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import GenerateDocumentScreen from "../GenerateDocumentScreen";
import ThemeProvider from "../../../Providers/ThemeProvider";
import LanguageProvider from "../../../Providers/LanguageProvider";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import AsyncStorage from "@react-native-async-storage/async-storage";

const mockNavigate = jest.fn();
const mockNavigationObj = {
  navigate: mockNavigate,
  setOptions: jest.fn(),
  addListener: jest.fn(() => () => {}),
  goBack: jest.fn(),
};

let mockRouteParams: any = { caseId: 1, templateType: "bail" };

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => mockNavigationObj,
  useRoute: () => ({
    params: mockRouteParams,
  }),
}));

jest.mock("../../../Providers/LanguageProvider", () => {
  const actual = jest.requireActual("../../../Providers/LanguageProvider");
  return {
    __esModule: true,
    ...actual,
    useTranslation: () => ({
      locale: "en",
      t: (key: string) => {
        const trans: Record<string, string> = {
          docgen_sec_case_details: "Case/Client Details",
          docgen_sec_advocate: "Advocate Details",
          docgen_sec_customization: "Customization Details",
          docgen_preparing: "Preparing document...",
        };
        return trans[key] || key;
      },
    }),
  };
});

// Mock Database getCaseById
const mockCaseData = {
  id: "1",
  uniqueId: "mock-unique-id",
  CaseTitle: "Mock State vs. John Doe",
  ClientName: "John Doe",
  ClientContactNumber: "9876543210",
  case_number: "123/2026",
  CNRNumber: "CNR12345",
  court: "District Court",
  caseType: "Civil Suit",
  dateFiled: new Date("2026-01-01"),
};

jest.mock("../../../DataBase", () => ({
  getCaseById: jest.fn(() => Promise.resolve(mockCaseData)),
  getDocumentDrafts: jest.fn(() => Promise.resolve([])),
  saveDocumentDraft: jest.fn(() => Promise.resolve(1)),
  getDocumentDraftById: jest.fn(() => Promise.resolve(null)),
  getDb: jest.fn(() => Promise.resolve({})),
}));

// Mock AdManager statically
const mockShowAd = jest.fn((adType, onComplete) => {
  onComplete(true);
});

jest.mock("../../CommonComponents/AdManager", () => ({
  AdProvider: ({ children }: any) => children,
  useAdTrigger: () => ({
    showAdWithPreload: mockShowAd,
  }),
}));

jest.setTimeout(30000);

const renderWithProviders = () => {
  return render(
    <ThemeProvider>
      <LanguageProvider>
        <GenerateDocumentScreen />
      </LanguageProvider>
    </ThemeProvider>
  );
};

describe("GenerateDocumentScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(AsyncStorage, "getItem").mockImplementation((key) => {
      if (key === "@advocate_name") return Promise.resolve("Test Advocate");
      return Promise.resolve(null);
    });
  });

  it("should render client details and document type selection options", async () => {
    mockRouteParams = { caseId: undefined, templateType: "bail" };
    const { findAllByText, queryByText } = renderWithProviders();
    
    // Wait for the loading indicator to disappear
    await waitFor(() => {
      expect(queryByText("Preparing document...")).toBeNull();
    }, { timeout: 15000 });

    const sectionTitles = await findAllByText("Case/Client Details");
    expect(sectionTitles.length).toBeGreaterThan(0);
  }, 30000);

  it("should request rewarded ad before generating PDF document", async () => {
    // Mock Alert.alert to auto-trigger the "Share PDF" option
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((title, message, buttons) => {
      const shareBtn = buttons?.find((btn) => btn.text === "Share PDF" || btn.text === "Share");
      if (shareBtn && shareBtn.onPress) {
        shareBtn.onPress();
      }
    });

    mockRouteParams = { caseId: 1, templateType: "bail" };
    const { findByText, queryByText } = renderWithProviders();

    // Wait for the loading indicator to disappear
    await waitFor(() => {
      expect(queryByText("Preparing document...")).toBeNull();
    }, { timeout: 15000 });

    const exportButton = await findByText("Quick PDF Export");

    fireEvent.press(exportButton);

    await waitFor(() => {
      expect(mockShowAd).toHaveBeenCalledWith("rewarded", expect.any(Function));
      expect(Print.printToFileAsync).toHaveBeenCalled();
      expect(Sharing.shareAsync).toHaveBeenCalled();
    }, { timeout: 15000 });

    alertSpy.mockRestore();
  }, 30000);
});
