import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CaseWithDetails } from '../DataBase';
import { getDb } from '../DataBase/connection';

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
export const scheduleCaseReminder = async (caseData: CaseWithDetails): Promise<string | null> => {
  if (!caseData.NextDate) return null;
  
  try {
    // 1. Request notification permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted.');
      return null;
    }

    // 2. Cancel any existing notification for this case first
    await cancelCaseReminder(caseData.id);

    // Read preferences from AsyncStorage
    const enabledVal = await AsyncStorage.getItem('@notification_enabled');
    if (enabledVal === 'false') {
      return null; // Notifications are disabled by user
    }

    const daysBeforeVal = await AsyncStorage.getItem('@notification_days_before');
    const daysBefore = daysBeforeVal !== null ? parseInt(daysBeforeVal, 10) : 1; // Default: 1 day before

    const hourVal = await AsyncStorage.getItem('@notification_hour');
    const hour = hourVal !== null ? parseInt(hourVal, 10) : 19; // Default: 7:00 PM (19)

    const minuteVal = await AsyncStorage.getItem('@notification_minute');
    const minute = minuteVal !== null ? parseInt(minuteVal, 10) : 0; // Default: 0

    // 3. Compute target alert date
    const [year, month, day] = caseData.NextDate.split('-').map(Number);
    const hearingDate = new Date(year, month - 1, day); // local midnight
    const reminderDate = new Date(hearingDate);
    reminderDate.setDate(hearingDate.getDate() - daysBefore);
    reminderDate.setHours(hour, minute, 0, 0);

    // If the computed reminder time is in the past, don't schedule it
    if (reminderDate.getTime() <= Date.now()) {
      return null;
    }

    let alertTitle = `Hearing Tomorrow: ${caseData.CaseTitle || 'Legal Case'}`;
    if (daysBefore === 0) {
      alertTitle = `Hearing Today: ${caseData.CaseTitle || 'Legal Case'}`;
    } else if (daysBefore > 1) {
      alertTitle = `Hearing in ${daysBefore} Days: ${caseData.CaseTitle || 'Legal Case'}`;
    }

    // 4. Schedule notification
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: alertTitle,
        body: `Client: ${caseData.ClientName || 'N/A'}\nCourt: ${caseData.court_name || 'N/A'}`,
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
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  } catch (error) {
    console.error(`Failed to cancel notifications for case ID ${caseId}:`, error);
  }
};

/**
 * Reschedules reminder notifications for all active upcoming cases.
 * Typically called when notification settings are updated.
 */
export const reScheduleAllNotifications = async (): Promise<void> => {
  try {
    const db = await getDb();
    const todayStr = new Date().toISOString().split('T')[0];
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

