import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import * as appNotificationsDb from "../../../DataBase/appNotificationsDb";
import ThemeProvider from "../../../Providers/ThemeProvider";
import NotificationInboxScreen from "../NotificationInboxScreen";

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    addListener: jest.fn(() => () => {}),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

const mockNotifications = [
  {
    id: 1,
    title: "Hearing Tomorrow: State vs Sharma",
    body: "Court: High Court • Client: Sharma",
    category: "hearing",
    case_id: 101,
    action_type: "hearing_scheduled",
    is_read: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Fee Payment Received",
    body: "Case: State vs Sharma - ₹5000",
    category: "fee",
    case_id: 101,
    action_type: "total_fee_payment",
    is_read: 1,
    created_at: new Date().toISOString(),
  },
];

jest.mock("../../../DataBase", () => ({
  getUpcomingHearingsWithPendingFee: jest.fn(() => Promise.resolve([])),
}));

jest.mock("../../../DataBase/appNotificationsDb", () => ({
  getAppNotifications: jest.fn(() => Promise.resolve(mockNotifications)),
  markAppNotificationAsRead: jest.fn(() => Promise.resolve()),
  markAllAppNotificationsAsRead: jest.fn(() => Promise.resolve()),
  deleteAppNotification: jest.fn(() => Promise.resolve()),
  clearAllAppNotifications: jest.fn(() => Promise.resolve()),
}));

describe("NotificationInboxScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (appNotificationsDb.getAppNotifications as jest.Mock).mockResolvedValue(
      mockNotifications
    );
  });

  const renderComponent = () =>
    render(
      <SafeAreaProvider>
        <ThemeProvider>
          <NotificationInboxScreen />
        </ThemeProvider>
      </SafeAreaProvider>
    );

  it("renders notification items properly", async () => {
    const { findByText, getByText } = renderComponent();

    await act(async () => {
      await new Promise((r) => setTimeout(r, 200));
    });

    expect(getByText("Hearing Tomorrow: State vs Sharma")).toBeTruthy();
    expect(getByText("Fee Payment Received")).toBeTruthy();
  });

  it("filters by category tabs", async () => {
    const { findByText, queryByText } = renderComponent();

    await act(async () => {
      await new Promise((r) => setTimeout(r, 200));
    });

    const hearingItem = await findByText("Hearing Tomorrow: State vs Sharma");
    expect(hearingItem).toBeTruthy();

    // Tap 'Fees' tab
    const feesTab = await findByText("Fees (1)");
    fireEvent.press(feesTab);

    const feeItem = await findByText("Fee Payment Received");
    expect(feeItem).toBeTruthy();
    expect(queryByText("Hearing Tomorrow: State vs Sharma")).toBeNull();
  });

  it("navigates to CaseDetails on tapping View Case", async () => {
    const { findAllByText } = renderComponent();

    await act(async () => {
      await new Promise((r) => setTimeout(r, 200));
    });

    const viewCaseBtns = await findAllByText("View Case");
    expect(viewCaseBtns.length).toBeGreaterThan(0);
    fireEvent.press(viewCaseBtns[0]);

    expect(mockNavigate).toHaveBeenCalledWith("CaseDetails", { caseId: 101 });
  });

  it("marks all notifications as read when clicking Mark Read", async () => {
    const { findByText } = renderComponent();

    await act(async () => {
      await new Promise((r) => setTimeout(r, 200));
    });

    const markReadBtn = await findByText("Mark Read");
    fireEvent.press(markReadBtn);
  });
});
