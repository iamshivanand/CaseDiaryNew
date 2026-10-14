import * as SQLite from "expo-sqlite";
import { __TEST_ONLY_resetDbInstance } from "../connection";
import {
  addAppNotification,
  getAppNotifications,
  getUnreadAppNotificationsCount,
  markAppNotificationAsRead,
  markAllAppNotificationsAsRead,
  deleteAppNotification,
  clearAllAppNotifications,
  purgeOldAppNotifications,
} from "../appNotificationsDb";

const mockSQLite = SQLite as any;

beforeEach(async () => {
  __TEST_ONLY_resetDbInstance();
  mockSQLite.__resetAllMockDatabases();
});

describe("AppNotifications Database Module", () => {
  it("should add and retrieve notifications correctly", async () => {
    await addAppNotification({
      title: "Hearing Reminder",
      body: "Hearing tomorrow in High Court",
      category: "hearing",
      case_id: 101,
      action_type: "hearing_scheduled",
    });

    const notifs = await getAppNotifications();
    expect(notifs).toHaveLength(1);
    expect(notifs[0].title).toBe("Hearing Reminder");
    expect(notifs[0].category).toBe("hearing");
    expect(notifs[0].is_read).toBe(0);
  });

  it("should filter notifications by category", async () => {
    await addAppNotification({
      title: "Hearing 1",
      body: "Body 1",
      category: "hearing",
    });
    await addAppNotification({
      title: "Fee Paid",
      body: "₹5000",
      category: "fee",
    });

    const hearingNotifs = await getAppNotifications("hearing");
    expect(hearingNotifs).toHaveLength(1);
    expect(hearingNotifs[0].category).toBe("hearing");

    const feeNotifs = await getAppNotifications("fee");
    expect(feeNotifs).toHaveLength(1);
    expect(feeNotifs[0].category).toBe("fee");
  });

  it("should track and update unread count properly", async () => {
    await addAppNotification({
      title: "N1",
      body: "B1",
      category: "hearing",
    });
    await addAppNotification({
      title: "N2",
      body: "B2",
      category: "case_update",
    });

    let count = await getUnreadAppNotificationsCount();
    expect(count).toBe(2);

    await markAllAppNotificationsAsRead();
    count = await getUnreadAppNotificationsCount();
    expect(count).toBe(0);
  });

  it("should mark individual notification as read", async () => {
    const id = await addAppNotification({
      title: "Single Notif",
      body: "Body",
      category: "hearing",
    });

    const success = await markAppNotificationAsRead(id);
    expect(success).toBe(true);

    const notifs = await getAppNotifications();
    expect(notifs[0].is_read).toBe(1);
  });

  it("should delete notification by id and clear all", async () => {
    const id = await addAppNotification({
      title: "To Delete",
      body: "Body",
      category: "system",
    });

    await deleteAppNotification(id);
    let notifs = await getAppNotifications();
    expect(notifs).toHaveLength(0);

    await addAppNotification({ title: "A", body: "B", category: "fee" });
    await addAppNotification({ title: "C", body: "D", category: "hearing" });

    await clearAllAppNotifications();
    notifs = await getAppNotifications();
    expect(notifs).toHaveLength(0);
  });

  it("should run purgeOldAppNotifications without error", async () => {
    const purged = await purgeOldAppNotifications(30);
    expect(typeof purged).toBe("number");
  });
});
