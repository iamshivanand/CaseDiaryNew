import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { CaseWithDetails } from "../DataBase";
import { getDb } from "../DataBase/connection";
import { getLocalDateString } from "./commonFunctions";

// Configure foreground notification behavior:
// Suppress the OS system banner/sound when the app is already open (foreground).
// App.tsx listens via addNotificationReceivedListener and shows in-app toasts.
Notifications.setNotificationHandler({
  handleNotification: async () =>
    ({
      shouldShowAlert: false, // Suppress OS banner when app is open
      shouldPlaySound: false, // Suppress OS sound when app is open
      shouldSetBadge: true, // Update badge count
      shouldShowBanner: false,
      shouldShowList: true,
    } as any),
});

// Helper for unified type-safe notification scheduling across Expo versions
const safeScheduleNotification = async (params: {
  title: string;
  body: string;
  data?: any;
  sound?: boolean;
  priority?: any;
  channelId?: string;
  categoryIdentifier?: string;
  triggerDate: Date;
}) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: params.title,
        body: params.body,
        data: params.data,
        sound: params.sound !== false,
        priority: params.priority || Notifications.AndroidNotificationPriority.HIGH,
        channelId: params.channelId,
        categoryIdentifier: params.categoryIdentifier,
      } as any,
      trigger: { date: params.triggerDate } as any,
    });
  } catch (e) {
    console.warn("Failed to schedule notification:", e);
  }
};

