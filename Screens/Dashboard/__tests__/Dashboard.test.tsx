import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import Dashboard from "../Dashboard";
import ThemeProvider from "../../../Providers/ThemeProvider";
import LanguageProvider from "../../../Providers/LanguageProvider";
import * as db from "../../../DataBase";
import { exportDailyCauseListToPdf } from "../../../utils/pdfExporter";

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

const getMockDateStr = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Mock Database methods
const mockCases = [
  {
    id: 1,
    uniqueId: "case-1",
    CaseTitle: "State vs John",
    ClientName: "John",
    NextDate: getMockDateStr(), // Today's case
  },
];

jest.mock("../../../DataBase", () => ({
  ...jest.requireActual("../../../DataBase"),
  getCases: jest.fn(() => Promise.resolve(mockCases)),
  getUserProfile: jest.fn(() => Promise.resolve({ id: 1, name: "Test Advocate" })),
}));

// Mock PDF Exporter
jest.mock("../../../utils/pdfExporter", () => ({
  exportDailyCauseListToPdf: jest.fn(() => Promise.resolve()),
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
        <Dashboard />
      </LanguageProvider>
    </ThemeProvider>
  );
};

describe("DashboardScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render welcome greetings, quick actions list, and metrics section", async () => {
    const { findByText } = renderWithProviders();
    const actionsTitle = await findByText("Quick Actions");
    const todayCasesTitle = await findByText("Today's Cases");
    expect(actionsTitle).toBeTruthy();
    expect(todayCasesTitle).toBeTruthy();
  });

  it("should trigger ad preloading and daily cause list compilation on Share List click", async () => {
    const { findByText } = renderWithProviders();
    const shareButton = await findByText("Share List");

    fireEvent.press(shareButton);

    await waitFor(() => {
      expect(mockShowAd).toHaveBeenCalledWith("rewarded", expect.any(Function));
      expect(exportDailyCauseListToPdf).toHaveBeenCalled();
    });
  });

  it("should navigate to AddCase screen when Add New Case quick action is pressed", async () => {
    const { findByText } = renderWithProviders();
    const addCaseAction = await findByText("Add New Case");

    fireEvent.press(addCaseAction);

    expect(mockNavigate).toHaveBeenCalledWith("AddCase");
  });
});
