import AsyncStorage from "@react-native-async-storage/async-storage";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React from "react";
import { Alert } from "react-native";

import LanguageProvider from "../../../Providers/LanguageProvider";
import ThemeProvider from "../../../Providers/ThemeProvider";
import GenerateDocumentScreen from "../GenerateDocumentScreen";

jest.mock("expo-speech-recognition", () => ({
  ExpoSpeechRecognitionModule: {
    requestPermissionsAsync: jest
      .fn()
      .mockResolvedValue({ status: "granted", granted: true }),
    getStateAsync: jest.fn().mockResolvedValue("inactive"),
    start: jest.fn(),
    stop: jest.fn(),
    abort: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  useSpeechRecognitionEvent: jest.fn(),
}));

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

  it("should render template cards and library options", async () => {
    mockRouteParams = { caseId: undefined, templateType: "" };
    const { findByText } = renderWithProviders();

    const blankTemplate = await findByText("Blank Canvas (Start from Scratch)");
    const bailTemplate = await findByText("Bail Application (Sec 439)");

    expect(blankTemplate).toBeTruthy();
    expect(bailTemplate).toBeTruthy();
  });

  it("should navigate to TiptapEditDraft on template selection", async () => {
    mockRouteParams = { caseId: 1, templateType: "" };
    const { findByText } = renderWithProviders();

    const bailTemplate = await findByText("Bail Application (Sec 439)");
    fireEvent.press(bailTemplate);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        "TiptapEditDraft",
        expect.objectContaining({
          caseId: 1,
          templateType: "bail",
        })
      );
    });
  });
});
