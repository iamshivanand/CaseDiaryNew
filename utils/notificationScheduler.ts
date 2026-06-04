import * as Notifications from 'expo-notifications';
import { CaseWithDetails } from '../DataBase';

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
 * The reminder is scheduled for 7:00 PM the evening before the hearing date.
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

    // 3. Compute target alert date: 7:00 PM (19:00) the day before the hearing
    const hearingDate = new Date(caseData.NextDate);
    const reminderDate = new Date(hearingDate);
    reminderDate.setDate(hearingDate.getDate() - 1);
    reminderDate.setHours(19, 0, 0, 0); // 7:00 PM

    // If the computed reminder time is in the past, don't schedule it
    if (reminderDate.getTime() <= Date.now()) {
      return null;
    }

    // 4. Schedule notification
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Hearing Tomorrow: ${caseData.CaseTitle || 'Legal Case'}`,
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
