import { render, fireEvent, waitFor } from "@testing-library/react-native";
import React from "react";

import * as db from "../../../DataBase";
import LanguageProvider from "../../../Providers/LanguageProvider";
import ThemeProvider from "../../../Providers/ThemeProvider";
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
  ...jest.requireActual("../../../DataBase"),
  getCases: jest.fn(() => Promise.resolve(mockCases)),
  getUndatedCases: jest.fn(() => Promise.resolve(mockCases)),
  getCaseById: jest.fn((id) =>
    Promise.resolve(mockCases.find((c) => c.id === id))
  ),
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
  }),
}));

const renderWithProviders = () => {
  return render(
    <ThemeProvider>
      <LanguageProvider>
        <UndatedCasesScreen />
      </LanguageProvider>
    </ThemeProvider>
  );
};

describe("UndatedCasesScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the undated cases header and lists correctly", async () => {
    const { findByText } = renderWithProviders();
    const caseTitle = await findByText("State vs John (Undated)");
    expect(caseTitle).toBeTruthy();
    expect(mockNavigationObj.setOptions).toHaveBeenCalled();
  });

  it("should trigger ad preloading and undated cause list PDF export on Share List press", async () => {
    const { findByText } = renderWithProviders();
    await findByText("State vs John (Undated)");

    expect(mockNavigationObj.setOptions).toHaveBeenCalled();

    const lastCall =
      mockNavigationObj.setOptions.mock.calls[
        mockNavigationObj.setOptions.mock.calls.length - 1
      ][0];
    const HeaderRight = lastCall.headerRight;
    const { getByText } = render(HeaderRight());
    const shareButton = getByText("Share PDF");
    expect(shareButton).toBeTruthy();

    fireEvent.press(shareButton);

    const generatePdfButton = await findByText("Generate PDF");
    expect(generatePdfButton).toBeTruthy();

    fireEvent.press(generatePdfButton);

    await waitFor(() => {
      expect(mockShowAd).toHaveBeenCalledWith("rewarded", expect.any(Function));
      expect(exportUndatedCasesToPdf).toHaveBeenCalled();
    });
  });
});
