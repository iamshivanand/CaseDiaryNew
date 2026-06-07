import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import GenerateDocumentScreen from "../GenerateDocumentScreen";
import ThemeProvider from "../../../Providers/ThemeProvider";
import LanguageProvider from "../../../Providers/LanguageProvider";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import AsyncStorage from "@react-native-async-storage/async-storage";

// Mock stable navigation and route
const mockNavigate = jest.fn();
const mockNavigationObj = {
  navigate: mockNavigate,
  setOptions: jest.fn(),
  addListener: jest.fn(() => () => {}),
  goBack: jest.fn(),
};

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => mockNavigationObj,
  useRoute: () => ({
    params: { caseId: 1 },
  }),
}));

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
  ...jest.requireActual("../../../DataBase"),
  getCaseById: jest.fn(() => Promise.resolve(mockCaseData)),
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
    const { findAllByText } = renderWithProviders();
    const sectionTitles = await findAllByText("Document Selection");
    expect(sectionTitles.length).toBeGreaterThan(0);
  });

  it("should request rewarded ad before generating PDF document", async () => {
    const { findByText } = renderWithProviders();
    const exportButton = await findByText("Export Legal PDF & Share");

    fireEvent.press(exportButton);

    await waitFor(() => {
      expect(mockShowAd).toHaveBeenCalledWith("rewarded", expect.any(Function));
      expect(Print.printToFileAsync).toHaveBeenCalled();
      expect(Sharing.shareAsync).toHaveBeenCalled();
    });
  });
});