// Setup Android Notification Channels for smart OS categorizations
export const setupNotificationChannels = async () => {
  if (Platform.OS === "android") {
    try {
      await Notifications.setNotificationChannelAsync("hearing_reminders", {
        name: "Hearing Reminders",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#6366F1",
        sound: "default",
        enableVibrate: true,
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync("daily_briefings", {
        name: "Daily & Weekly Briefings",
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: "#3B82F6",
        sound: "default",
        enableVibrate: true,
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync("court_recess", {
        name: "Court Recess & Adjournment Check-ins",
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: "#10B981",
        sound: "default",
        enableVibrate: true,
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync("fee_reminders", {
        name: "Fee Recovery & Receipts",
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: "#F59E0B",
        sound: "default",
        enableVibrate: true,
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync("case_assistance", {
        name: "Proactive Drafting & Assistant",
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: "#8B5CF6",
        sound: "default",
        enableVibrate: false,
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync("limitation_alerts", {
        name: "Statute of Limitations Expiry",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 200, 500],
        lightColor: "#EF4444",
        sound: "default",
        enableVibrate: true,
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync("feature_discovery", {
        name: "Productivity Tips & Feature Discovery",
        importance: Notifications.AndroidImportance.LOW,
        sound: "default",
        enableVibrate: false,
        showBadge: false,
      });
    } catch (e) {
      console.warn("Failed to set notification channels:", e);
    }
  }
};

// Setup Actionable Interactive Notification Categories
export const setupNotificationCategories = async () => {
  try {
    // 1. Single Hearing Action Category
    await Notifications.setNotificationCategoryAsync(
      "HEARING_REMINDER_CATEGORY",
      [
        {
          identifier: "ACTION_VIEW_CASE",
          buttonTitle: "📂 View Case",
          options: { opensAppToForeground: true },
        },
        {
          identifier: "ACTION_WHATSAPP_CLIENT",
          buttonTitle: "💬 WhatsApp Client",
          options: { opensAppToForeground: true },
        },
        {
          identifier: "ACTION_SNOOZE_60",
          buttonTitle: "⏰ Snooze 1 Hr",
          options: { opensAppToForeground: false },
        },
      ]
    );

    // 2. Multi Hearing Summary Category
    await Notifications.setNotificationCategoryAsync("MULTI_HEARING_CATEGORY", [
      {
        identifier: "ACTION_VIEW_CAUSE_LIST",
        buttonTitle: "📋 Today's Cause List",
        options: { opensAppToForeground: true },
      },
      {
        identifier: "ACTION_SHARE_PDF",
        buttonTitle: "📤 Share PDF List",
        options: { opensAppToForeground: true },
      },
    ]);

    // 3. Court Recess / Adjournment Category
    await Notifications.setNotificationCategoryAsync("RECESS_CHECK_CATEGORY", [
      {
        identifier: "ACTION_UPDATE_HEARING",
        buttonTitle: "✏️ Update Next Date",
        options: { opensAppToForeground: true },
      },
      {
        identifier: "ACTION_RECORD_NOTE",
        buttonTitle: "🎙️ Record Order Note",
        options: { opensAppToForeground: true },
      },
    ]);

    // 4. Chamber Fee Recovery Category
    await Notifications.setNotificationCategoryAsync("FEE_RECOVERY_CATEGORY", [
      {
        identifier: "ACTION_VIEW_FEE_CASE",
        buttonTitle: "💵 View Balance",
        options: { opensAppToForeground: true },
      },
      {
        identifier: "ACTION_SEND_RECEIPT",
        buttonTitle: "📱 WhatsApp Reminder",
        options: { opensAppToForeground: true },
      },
    ]);

    // 5. Proactive Legal Drafting Category
    await Notifications.setNotificationCategoryAsync(
      "PROACTIVE_DRAFT_CATEGORY",
      [
        {
          identifier: "ACTION_OPEN_DRAFT_EDITOR",
          buttonTitle: "✍️ Open Template",
          options: { opensAppToForeground: true },
        },
        {
          identifier: "ACTION_VIEW_CASE_DOCS",
          buttonTitle: "📁 Case Docs",
          options: { opensAppToForeground: true },
        },
      ]
    );
  } catch (e) {
    console.warn("Failed to set notification categories:", e);
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
    await safeScheduleNotification({
      title: `⏰ [Snoozed] ${title.replace(/^⏰\s*\[Snoozed\]\s*/, "")}`,
      body,
      data,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      channelId: "hearing_reminders",
      categoryIdentifier: "HEARING_REMINDER_CATEGORY",
      triggerDate,
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
 * - If 2+ cases on that date: Sends a consolidated summary alert.
 * - Cancels previous scheduled notifications to eliminate duplicate stacking.
 */
export const reScheduleAllNotifications = async (): Promise<void> => {
  try {
    const hasPermission = await ensureNotificationPermissions();
    if (!hasPermission) return;

    const enabledVal = await AsyncStorage.getItem("@notification_enabled");
    if (enabledVal === "false") {
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
      const hearingDate = new Date(year, month - 1, day);
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
        const courtPart = singleCase.court_name
          ? `Court: ${singleCase.court_name}`
          : "";
        const clientPart = singleCase.ClientName
          ? `Client: ${singleCase.ClientName}`
          : "";
        const bodyParts = [courtPart, clientPart].filter(Boolean);
        const body =
          bodyParts.length > 0
            ? bodyParts.join(" • ")
            : "Tap to review case files & prepare arguments.";

        await safeScheduleNotification({
          title,
          body,
          data: {
            caseId: singleCase.id,
            type: "single_hearing",
            date: dateStr,
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          channelId: "hearing_reminders",
          categoryIdentifier: "HEARING_REMINDER_CATEGORY",
          triggerDate: reminderDate,
        });
      } else {
        // 2+ cases: Consolidated single notification
        const title = `📅 ${dateCases.length} Hearings Scheduled ${daysLabel}`;
        const previewTitles = dateCases
          .slice(0, 2)
          .map((c) => c.CaseTitle || "Case")
          .join(", ");
        const remainingCount = dateCases.length - 2;
        const courtNames = [
          ...new Set(dateCases.map((c) => c.court_name).filter(Boolean)),
        ];
        const courtsText =
          courtNames.length > 0
            ? ` in ${courtNames.slice(0, 2).join(", ")}`
            : "";
        const body = `${previewTitles}${remainingCount > 0 ? ` (+${remainingCount} more)` : ""}${courtsText}. Tap to view daily cause list.`;

        await safeScheduleNotification({
          title,
          body,
          data: {
            date: dateStr,
            count: dateCases.length,
            type: "hearing_summary",
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          channelId: "hearing_reminders",
          categoryIdentifier: "MULTI_HEARING_CATEGORY",
          triggerDate: reminderDate,
        });
      }
    }

    // Schedule smart daily briefings & contextual assists
    await scheduleDailyMultiIntervalNotifications();
  } catch (error) {
    console.error("Failed to reschedule smart notifications:", error);
  }
};

/**
 * Schedules a single case reminder by refreshing the smart schedule.
 */
export const scheduleCaseReminder = async (
  _caseDetails: CaseWithDetails
): Promise<void> => {
  await reScheduleAllNotifications();
};

/**
 * Cancels all reminders for a given case by refreshing the smart schedule.
 */
export const cancelCaseReminder = async (_caseId: number): Promise<void> => {
  await reScheduleAllNotifications();
};

/**
 * Schedules rich multi-interval contextual lifecycle notifications for the next 7 days:
 *
 * 1. Sunday 08:00 PM -> Weekly Executive Diary Planner
 * 2. 08:00 AM (Daily) -> Morning Cause List Briefing with Court & Stage highlights
 * 3. 01:30 PM (Daily) -> Mid-Day Court Recess Quick Check-in
 * 4. 03:30 PM (Daily) -> Proactive Legal Drafting Assist
 * 5. 05:30 PM (Daily) -> Chamber Fee Recovery Nudge
 * 6. 08:00 PM (Daily) -> Evening Next-Day Cause List Preview
 * 7. 09:30 AM (Daily) -> Overdue Unscheduled Hearings Action Alert
 * 8. 10:00 AM (Monthly) -> Statute of Limitations 30-Day & 7-Day Warnings
 * 9. Saturday 11:30 AM -> Rotating Feature Discovery & Cloud Backup Reminder
 */
export const scheduleDailyMultiIntervalNotifications = async (): Promise<void> => {
  try {
    const hasPermission = await ensureNotificationPermissions();
    if (!hasPermission) return;

    const enabledVal = await AsyncStorage.getItem("@notification_enabled");
    if (enabledVal === "false") return;

    const db = await getDb();
    const now = Date.now();
    const today = new Date();
    const todayStr = getLocalDateString(today);

    const ROLLING_DAYS = 7;

    // 1. Overdue Hearing Dates Warning at 09:30 AM for Today
    const overdueCases = await db.getAllAsync<any>(
      "SELECT id, CaseTitle, ClientName, NextDate FROM Cases WHERE NextDate IS NOT NULL AND NextDate != '' AND NextDate != 'N/A' AND NextDate < ? AND (CaseStatus IS NULL OR CaseStatus != 'Closed') ORDER BY NextDate ASC",
      [todayStr]
    );

    if (overdueCases.length > 0) {
      const overdueTrigger = new Date();
      overdueTrigger.setHours(9, 30, 0, 0);
      if (overdueTrigger.getTime() > now) {
        await safeScheduleNotification({
          title: `⚠️ ${overdueCases.length} Hearing${overdueCases.length === 1 ? "" : "s"} Need Rescheduling`,
          body: `Hearings have passed for ${overdueCases.length} case${overdueCases.length === 1 ? "" : "s"}. Tap to update next date or record court orders.`,
          data: {
            type: "overdue_hearings_alert",
            count: overdueCases.length,
            caseId: overdueCases[0]?.id,
          },
          sound: true,
          channelId: "hearing_reminders",
          categoryIdentifier: "HEARING_REMINDER_CATEGORY",
          triggerDate: overdueTrigger,
        });
      }
    }

    // 2. Schedule briefings, assists, and fee recovery across ROLLING_DAYS
    for (let dayOffset = 0; dayOffset < ROLLING_DAYS; dayOffset++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + dayOffset);
      const targetDateStr = getLocalDateString(targetDate);

      // A. Sunday 08:00 PM Weekly Executive Diary Planner
      if (targetDate.getDay() === 0) {
        const mondayStart = new Date(targetDate);
        mondayStart.setDate(targetDate.getDate() + 1);
        const mondayStartStr = getLocalDateString(mondayStart);

        const sundayEnd = new Date(targetDate);
        sundayEnd.setDate(targetDate.getDate() + 7);
        const sundayEndStr = getLocalDateString(sundayEnd);

        const weekCases = await db.getAllAsync<any>(
          "SELECT id FROM Cases WHERE NextDate >= ? AND NextDate <= ? AND (CaseStatus IS NULL OR CaseStatus != 'Closed')",
          [mondayStartStr, sundayEndStr]
        );

        if (weekCases.length > 0) {
          const sundayTrigger = new Date(targetDate);
          sundayTrigger.setHours(20, 0, 0, 0); // Sunday 8:00 PM
          if (sundayTrigger.getTime() > now) {
            await safeScheduleNotification({
              title: `📊 Weekly Court Planner (${weekCases.length} Hearings Ahead)`,
              body: `You have ${weekCases.length} case${weekCases.length === 1 ? "" : "s"} scheduled for this coming week. Tap to plan your diary.`,
              data: { type: "weekly_briefing" },
              sound: true,
              channelId: "daily_briefings",
              categoryIdentifier: "MULTI_HEARING_CATEGORY",
              triggerDate: sundayTrigger,
            });
          }
        }
      }

      // Fetch cases for the day
      const casesOnDay = await db.getAllAsync<any>(
        "SELECT id, CaseTitle, ClientName, court_name, total_fee, fee_paid, Undersection, case_type_name, case_stage FROM Cases WHERE NextDate = ? AND (CaseStatus IS NULL OR CaseStatus != 'Closed')",
        [targetDateStr]
      );

      if (casesOnDay.length > 0) {
        const count = casesOnDay.length;

        // B. Morning Briefing at 08:00 AM on that day
        const morningTrigger = new Date(targetDate);
        morningTrigger.setHours(8, 0, 0, 0);
        if (morningTrigger.getTime() > now) {
          await safeScheduleNotification({
            title: `🌅 Today's Cause List (${count} Hearing${count === 1 ? "" : "s"})`,
            body: `You have ${count} hearing${count === 1 ? "" : "s"} listed today. Tap to view your courtroom schedule.`,
            data: { type: "morning_briefing", date: targetDateStr },
            sound: true,
            channelId: "daily_briefings",
            categoryIdentifier: "MULTI_HEARING_CATEGORY",
            triggerDate: morningTrigger,
          });
        }

        // C. Mid-Day Court Recess Check-in at 01:30 PM (for Today)
        if (dayOffset === 0) {
          const recessTrigger = new Date(targetDate);
          recessTrigger.setHours(13, 30, 0, 0); // 1:30 PM Recess
          if (recessTrigger.getTime() > now) {
            const firstCase = casesOnDay[0];
            await safeScheduleNotification({
              title: `⚖️ Court Recess: Update Today's Hearings`,
              body: `Did your morning cases get adjourned or order passed? 1-tap update while fresh in mind.`,
              data: {
                type: "recess_adjournment",
                caseId: firstCase?.id,
                date: targetDateStr,
              },
              sound: true,
              channelId: "court_recess",
              categoryIdentifier: "RECESS_CHECK_CATEGORY",
              triggerDate: recessTrigger,
            });
          }
        }

        // D. Proactive Legal Drafting Assist at 03:30 PM (for upcoming cases 2-3 days ahead)
        if (dayOffset >= 1 && dayOffset <= 3) {
          for (const caseItem of casesOnDay) {
            const uSec = (caseItem.Undersection || "").toLowerCase();
            const cType = (caseItem.case_type_name || "").toLowerCase();
            const cStage = (caseItem.case_stage || "").toLowerCase();
            const cTitle = (caseItem.CaseTitle || "").toLowerCase();

            const isBail =
              uSec.includes("437") ||
              uSec.includes("438") ||
              uSec.includes("439") ||
              cTitle.includes("bail") ||
              cStage.includes("bail");

            const isCivilWs =
              cType.includes("civil") &&
              (cStage.includes("ws") ||
                cStage.includes("written") ||
                cStage.includes("reply"));

            let assistTitle = "";
            let assistBody = "";
            let templateType = "";

            if (isBail) {
              assistTitle = `⚖️ Prepare Bail Petition: ${caseItem.CaseTitle || "Case"}`;
              assistBody = `Hearing in ${dayOffset} days. 1-tap generate regular or anticipatory bail application with auto-filled metadata.`;
              templateType = uSec.includes("438") ? "anticipatory_bail" : "bail";
            } else if (isCivilWs) {
              assistTitle = `📝 Draft Written Statement: ${caseItem.CaseTitle || "Case"}`;
              assistBody = `Hearing in ${dayOffset} days. Prepare your structured defense reply with Indian CPC templates.`;
              templateType = "written_statement";
            }

            if (assistTitle) {
              const assistTrigger = new Date(targetDate);
              assistTrigger.setDate(assistTrigger.getDate() - dayOffset);
              assistTrigger.setHours(15, 30, 0, 0); // 3:30 PM

              if (assistTrigger.getTime() > now) {
                await safeScheduleNotification({
                  title: assistTitle,
                  body: assistBody,
                  data: {
                    type: "proactive_draft",
                    caseId: caseItem.id,
                    templateType,
                  },
                  sound: true,
                  channelId: "case_assistance",
                  categoryIdentifier: "PROACTIVE_DRAFT_CATEGORY",
                  triggerDate: assistTrigger,
                });
              }
            }
          }
        }

        // E. Chamber Fee Recovery Nudge at 05:30 PM
        // Check for unpaid fee balances on cases scheduled today or tomorrow
        const casesWithPendingFee = casesOnDay.filter(
          (c) => Number(c.total_fee || 0) > Number(c.fee_paid || 0)
        );

        if (casesWithPendingFee.length > 0) {
          for (const feeCase of casesWithPendingFee) {
            const pendingAmount =
              Number(feeCase.total_fee || 0) - Number(feeCase.fee_paid || 0);

            const chamberTrigger = new Date(targetDate);
            // If hearing is today, send at 5:30 PM today; if tomorrow, send at 5:30 PM the evening before
            if (dayOffset > 0) {
              chamberTrigger.setDate(chamberTrigger.getDate() - 1);
            }
            chamberTrigger.setHours(17, 30, 0, 0); // 5:30 PM

            if (chamberTrigger.getTime() > now) {
              await safeScheduleNotification({
                title: `💼 Fee Balance: ₹${pendingAmount.toLocaleString("en-IN")} (${feeCase.ClientName || "Client"})`,
                body: `Hearing ${dayOffset === 0 ? "today" : "tomorrow"} for ${feeCase.CaseTitle || "Case"}. Tap to view case and send WhatsApp receipt/reminder.`,
                data: {
                  type: "fee_reminder",
                  caseId: feeCase.id,
                  pendingAmount,
                },
                sound: true,
                channelId: "fee_reminders",
                categoryIdentifier: "FEE_RECOVERY_CATEGORY",
                triggerDate: chamberTrigger,
              });
            }
          }
        }

        // F. Evening Preview at 08:00 PM the day BEFORE
        if (dayOffset > 0) {
          const eveningTrigger = new Date(targetDate);
          eveningTrigger.setDate(eveningTrigger.getDate() - 1);
          eveningTrigger.setHours(20, 0, 0, 0); // 8:00 PM Evening
          if (eveningTrigger.getTime() > now) {
            await safeScheduleNotification({
              title: `🌙 Tomorrow's Court Diary (${count} Hearing${count === 1 ? "" : "s"})`,
              body: `${count} hearing${count === 1 ? "" : "s"} listed for tomorrow (${targetDateStr}). Tap to review briefs & arguments.`,
              data: { type: "evening_preview", date: targetDateStr },
              sound: true,
              channelId: "daily_briefings",
              categoryIdentifier: "MULTI_HEARING_CATEGORY",
              triggerDate: eveningTrigger,
            });
          }
        }
      }

      // G. Saturday 11:30 AM Rotating Feature Discovery Highlights
      if (targetDate.getDay() === 6) {
        // Saturday
        const featureIndex = Math.floor(dayOffset / 7) % 4;
        const FEATURE_HIGHLIGHTS = [
          {
            title: "📸 Digitize Case Papers with PDF Scanner",
            body: "Turn paper orders, charge sheets, and FIRs into clean, searchable PDF files directly attached to your cases.",
            feature: "scanner",
          },
          {
            title: "🎙️ Dictate Hearing Notes with Voice",
            body: "Speak in Hindi or English to record fast courtroom proceeding notes on the go without typing.",
            feature: "voice",
          },
          {
            title: "⚖️ 30+ Auto-Filled Legal Templates",
            body: "Generate Bail Applications, Vakalatnamas, Caveats, and Injunctions in seconds with your case metadata.",
            feature: "drafts",
          },
          {
            title: "🛡️ Protect Your Court Diary with Cloud Backup",
            body: "Safeguard your cases and timeline with 1-tap encrypted offline/cloud backup to Google Drive or local storage.",
            feature: "backup",
          },
        ];

        const satTrigger = new Date(targetDate);
        satTrigger.setHours(11, 30, 0, 0); // Saturday 11:30 AM
        if (satTrigger.getTime() > now) {
          const currentHighlight = FEATURE_HIGHLIGHTS[featureIndex];
          await safeScheduleNotification({
            title: currentHighlight.title,
            body: currentHighlight.body,
            data: {
              type: "feature_discovery",
              feature: currentHighlight.feature,
            },
            sound: true,
            channelId: "feature_discovery",
            triggerDate: satTrigger,
          });
        }
      }
    }

    // 3. Statute of Limitations 30-Day and 7-Day Warnings (10:00 AM)
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
        await safeScheduleNotification({
          title: `🚨 7 Days Left: Statute of Limitations`,
          body: `Limitation for ${limCase.CaseTitle || "Case"} (${limCase.ClientName || "Client"}) expires on ${limCase.StatuteOfLimitations}. File immediately!`,
          data: {
            type: "limitation_alert",
            caseId: limCase.id,
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
          channelId: "limitation_alerts",
          categoryIdentifier: "HEARING_REMINDER_CATEGORY",
          triggerDate: warn7Days,
        });
      }
    }
  } catch (error) {
    console.error("Failed to schedule smart daily notifications:", error);
  }
};
