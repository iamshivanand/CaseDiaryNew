import { NavigationContainerRef } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { snoozeNotification } from "./notificationScheduler";

export interface NotificationPayloadData {
  caseId?: number | string;
  type?: string;
  date?: string;
  count?: number;
  pendingAmount?: number;
  [key: string]: any;
}

/**
 * Robust notification deep link dispatcher.
 * Handles background clicks, cold-boot launches, in-app toast taps, and action buttons.
 */
export async function handleNotificationDeepLink(
  navigationRef: NavigationContainerRef<any> | null,
  data?: NotificationPayloadData | null,
  actionId?: string,
  rawNotificationContent?: Notifications.NotificationContent
): Promise<boolean> {
  try {
    if (!navigationRef || !navigationRef.isReady()) {
      console.warn("Deep link skipped: NavigationContainer is not ready yet.");
      return false;
    }

    // 1. Handle Background/Lockscreen Snooze Actions
    if (actionId === "SNOOZE_1H" || actionId === "SNOOZE_3H") {
      const minutes = actionId === "SNOOZE_3H" ? 180 : 60;
      await snoozeNotification(
        rawNotificationContent?.title || "Hearing Reminder",
        rawNotificationContent?.body || "",
        data,
        minutes
      );
      return true;
    }

    // 2. Handle 1-Tap Reschedule Lockscreen Action
    if (actionId === "RESCHEDULE" && data?.caseId) {
      navigationRef.navigate("App", {
        screen: "MainApp",
        params: {
          screen: "Home",
          params: {
            screen: "CaseDetails",
            params: {
              caseId: Number(data.caseId),
              autoOpenHearingModal: true,
            },
          },
        },
      });
      return true;
    }

    // 3. Handle 1-Tap Open Cause List Lockscreen Action
    if (actionId === "OPEN_CAUSE_LIST") {
      navigationRef.navigate("App", {
        screen: "MainApp",
        params: {
          screen: "Home",
          params: {
            screen: "HomeScreen",
          },
        },
      });
      return true;
    }

    // 4. Handle Case-specific Notifications (Fee Reminder, Limitation Alert, Single Hearing)
    if (data?.caseId) {
      navigationRef.navigate("App", {
        screen: "MainApp",
        params: {
          screen: "Home",
          params: {
            screen: "CaseDetails",
            params: {
              caseId: Number(data.caseId),
            },
          },
        },
      });
      return true;
    }

    // 5. Handle Overdue Hearings Alert
    if (data?.type === "overdue_hearings_alert") {
      navigationRef.navigate("App", {
        screen: "MainApp",
        params: {
          screen: "Home",
          params: {
            screen: "AllCases",
            params: {
              Filter: "overdue",
            },
          },
        },
      });
      return true;
    }

    // 6. Handle Morning Briefings, Weekly Digests & Daily Cause Lists
    if (
      data?.type === "morning_briefing" ||
      data?.type === "hearing_summary" ||
      data?.type === "weekly_briefing"
    ) {
      navigationRef.navigate("App", {
        screen: "MainApp",
        params: {
          screen: "Home",
          params: {
            screen: "HomeScreen",
          },
        },
      });
      return true;
    }

    // 7. Handle Evening Previews (Next Day Calendar Schedule)
    if (data?.type === "evening_preview") {
      navigationRef.navigate("App", {
        screen: "MainApp",
        params: {
          screen: "Calendar",
        },
      });
      return true;
    }

    return false;
  } catch (err) {
    console.warn("Error executing notification deep link:", err);
    return false;
  }
}

/**
 * Checks if the app was opened from a cold-start by tapping a push notification
 * and routes the user directly to the target destination.
 */
export async function processInitialNotificationResponse(
  navigationRef: NavigationContainerRef<any> | null
): Promise<boolean> {
  try {
    const lastResponse = await Notifications.getLastNotificationResponseAsync();
    if (!lastResponse) return false;

    const actionId = lastResponse.actionIdentifier;
    const content = lastResponse.notification.request.content;
    const data = content.data as NotificationPayloadData;

    return await handleNotificationDeepLink(
      navigationRef,
      data,
      actionId,
      content
    );
  } catch (err) {
    console.warn("Failed to check last notification response on cold start:", err);
    return false;
  }
}
