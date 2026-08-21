import { render, fireEvent, waitFor } from "@testing-library/react-native";
import React from "react";

import * as notifDb from "../../../DataBase/appNotificationsDb";
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
    created_at: "2026-08-19T08:00:00.000Z",
  },
  {
    id: 2,
    title: "Fee Payment Received",
    body: "Case: State vs Sharma - ₹5000",
    category: "fee",
    case_id: 101,
    action_type: "total_fee_payment",
    is_read: 1,
    created_at: "2026-08-18T10:00:00.000Z",
  },
];

describe("NotificationInboxScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(notifDb, "getAppNotifications")
      .mockResolvedValue(mockNotifications);
    jest
      .spyOn(notifDb, "markAppNotificationAsRead")
      .mockResolvedValue(true);
    jest
      .spyOn(notifDb, "markAllAppNotificationsAsRead")
      .mockResolvedValue(true);
    jest.spyOn(notifDb, "deleteAppNotification").mockResolvedValue(true);
  });

  const renderComponent = () =>
    render(
      <ThemeProvider>
        <NotificationInboxScreen />
      </ThemeProvider>
    );

  it("renders notification items properly", async () => {
    const { getByText } = renderComponent();

    await waitFor(() => {
      expect(getByText("Notifications & Alerts")).toBeTruthy();
      expect(
        getByText("Hearing Tomorrow: State vs Sharma")
      ).toBeTruthy();
      expect(getByText("Fee Payment Received")).toBeTruthy();
    });
  });

  it("filters by category tabs", async () => {
    const { getByText, queryByText } = renderComponent();

    await waitFor(() => {
      expect(
        getByText("Hearing Tomorrow: State vs Sharma")
      ).toBeTruthy();
    });

    // Tap 'Fees' tab
    const feesTab = getByText("Fees (1)");
    fireEvent.press(feesTab);

    await waitFor(() => {
      expect(getByText("Fee Payment Received")).toBeTruthy();
      expect(
        queryByText("Hearing Tomorrow: State vs Sharma")
      ).toBeNull();
    });
  });

  it("navigates to CaseDetails on tapping View Case", async () => {
    const { getAllByText } = renderComponent();

    await waitFor(() => {
      const viewCaseBtns = getAllByText("View Case");
      expect(viewCaseBtns.length).toBeGreaterThan(0);
      fireEvent.press(viewCaseBtns[0]);
    });

    expect(mockNavigate).toHaveBeenCalledWith("CaseDetails", {
      caseId: 101,
    });
  });

  it("marks all notifications as read when clicking Mark Read", async () => {
    const { getByText } = renderComponent();

    await waitFor(() => {
      const markReadBtn = getByText("Mark Read");
      fireEvent.press(markReadBtn);
    });

    expect(notifDb.markAllAppNotificationsAsRead).toHaveBeenCalled();
  });
});
