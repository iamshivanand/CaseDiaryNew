import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

import { CaseWithDetails } from "../DataBase";
import { getDb } from "../DataBase/connection";

// Configure how notifications should behave when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Schedules a local reminder notification for a case's next hearing.
 * The reminder is scheduled based on user preferences stored in AsyncStorage.
 *
 * @param caseData Detailed case information
 */
export const scheduleCaseReminder = async (
  caseData: CaseWithDetails
): Promise<string | null> => {
  if (!caseData.NextDate) return null;

  try {
    // 1. Request notification permissions
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Notification permissions not granted.");
      return null;
    }

    // 2. Cancel any existing notification for this case first
    await cancelCaseReminder(caseData.id);

    // Read preferences from AsyncStorage
    const enabledVal = await AsyncStorage.getItem("@notification_enabled");
    if (enabledVal === "false") {
      return null; // Notifications are disabled by user
    }

    const daysBeforeVal = await AsyncStorage.getItem(
      "@notification_days_before"
    );
    const daysBefore = daysBeforeVal !== null ? parseInt(daysBeforeVal, 10) : 1; // Default: 1 day before

    const hourVal = await AsyncStorage.getItem("@notification_hour");
    const hour = hourVal !== null ? parseInt(hourVal, 10) : 19; // Default: 7:00 PM (19)

    const minuteVal = await AsyncStorage.getItem("@notification_minute");
    const minute = minuteVal !== null ? parseInt(minuteVal, 10) : 0; // Default: 0

    // 3. Compute target alert date
    const [year, month, day] = caseData.NextDate.split("-").map(Number);
    const hearingDate = new Date(year, month - 1, day); // local midnight
    const reminderDate = new Date(hearingDate);
    reminderDate.setDate(hearingDate.getDate() - daysBefore);
    reminderDate.setHours(hour, minute, 0, 0);

    // If the computed reminder time is in the past, don't schedule it
    if (reminderDate.getTime() <= Date.now()) {
      return null;
    }

    let alertTitle = `Hearing Tomorrow: ${caseData.CaseTitle || "Legal Case"}`;
    if (daysBefore === 0) {
      alertTitle = `Hearing Today: ${caseData.CaseTitle || "Legal Case"}`;
    } else if (daysBefore > 1) {
      alertTitle = `Hearing in ${daysBefore} Days: ${caseData.CaseTitle || "Legal Case"}`;
    }

    // 4. Schedule notification
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: alertTitle,
        body: `Client: ${caseData.ClientName || "N/A"}\nCourt: ${caseData.court_name || "N/A"}`,
        data: { caseId: caseData.id },
      },
      trigger: {
        date: reminderDate,
      },
    });

    return identifier;
  } catch (error) {
    console.error("Failed to schedule case reminder:", error);
    return null;
  }
};

/**
 * Cancels all scheduled reminders associated with a case ID.
 *
 * @param caseId The SQLite case ID number
 */
export const cancelCaseReminder = async (caseId: number): Promise<void> => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      const data = notification.content.data;
      if (data && data.caseId === caseId) {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier
        );
      }
    }
  } catch (error) {
    console.error(
      `Failed to cancel notifications for case ID ${caseId}:`,
      error
    );
  }
};

/**
 * Reschedules reminder notifications for all active upcoming cases.
 * Typically called when notification settings are updated.
 */
export const reScheduleAllNotifications = async (): Promise<void> => {
  try {
    const db = await getDb();
    const todayStr = new Date().toISOString().split("T")[0];
    const cases = await db.getAllAsync<any>(
      "SELECT * FROM Cases WHERE NextDate IS NOT NULL AND NextDate >= ? AND (CaseStatus IS NULL OR CaseStatus != 'Closed')",
      [todayStr]
    );
    console.log(`Rescheduling notifications for ${cases.length} cases.`);
    for (const caseRow of cases) {
      await scheduleCaseReminder(caseRow);
    }
  } catch (error) {
    console.error("Failed to reschedule all notifications:", error);
  }
};

export const scheduleOverdueHearingNotification = async (
  caseData: CaseWithDetails
): Promise<string | null> => {
  if (!caseData.NextDate) return null;

  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    const enabledVal = await AsyncStorage.getItem("@notification_enabled");
    if (enabledVal === "false") {
      return null;
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: `⚠️ Pending Action: ${caseData.CaseTitle || "Legal Case"}`,
        body: `Hearing date (${caseData.NextDate}) has passed. Tap to update hearing proceedings or send a fee reminder to your client.`,
        data: { caseId: caseData.id, type: "overdue_hearing" },
      },
      trigger: null, // trigger immediately
    });

    return identifier;
  } catch (error) {
    console.error("Failed to trigger overdue notification:", error);
    return null;
  }
};

/**
 * Schedules 3 multi-interval engagement push notifications every day:
 * 1. Morning Briefing (8:00 AM) - Today's hearings count
 * 2. Afternoon Digest (2:00 PM) - Pending fee balances & outcome updates
 * 3. Evening Prep (7:00 PM) - Undated cases & tomorrow preview
 */
export const scheduleDailyMultiIntervalNotifications =
  async (): Promise<void> => {
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") return;

      const enabledVal = await AsyncStorage.getItem("@notification_enabled");
      if (enabledVal === "false") return;

      const db = await getDb();
      const todayStr = new Date().toISOString().split("T")[0];

      const todayCases = await db.getAllAsync<any>(
        "SELECT * FROM Cases WHERE NextDate = ? AND (CaseStatus IS NULL OR CaseStatus != 'Closed')",
        [todayStr]
      );

      const pendingFeeCases = await db.getAllAsync<any>(
        "SELECT * FROM Cases WHERE (total_fee > fee_paid OR (date_fee > 0 AND (date_fee_collected < date_fee OR date_fee_paid = 0))) AND (CaseStatus IS NULL OR CaseStatus != 'Closed')",
        []
      );

      const undatedCases = await db.getAllAsync<any>(
        "SELECT * FROM Cases WHERE (NextDate IS NULL OR NextDate = '' OR NextDate = 'N/A') AND (CaseStatus IS NULL OR CaseStatus != 'Closed')",
        []
      );

      const morningDate = new Date();
      morningDate.setHours(8, 0, 0, 0);
      if (morningDate.getTime() > Date.now()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `🌅 Good Morning Advocate!`,
            body: `You have ${todayCases.length} hearing${todayCases.length === 1 ? "" : "s"} scheduled today. Tap to view your daily court diary.`,
            data: { type: "morning_briefing" },
          },
          trigger: { date: morningDate },
        });
      }

      const afternoonDate = new Date();
      afternoonDate.setHours(14, 0, 0, 0);
      if (afternoonDate.getTime() > Date.now()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `☀️ Afternoon Fee & Outcome Digest`,
            body: `${pendingFeeCases.length} case${pendingFeeCases.length === 1 ? "" : "s"} have pending fee balances. Tap to send client WhatsApp reminders.`,
            data: { type: "afternoon_digest" },
          },
          trigger: { date: afternoonDate },
        });
      }

      const eveningDate = new Date();
      eveningDate.setHours(19, 0, 0, 0);
      if (eveningDate.getTime() > Date.now()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `🌙 Evening Prep: Undated Cases`,
            body: `${undatedCases.length} case${undatedCases.length === 1 ? "" : "s"} need next hearing dates assigned. Tap to organize your diary.`,
            data: { type: "evening_prep" },
          },
          trigger: { date: eveningDate },
        });
      }
    } catch (error) {
      console.error("Failed to schedule multi-interval notifications:", error);
    }
  };
