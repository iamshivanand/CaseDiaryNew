import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { CaseWithDetails } from "../DataBase";
import { getDb } from "../DataBase/connection";
import { getLocalDateString } from "./commonFunctions";

// Configure foreground notification behavior:
// Suppress the OS system banner/sound when the app is already open (foreground).
// Instead, App.tsx listens via addNotificationReceivedListener and shows
// a custom in-app toast so the advocate is not double-buzzed.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,  // ← suppress OS banner when app is open
    shouldPlaySound: false,  // ← suppress OS sound when app is open
    shouldSetBadge: true,    // ← still update the badge count
  }),
});

// Setup Android Notification Channels for smart OS categorizations
export const setupNotificationChannels = async () => {
  if (Platform.OS === "android") {
    try {
      await Notifications.setNotificationChannelAsync("hearing_reminders", {
        name: "Hearing Reminders",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#2563EB",
        enableLights: true,
        enableVibrate: true,
      });

      await Notifications.setNotificationChannelAsync("daily_briefings", {
        name: "Daily Court Briefings",
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: "default",
        lightColor: "#4F46E5",
      });

      await Notifications.setNotificationChannelAsync("fee_reminders", {
        name: "Fee Collection Reminders",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
        lightColor: "#10B981",
        enableVibrate: true,
      });

      await Notifications.setNotificationChannelAsync("limitation_alerts", {
        name: "Limitation & Deadlines",
        importance: Notifications.AndroidImportance.MAX,
        sound: "default",
        lightColor: "#EF4444",
        enableVibrate: true,
      });
    } catch (e) {
      console.warn("Failed to set notification channels:", e);
    }
  }
};

// Setup native lock-screen interactive notification action buttons
export const setupNotificationCategories = async () => {
  try {
    if (typeof Notifications.setNotificationCategoryAsync === "function") {
      await Notifications.setNotificationCategoryAsync(
        "HEARING_REMINDER_CATEGORY",
        [
          {
            identifier: "VIEW_CASE",
            buttonTitle: "View Case",
            options: {
              opensAppToForeground: true,
            },
          },
          {
            identifier: "RESCHEDULE",
            buttonTitle: "Reschedule",
            options: {
              opensAppToForeground: true,
            },
          },
          {
            identifier: "SNOOZE_1H",
            buttonTitle: "Snooze 1 Hr",
            options: {
              opensAppToForeground: false,
            },
          },
        ]
      );

      await Notifications.setNotificationCategoryAsync("MULTI_HEARING_CATEGORY", [
        {
          identifier: "OPEN_CAUSE_LIST",
          buttonTitle: "Open Cause List",
          options: {
            opensAppToForeground: true,
          },
        },
        {
          identifier: "SNOOZE_1H",
          buttonTitle: "Snooze 1 Hr",
          options: {
            opensAppToForeground: false,
          },
        },
      ]);
    }
  } catch (err) {
    console.warn("Failed to set notification categories:", err);
  }
};

// Initialize channels and action categories immediately
setupNotificationChannels();
setupNotificationCategories();

/**
 * Snoozes a notification for a given duration (default: 60 minutes)
 */
