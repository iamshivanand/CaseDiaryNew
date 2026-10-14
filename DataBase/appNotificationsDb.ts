// DataBase/appNotificationsDb.ts
import { getDb } from "./connection";
import { AppNotificationRow, NewAppNotification } from "./schema";

/**
 * Adds a new in-app notification record to the database.
 */
export const addAppNotification = async (
  notif: NewAppNotification
): Promise<number> => {
  const db = await getDb();
  try {
    const isReadVal = notif.is_read != null ? notif.is_read : 0;
    const sql = `
      INSERT INTO AppNotifications (title, body, category, case_id, action_type, data_json, is_read)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      notif.title,
      notif.body,
      notif.category || "hearing",
      notif.case_id || null,
      notif.action_type || null,
      notif.data_json || null,
      isReadVal,
    ];

    const result = await db.runAsync(sql, params);
    return result.lastInsertRowId;
  } catch (error) {
    console.error("Error adding app notification:", error);
    throw error;
  }
};

/**
 * Retrieves all in-app notifications, optionally filtered by category.
 * Sorted chronologically descending (newest first).
 */
export const getAppNotifications = async (
  category?: string
): Promise<AppNotificationRow[]> => {
  const db = await getDb();
  try {
    if (category && category !== "all") {
      const sql = `
        SELECT * FROM AppNotifications
        WHERE category = ?
        ORDER BY created_at DESC, id DESC
      `;
      return await db.getAllAsync<AppNotificationRow>(sql, [category]);
    }

    const sql = `
      SELECT * FROM AppNotifications
      ORDER BY created_at DESC, id DESC
    `;
    return await db.getAllAsync<AppNotificationRow>(sql, []);
  } catch (error) {
    console.error("Error fetching app notifications:", error);
    return [];
  }
};

/**
 * Gets the total count of unread notifications.
 */
export const getUnreadAppNotificationsCount = async (): Promise<number> => {
  const db = await getDb();
  try {
    const sql = "SELECT COUNT(*) as count FROM AppNotifications WHERE is_read = 0";
    const result = await db.getFirstAsync<{ count: number }>(sql, []);
    return result?.count || 0;
  } catch (error) {
    console.error("Error fetching unread notifications count:", error);
    return 0;
  }
};

/**
 * Marks a specific notification as read.
 */
export const markAppNotificationAsRead = async (
  id: number
): Promise<boolean> => {
  const db = await getDb();
  try {
    const sql = "UPDATE AppNotifications SET is_read = 1 WHERE id = ?";
    const result = await db.runAsync(sql, [id]);
    return result.changes > 0;
  } catch (error) {
    console.error(`Error marking notification ${id} as read:`, error);
    return false;
  }
};

/**
 * Marks all notifications in the inbox as read.
 */
export const markAllAppNotificationsAsRead = async (): Promise<boolean> => {
  const db = await getDb();
  try {
    const sql = "UPDATE AppNotifications SET is_read = 1 WHERE is_read = 0";
    const result = await db.runAsync(sql, []);
    return result.changes > 0;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return false;
  }
};

/**
 * Deletes a single notification by ID.
 */
export const deleteAppNotification = async (id: number): Promise<boolean> => {
  const db = await getDb();
  try {
    const sql = "DELETE FROM AppNotifications WHERE id = ?";
    const result = await db.runAsync(sql, [id]);
    return result.changes > 0;
  } catch (error) {
    console.error(`Error deleting notification ${id}:`, error);
    return false;
  }
};

/**
 * Clears all notifications from the inbox.
 */
export const clearAllAppNotifications = async (): Promise<boolean> => {
  const db = await getDb();
  try {
    const sql = "DELETE FROM AppNotifications";
    const result = await db.runAsync(sql, []);
    return result.changes > 0;
  } catch (error) {
    console.error("Error clearing all notifications:", error);
    return false;
  }
};

/**
 * Automatically purges notifications older than retention days (default: 30 days).
 */
export const purgeOldAppNotifications = async (
  days: number = 30
): Promise<number> => {
  const db = await getDb();
  try {
    const sql = `DELETE FROM AppNotifications WHERE created_at < DATETIME('now', '-${days} days')`;
    const result = await db.runAsync(sql, []);
    return result.changes;
  } catch (error) {
    console.error("Error purging old notifications:", error);
    return 0;
  }
};
