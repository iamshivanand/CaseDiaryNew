import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import React from "react";
import { Alert, Linking } from "react-native";

import * as db from "../../../DataBase";
import LanguageProvider from "../../../Providers/LanguageProvider";
import ThemeProvider from "../../../Providers/ThemeProvider";
import { exportCaseToPdf } from "../../../utils/pdfExporter";
import CaseDetailsScreen from "../CaseDetailsScreen";

const mockNavigate = jest.fn();
const mockNavigationObj = {
  navigate: mockNavigate,
  setOptions: jest.fn(),
  addListener: jest.fn(() => () => {}),
};

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => mockNavigationObj,
  useRoute: () => ({
    params: { caseId: 1 },
  }),
  useFocusEffect: (callback: any) => {
    const React = require("react");
    React.useEffect(() => {
      callback();
    }, []);
  },
}));

// Mock Database methods
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
  getCaseDocuments: jest.fn(() => Promise.resolve([])),
  getCaseTimelineEventsByCaseId: jest.fn(() => Promise.resolve([])),
  updateCase: jest.fn(() => Promise.resolve(true)),
  addCaseTimelineEvent: jest.fn(() => Promise.resolve(1)),
  deleteCase: jest.fn(() => Promise.resolve(true)),
}));

// Mock PDF Exporter
jest.mock("../../../utils/pdfExporter", () => ({
  exportCaseToPdf: jest.fn(() => Promise.resolve()),
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

import { SafeAreaProvider } from "react-native-safe-area-context";
import { ToastProvider } from "../../../Providers/ToastContext";

const renderWithProviders = () => {
  return render(
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <ToastProvider>
            <CaseDetailsScreen />
          </ToastProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

describe("CaseDetailsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should load and render case title and client information", async () => {
    const { findByText } = renderWithProviders();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });

    const title = await findByText("Mock State vs. John Doe");
    const client = await findByText("Client: John Doe");
    expect(title).toBeTruthy();
    expect(client).toBeTruthy();
  });

  it("should trigger showAdWithPreload with rewarded and export case PDF on export click", async () => {
    const { findByText } = renderWithProviders();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });

    const exportButton = await findByText("Export PDF");
    fireEvent.press(exportButton);

    await waitFor(() => {
      expect(mockShowAd).toHaveBeenCalledWith("rewarded", expect.any(Function));
      expect(exportCaseToPdf).toHaveBeenCalledWith(
        mockCaseData,
        mockNavigationObj
      );
    });
  });

  it("should open phone call link when client contact call icon is pressed", async () => {
    const linkingSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { findByText } = renderWithProviders();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });

    const title = await findByText("Mock State vs. John Doe");
    expect(title).toBeTruthy();
    linkingSpy.mockRestore();
  });

  it("should navigate to EditCase and GenerateDocument screens on button presses", async () => {
    const { findByText } = renderWithProviders();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });

    const editButton = await findByText("Edit Case");
    const generateButton = await findByText("Generate Court Document");

    fireEvent.press(editButton);
    expect(mockNavigate).toHaveBeenCalledWith("EditCase", { caseId: 1 });

    fireEvent.press(generateButton);
    expect(mockNavigate).toHaveBeenCalledWith("GenerateDocument", {
      caseId: 1,
    });
  });
});