export const snoozeNotification = async (
  title: string,
  body: string,
  data: any,
  minutes: number = 60
): Promise<void> => {
  try {
    const triggerDate = new Date(Date.now() + minutes * 60 * 1000);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏰ [Snoozed] ${title.replace(/^⏰\s*\[Snoozed\]\s*/, "")}`,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        channelId: "hearing_reminders",
        categoryIdentifier: "HEARING_REMINDER_CATEGORY",
      },
      trigger: { date: triggerDate },
    });
  } catch (e) {
    console.error("Failed to snooze notification:", e);
  }
};

/**
 * Ensures notification permissions are granted
 */
export const ensureNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === "granted";
  } catch (error) {
    console.error("Error checking notification permissions:", error);
    return false;
  }
};

const safeCancelAllNotifications = async () => {
  try {
    if (
      typeof Notifications.cancelAllScheduledNotificationsAsync === "function"
    ) {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } else if (
      typeof Notifications.getAllScheduledNotificationsAsync === "function"
    ) {
      const scheduled =
        await Notifications.getAllScheduledNotificationsAsync();
      for (const n of scheduled) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  } catch (e) {
    console.warn("Could not cancel scheduled notifications:", e);
  }
};

/**
 * Smartly reschedules all notifications across active cases without bulk spam.
 * - Groups upcoming active cases by NextDate.
 * - If 1 case on that date: Sends a rich, detailed alert with direct deep link.
 * - If 2+ cases on that date: Sends a consolidated summary alert (1 notification instead of N).
 * - Cancels previous scheduled notifications to eliminate duplicate stacking.
 */
export const reScheduleAllNotifications = async (): Promise<void> => {
  try {
    const hasPermission = await ensureNotificationPermissions();
    if (!hasPermission) return;

    const enabledVal = await AsyncStorage.getItem("@notification_enabled");
    if (enabledVal === "false") {
      // User disabled notifications; cancel everything
      await safeCancelAllNotifications();
      return;
    }

    // Cancel all previously scheduled alarms to avoid duplicates
    await safeCancelAllNotifications();

    const daysBeforeVal = await AsyncStorage.getItem(
      "@notification_days_before"
    );
    const daysBefore = daysBeforeVal !== null ? parseInt(daysBeforeVal, 10) : 1; // Default: 1 day before

    const hourVal = await AsyncStorage.getItem("@notification_hour");
    const hour = hourVal !== null ? parseInt(hourVal, 10) : 19; // Default: 7:00 PM (19)

    const minuteVal = await AsyncStorage.getItem("@notification_minute");
    const minute = minuteVal !== null ? parseInt(minuteVal, 10) : 0; // Default: 0

    const db = await getDb();
    const todayStr = getLocalDateString(new Date());

    // Fetch active cases with upcoming hearing dates
    const cases = await db.getAllAsync<any>(
      "SELECT * FROM Cases WHERE NextDate IS NOT NULL AND NextDate != '' AND NextDate != 'N/A' AND NextDate >= ? AND (CaseStatus IS NULL OR CaseStatus != 'Closed') ORDER BY NextDate ASC",
      [todayStr]
    );

    if (!cases || cases.length === 0) {
      await scheduleDailyMultiIntervalNotifications();
      return;
    }

    // Group cases by NextDate
    const dateGroups: Record<string, any[]> = {};
    for (const caseItem of cases) {
      const d = caseItem.NextDate;
      if (!dateGroups[d]) {
        dateGroups[d] = [];
      }
      dateGroups[d].push(caseItem);
    }

    // Schedule smart consolidated or single reminders for each date group
    for (const [dateStr, dateCases] of Object.entries(dateGroups)) {
      const [year, month, day] = dateStr.split("-").map(Number);
      const hearingDate = new Date(year, month - 1, day); // local midnight
      const reminderDate = new Date(hearingDate);
      reminderDate.setDate(hearingDate.getDate() - daysBefore);
      reminderDate.setHours(hour, minute, 0, 0);

      // Skip if reminder time has already passed
      if (reminderDate.getTime() <= Date.now()) {
        continue;
      }

      let daysLabel = `in ${daysBefore} Days`;
      if (daysBefore === 0) daysLabel = "Today";
      else if (daysBefore === 1) daysLabel = "Tomorrow";

      if (dateCases.length === 1) {
        const singleCase = dateCases[0];
        const title = `📅 Hearing ${daysLabel}: ${singleCase.CaseTitle || "Legal Case"}`;
        const courtPart = singleCase.court_name ? `Court: ${singleCase.court_name}` : "";
        const clientPart = singleCase.ClientName ? `Client: ${singleCase.ClientName}` : "";
        const bodyParts = [courtPart, clientPart].filter(Boolean);
        const body = bodyParts.length > 0 ? bodyParts.join(" • ") : "Tap to review case files & prepare arguments.";

        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: { caseId: singleCase.id, type: "single_hearing", date: dateStr },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
            channelId: "hearing_reminders",
            categoryIdentifier: "HEARING_REMINDER_CATEGORY",
          },
          trigger: { date: reminderDate },
        });
      } else {
        // 2+ cases: Consolidated single notification
        const title = `📅 ${dateCases.length} Hearings Scheduled ${daysLabel}`;
        const previewTitles = dateCases.slice(0, 2).map((c) => c.CaseTitle || "Case").join(", ");
        const remainingCount = dateCases.length - 2;
        const courtNames = [...new Set(dateCases.map((c) => c.court_name).filter(Boolean))];
        const courtsText = courtNames.length > 0 ? ` in ${courtNames.slice(0, 2).join(", ")}` : "";
        const body = `${previewTitles}${remainingCount > 0 ? ` (+${remainingCount} more)` : ""}${courtsText}. Tap to view daily cause list.`;

        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: { date: dateStr, count: dateCases.length, type: "hearing_summary" },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
            channelId: "hearing_reminders",
            categoryIdentifier: "MULTI_HEARING_CATEGORY",
          },
          trigger: { date: reminderDate },
        });
      }
    }

    // Schedule smart daily briefings
    await scheduleDailyMultiIntervalNotifications();
  } catch (error) {
    console.error("Failed to reschedule smart notifications:", error);
  }
};

/**
 * Schedules a single case reminder by refreshing the smart schedule.
 */
export const scheduleCaseReminder = async (
  caseData: CaseWithDetails
): Promise<string | null> => {
  await reScheduleAllNotifications();
  return "rescheduled";
};

/**
 * Cancels reminders and refreshes the smart schedule.
 */
export const cancelCaseReminder = async (caseId: number): Promise<void> => {
  await reScheduleAllNotifications();
};

/**
 * Schedules smart daily briefings with zero spam:
 * 1. Morning Briefing (8:00 AM): ONLY if today's hearings > 0.
 * 2. Evening Preview (7:30 PM): ONLY if tomorrow's hearings > 0.
 */
/**
 * Schedules morning + evening briefings for the next ROLLING_DAYS days.
 * This means even if the advocate does not open the app for 14 days,
 * they still receive daily hearing reminders every morning and evening.
 */
const ROLLING_DAYS = 14;

export const scheduleDailyMultiIntervalNotifications =
  async (): Promise<void> => {
    try {
      const hasPermission = await ensureNotificationPermissions();
      if (!hasPermission) return;

      const enabledVal = await AsyncStorage.getItem("@notification_enabled");
      if (enabledVal === "false") return;

      const db = await getDb();
      const now = Date.now();

      // 1. Check for OVERDUE passed hearings (NextDate < today, status != Closed)
      const today = new Date();
      const todayStr = getLocalDateString(today);
      const overdueCases = await db.getAllAsync<any>(
        "SELECT id, CaseTitle, NextDate FROM Cases WHERE NextDate IS NOT NULL AND NextDate != '' AND NextDate != 'N/A' AND NextDate < ? AND (CaseStatus IS NULL OR CaseStatus != 'Closed')",
        [todayStr]
      );

      if (overdueCases.length > 0) {
        const overdueTrigger = new Date();
        overdueTrigger.setHours(9, 30, 0, 0);
        if (overdueTrigger.getTime() > now) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `⚠️ ${overdueCases.length} Hearing${overdueCases.length === 1 ? "" : "s"} Need Rescheduling`,
              body: `Hearings have passed for ${overdueCases.length} case${overdueCases.length === 1 ? "" : "s"}. Tap to update next date or record order.`,
              data: { type: "overdue_hearings_alert", count: overdueCases.length },
              sound: true,
              channelId: "hearing_reminders",
            },
            trigger: { date: overdueTrigger },
          });
        }
      }

      // 2. Schedule briefings and fee reminders across ROLLING_DAYS
      for (let dayOffset = 0; dayOffset < ROLLING_DAYS; dayOffset++) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + dayOffset);
        const targetDateStr = getLocalDateString(targetDate);

        // A. Monday 9:00 AM Weekly Executive Briefing
        if (targetDate.getDay() === 1) { // Monday
          const mondayEnd = new Date(targetDate);
          mondayEnd.setDate(targetDate.getDate() + 6); // Through Sunday
          const mondayEndStr = getLocalDateString(mondayEnd);

          const weekCases = await db.getAllAsync<any>(
            "SELECT id FROM Cases WHERE NextDate >= ? AND NextDate <= ? AND (CaseStatus IS NULL OR CaseStatus != 'Closed')",
            [targetDateStr, mondayEndStr]
          );

          const todayCasesCount = await db.getAllAsync<any>(
            "SELECT id FROM Cases WHERE NextDate = ? AND (CaseStatus IS NULL OR CaseStatus != 'Closed')",
            [targetDateStr]
          );

          if (weekCases.length > 0) {
            const mondayTrigger = new Date(targetDate);
            mondayTrigger.setHours(9, 0, 0, 0);
            if (mondayTrigger.getTime() > now) {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: `📊 Weekly Court Diary (${weekCases.length} Hearings This Week)`,
                  body: `You have ${weekCases.length} active case${weekCases.length === 1 ? "" : "s"} listed this week — ${todayCasesCount.length} hearing${todayCasesCount.length === 1 ? "" : "s"} scheduled for today.`,
                  data: { type: "weekly_briefing" },
                  sound: true,
                  channelId: "daily_briefings",
                },
                trigger: { date: mondayTrigger },
              });
            }
          }
        }

        const casesOnDay = await db.getAllAsync<any>(
          "SELECT id, CaseTitle, ClientName, court_name, total_fee, fee_paid FROM Cases WHERE NextDate = ? AND (CaseStatus IS NULL OR CaseStatus != 'Closed')",
          [targetDateStr]
        );

        if (casesOnDay.length > 0) {
          const count = casesOnDay.length;

          // B. Morning Briefing at 8:00 AM for that day
          const morningTrigger = new Date(targetDate);
          morningTrigger.setHours(8, 0, 0, 0);
          if (morningTrigger.getTime() > now) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `🌅 Court Diary – ${dayOffset === 0 ? "Today" : targetDateStr} (${count} Hearing${count === 1 ? "" : "s"})`,
                body: `You have ${count} hearing${count === 1 ? "" : "s"} scheduled. Tap to view your cause list.`,
                data: { type: "morning_briefing", date: targetDateStr },
                sound: true,
                channelId: "daily_briefings",
              },
              trigger: { date: morningTrigger },
            });
          }

          // C. Evening Preview at 7:30 PM the day BEFORE (only for days > 0)
          if (dayOffset > 0) {
            const eveningTrigger = new Date(targetDate);
            eveningTrigger.setDate(eveningTrigger.getDate() - 1); // previous evening
            eveningTrigger.setHours(19, 30, 0, 0);
            if (eveningTrigger.getTime() > now) {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: `🌙 Tomorrow's Court Diary (${count} Hearing${count === 1 ? "" : "s"})`,
                  body: `${count} hearing${count === 1 ? "" : "s"} listed for ${targetDateStr}. Tap to review files and briefs.`,
                  data: { type: "evening_preview", date: targetDateStr },
                  sound: true,
                  channelId: "daily_briefings",
                },
                trigger: { date: eveningTrigger },
              });
            }

            // D. Fee Recovery Nudge Push Notification (7:00 PM the evening before)
            // If any of tomorrow's cases have an outstanding retainer fee
            const casesWithPendingFee = casesOnDay.filter(
              (c) => Number(c.total_fee || 0) > Number(c.fee_paid || 0)
            );

            for (const feeCase of casesWithPendingFee) {
              const pendingAmount =
                Number(feeCase.total_fee || 0) - Number(feeCase.fee_paid || 0);
              const feeTrigger = new Date(targetDate);
              feeTrigger.setDate(feeTrigger.getDate() - 1);
              feeTrigger.setHours(19, 0, 0, 0); // 7:00 PM evening before

              if (feeTrigger.getTime() > now) {
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title: `💰 Fee Reminder: ₹${pendingAmount.toLocaleString("en-IN")} Balance Due`,
                    body: `Hearing tomorrow for ${feeCase.CaseTitle || "Case"}. Client: ${feeCase.ClientName || "Client"} has ₹${pendingAmount.toLocaleString("en-IN")} pending.`,
                    data: {
                      type: "fee_reminder",
                      caseId: feeCase.id,
                      pendingAmount,
                    },
                    sound: true,
                    channelId: "fee_reminders",
                  },
                  trigger: { date: feeTrigger },
                });
              }
            }
          }
        }
      }

      // 3. Statute of Limitations 30-Day and 7-Day Warnings
      const limitationCases = await db.getAllAsync<any>(
        "SELECT id, CaseTitle, ClientName, StatuteOfLimitations FROM Cases WHERE StatuteOfLimitations IS NOT NULL AND StatuteOfLimitations != '' AND StatuteOfLimitations != 'N/A' AND StatuteOfLimitations >= ? AND (CaseStatus IS NULL OR CaseStatus != 'Closed')",
        [todayStr]
      );

      for (const limCase of limitationCases) {
        const [lYear, lMonth, lDay] = limCase.StatuteOfLimitations.split("-").map(Number);
        const limDate = new Date(lYear, lMonth - 1, lDay);

        // Schedule 7-day warning
        const warn7Days = new Date(limDate);
        warn7Days.setDate(limDate.getDate() - 7);
        warn7Days.setHours(10, 0, 0, 0);
        if (warn7Days.getTime() > now) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `🚨 7 Days Left: Statute of Limitations`,
              body: `Limitation for ${limCase.CaseTitle || "Case"} (${limCase.ClientName || "Client"}) expires on ${limCase.StatuteOfLimitations}. File immediately!`,
              data: { type: "limitation_alert", caseId: limCase.id },
              sound: true,
              priority: Notifications.AndroidNotificationPriority.MAX,
              channelId: "limitation_alerts",
            },
            trigger: { date: warn7Days },
          });
        }
      }
    } catch (error) {
      console.error("Failed to schedule smart daily notifications:", error);
    }
  };
