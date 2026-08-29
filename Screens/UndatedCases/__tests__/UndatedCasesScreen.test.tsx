import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import * as db from "../../../DataBase";
import LanguageProvider from "../../../Providers/LanguageProvider";
import ThemeProvider from "../../../Providers/ThemeProvider";
import { ToastProvider } from "../../../Providers/ToastContext";
import dbCacheManager from "../../../utils/dbCacheManager";
import { exportUndatedCasesToPdf } from "../../../utils/pdfExporter";
import UndatedCasesScreen from "../UndatedCasesScreen";

// Mock stable navigation and route
const mockNavigate = jest.fn();
const mockNavigationObj = {
  navigate: mockNavigate,
  setOptions: jest.fn(),
  addListener: jest.fn(() => () => {}),
};

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => mockNavigationObj,
  useFocusEffect: (callback: any) => {
    const React = require("react");
    React.useEffect(() => {
      callback();
    }, []);
  },
}));

// Mock Database methods
const mockCases = [
  {
    id: 1,
    uniqueId: "case-1",
    CaseTitle: "State vs John (Undated)",
    ClientName: "John",
    NextDate: null, // Undated case
    CaseStatus: "Pending",
    Priority: "High",
  },
];

jest.mock("../../../DataBase", () => ({
  getCases: jest.fn(() => Promise.resolve(mockCases)),
  getUndatedCases: jest.fn(() => Promise.resolve(mockCases)),
  getCaseById: jest.fn((id) =>
    Promise.resolve(mockCases.find((c) => c.id === id))
  ),
  getDb: jest.fn(() => Promise.resolve({})),
}));

// Mock PDF Exporter
jest.mock("../../../utils/pdfExporter", () => ({
  exportUndatedCasesToPdf: jest.fn(() => Promise.resolve()),
}));

// Mock AdManager statically
const mockShowAd = jest.fn((adType, onComplete) => {
  onComplete(true);
});

jest.mock("../../CommonComponents/AdManager", () => ({
  AdProvider: ({ children }: any) => children,
  useAdTrigger: () => ({
    showAdWithPreload: mockShowAd,
    recordCaseUpdateMilestone: jest.fn((cb) => {
      if (cb) cb(true);
    }),
  }),
}));

const renderWithProviders = () => {
  return render(
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <ToastProvider>
            <UndatedCasesScreen />
          </ToastProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

describe("UndatedCasesScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    dbCacheManager.resetForTesting();
  });

  it("should render the undated cases header and lists correctly", async () => {
    const { findByText } = renderWithProviders();
    await waitFor(() => {
      expect(db.getUndatedCases).toHaveBeenCalled();
    });
    const caseTitle = await findByText("State vs John (Undated)");
    expect(caseTitle).toBeTruthy();
    expect(mockNavigationObj.setOptions).toHaveBeenCalled();
  });

  it("should trigger ad preloading and undated cause list PDF export on Share List press", async () => {
    const { findByText } = renderWithProviders();
    await waitFor(() => {
      expect(db.getUndatedCases).toHaveBeenCalled();
    });
    const caseTitle = await findByText("State vs John (Undated)");
    expect(caseTitle).toBeTruthy();

    expect(mockNavigationObj.setOptions).toHaveBeenCalled();

    const lastCall =
      mockNavigationObj.setOptions.mock.calls[
        mockNavigationObj.setOptions.mock.calls.length - 1
      ][0];
    const HeaderRight = lastCall.headerRight;
    const headerElement = HeaderRight();
    await act(async () => {
      headerElement.props.onPress();
    });

    const generatePdfButton = await findByText("Generate PDF");
    expect(generatePdfButton).toBeTruthy();

    await act(async () => {
      fireEvent.press(generatePdfButton);
    });

    await waitFor(() => {
      expect(mockShowAd).toHaveBeenCalledWith("rewarded", expect.any(Function));
      expect(exportUndatedCasesToPdf).toHaveBeenCalled();
    });
  });
});
