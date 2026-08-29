import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import * as db from "../../../DataBase";
import LanguageProvider from "../../../Providers/LanguageProvider";
import ThemeProvider from "../../../Providers/ThemeProvider";
import { ToastProvider } from "../../../Providers/ToastContext";
import { exportDailyCauseListToPdf } from "../../../utils/pdfExporter";
import Dashboard from "../Dashboard";

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
  getDb: jest.fn(() =>
    Promise.resolve({
      getAllAsync: jest.fn(() => Promise.resolve([])),
      getFirstAsync: jest.fn(() => Promise.resolve(null)),
      runAsync: jest.fn(() => Promise.resolve({ changes: 0 })),
    })
  ),
  getCases: jest.fn(() => Promise.resolve(mockCases)),
  getYesterdaysCasesCount: jest.fn(() => Promise.resolve(0)),
  getUndatedCasesCount: jest.fn(() => Promise.resolve(0)),
  getExpiringLimitationCases: jest.fn(() => Promise.resolve([])),
  getUpcomingHearingsWithPendingFee: jest.fn(() => Promise.resolve([])),
  getOverdueCasesCount: jest.fn(() => Promise.resolve(0)),
  getUserProfile: jest.fn(() =>
    Promise.resolve({ id: 1, name: "Test Advocate" })
  ),
}));

// Mock AppNotifications DB
jest.mock("../../../DataBase/appNotificationsDb", () => ({
  getUnreadAppNotificationsCount: jest.fn(() => Promise.resolve(0)),
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
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <ToastProvider>
            <Dashboard />
          </ToastProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

describe("DashboardScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (db.getCases as jest.Mock).mockResolvedValue(mockCases);
    (db.getYesterdaysCasesCount as jest.Mock).mockResolvedValue(0);
    (db.getUndatedCasesCount as jest.Mock).mockResolvedValue(0);
  });

  it("should render welcome greetings, quick actions list, and metrics section", async () => {
    const { findByText } = renderWithProviders();
    const actionsTitle = await findByText(
      "Quick Actions",
      {},
      { timeout: 15000 }
    );
    const todayCasesTitle = await findByText(
      "Today's Cases",
      {},
      { timeout: 15000 }
    );
    expect(actionsTitle).toBeTruthy();
    expect(todayCasesTitle).toBeTruthy();
  }, 20000);

  it("should open customizer modal and compile daily cause list on confirmation", async () => {
    const { findByText, findByTestId } = renderWithProviders();

    await act(async () => {
      await new Promise((r) => setTimeout(r, 200));
    });

    // Wait for today's case to load and render
    await findByText("State vs John", {}, { timeout: 15000 });

    const shareButton = await findByTestId("share-today-list-btn");
    fireEvent.press(shareButton);

    const generatePdfButton = await findByText(
      "Generate PDF",
      {},
      { timeout: 15000 }
    );
    expect(generatePdfButton).toBeTruthy();

    fireEvent.press(generatePdfButton);

    await waitFor(() => {
      expect(mockShowAd).toHaveBeenCalledWith("rewarded", expect.any(Function));
      expect(exportDailyCauseListToPdf).toHaveBeenCalled();
    });
  }, 20000);

  it("should navigate to AddCase screen when Add New Case quick action is pressed", async () => {
    const { findByText } = renderWithProviders();
    const addCaseAction = await findByText(
      "Add New Case",
      {},
      { timeout: 15000 }
    );

    fireEvent.press(addCaseAction);

    expect(mockNavigate).toHaveBeenCalledWith("AddCase");
  }, 20000);
});
