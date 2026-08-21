import * as Notifications from "expo-notifications";
import {
  handleNotificationDeepLink,
  processInitialNotificationResponse,
} from "../deepLinkHandler";
import * as scheduler from "../notificationScheduler";

jest.mock("../notificationScheduler", () => ({
  snoozeNotification: jest.fn(() => Promise.resolve()),
}));

describe("deepLinkHandler", () => {
  let mockNavigationRef: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigationRef = {
      isReady: jest.fn(() => true),
      navigate: jest.fn(),
    };
  });

  it("should return false if navigation is not ready", async () => {
    mockNavigationRef.isReady.mockReturnValue(false);
    const result = await handleNotificationDeepLink(mockNavigationRef, {
      caseId: 10,
    });
    expect(result).toBe(false);
    expect(mockNavigationRef.navigate).not.toHaveBeenCalled();
  });

  it("should handle snooze action", async () => {
    const result = await handleNotificationDeepLink(
      mockNavigationRef,
      { caseId: 5 },
      "SNOOZE_1H",
      { title: "Test", body: "Hearing soon" } as any
    );
    expect(result).toBe(true);
    expect(scheduler.snoozeNotification).toHaveBeenCalledWith(
      "Test",
      "Hearing soon",
      { caseId: 5 },
      60
    );
  });

  it("should handle reschedule action", async () => {
    const result = await handleNotificationDeepLink(
      mockNavigationRef,
      { caseId: 42 },
      "RESCHEDULE"
    );
    expect(result).toBe(true);
    expect(mockNavigationRef.navigate).toHaveBeenCalledWith("App", {
      screen: "MainApp",
      params: {
        screen: "Home",
        params: {
          screen: "CaseDetails",
          params: { caseId: 42, autoOpenHearingModal: true },
        },
      },
    });
  });

  it("should handle OPEN_CAUSE_LIST action", async () => {
    const result = await handleNotificationDeepLink(
      mockNavigationRef,
      {},
      "OPEN_CAUSE_LIST"
    );
    expect(result).toBe(true);
    expect(mockNavigationRef.navigate).toHaveBeenCalledWith("App", {
      screen: "MainApp",
      params: {
        screen: "Home",
        params: { screen: "HomeScreen" },
      },
    });
  });

  it("should handle caseId deep link (single hearing, fee reminder, limitation alert)", async () => {
    const result = await handleNotificationDeepLink(mockNavigationRef, {
      caseId: 99,
      type: "fee_reminder",
    });
    expect(result).toBe(true);
    expect(mockNavigationRef.navigate).toHaveBeenCalledWith("App", {
      screen: "MainApp",
      params: {
        screen: "Home",
        params: {
          screen: "CaseDetails",
          params: { caseId: 99 },
        },
      },
    });
  });

  it("should handle overdue_hearings_alert deep link", async () => {
    const result = await handleNotificationDeepLink(mockNavigationRef, {
      type: "overdue_hearings_alert",
      count: 4,
    });
    expect(result).toBe(true);
    expect(mockNavigationRef.navigate).toHaveBeenCalledWith("App", {
      screen: "MainApp",
      params: {
        screen: "Home",
        params: {
          screen: "AllCases",
          params: { Filter: "overdue" },
        },
      },
    });
  });

  it("should handle morning briefing / weekly briefing deep link", async () => {
    const result = await handleNotificationDeepLink(mockNavigationRef, {
      type: "weekly_briefing",
    });
    expect(result).toBe(true);
    expect(mockNavigationRef.navigate).toHaveBeenCalledWith("App", {
      screen: "MainApp",
      params: {
        screen: "Home",
        params: { screen: "HomeScreen" },
      },
    });
  });

  it("should handle evening preview deep link", async () => {
    const result = await handleNotificationDeepLink(mockNavigationRef, {
      type: "evening_preview",
    });
    expect(result).toBe(true);
    expect(mockNavigationRef.navigate).toHaveBeenCalledWith("App", {
      screen: "MainApp",
      params: {
        screen: "Calendar",
      },
    });
  });

  it("should process cold start notification if one exists", async () => {
    jest
      .spyOn(Notifications, "getLastNotificationResponseAsync")
      .mockResolvedValueOnce({
        actionIdentifier: "DEFAULT",
        notification: {
          request: {
            content: {
              title: "Fee Reminder",
              body: "Pending fee balance",
              data: { caseId: 101, type: "fee_reminder" },
            },
          },
        },
      } as any);

    const result = await processInitialNotificationResponse(mockNavigationRef);
    expect(result).toBe(true);
    expect(mockNavigationRef.navigate).toHaveBeenCalledWith("App", {
      screen: "MainApp",
      params: {
        screen: "Home",
        params: {
          screen: "CaseDetails",
          params: { caseId: 101 },
        },
      },
    });
  });

  it("should return false on cold start if no last notification response", async () => {
    jest
      .spyOn(Notifications, "getLastNotificationResponseAsync")
      .mockResolvedValueOnce(null);

    const result = await processInitialNotificationResponse(mockNavigationRef);
    expect(result).toBe(false);
  });
});
