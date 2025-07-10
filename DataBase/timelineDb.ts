// DataBase/timelineDb.ts
import { getDb } from './connection'; // Changed import path for getDb
import { TimelineEventRow } from './schema';

export type TimelineEventInsertData = Omit<TimelineEventRow, 'id' | 'created_at' | 'updated_at'>;
export type TimelineEventUpdateData = Partial<Omit<TimelineEventRow, 'id' | 'case_id' | 'created_at' | 'updated_at' | 'user_id'>>;

// Add a new timeline event
export const addTimelineEvent = async (eventData: TimelineEventInsertData): Promise<number | null> => {
  const db = await getDb();
  if (!eventData.case_id || !eventData.event_date || !eventData.description) {
    throw new Error("Case ID, event date, and description are required for a timeline event.");
  }

  const fields = Object.keys(eventData).join(", ");
  const placeholders = Object.keys(eventData).map(() => "?").join(", ");
  const values = Object.values(eventData).map(val => val === undefined ? null : val);

  try {
    const sql = `INSERT INTO TimelineEvents (${fields}) VALUES (${placeholders})`;
    console.log("Executing SQL for addTimelineEvent:", sql, values);
    const result = await db.runAsync(sql, values);
    return result.lastInsertRowId;
  } catch (error) {
    console.error("Error adding timeline event:", error);
    throw error;
  }
};

// Get all timeline events for a specific case
export const getTimelineEventsByCaseId = async (caseId: number): Promise<TimelineEventRow[]> => {
  const db = await getDb();
  try {
    const sql = "SELECT * FROM TimelineEvents WHERE case_id = ? ORDER BY event_date DESC, created_at DESC";
    return await db.getAllAsync<TimelineEventRow>(sql, [caseId]);
  } catch (error) {
    console.error(`Error fetching timeline events for case ID ${caseId}:`, error);
    throw error;
  }
};

// Update an existing timeline event
export const updateTimelineEvent = async (eventId: number, data: TimelineEventUpdateData): Promise<boolean> => {
  const db = await getDb();
  if (Object.keys(data).length === 0) {
    console.warn("No fields provided for timeline event update.");
    return false;
  }

  // Filter out undefined values, only update provided fields
  const validUpdateData: { [key: string]: any } = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const typedKey = key as keyof TimelineEventUpdateData;
      if (data[typedKey] !== undefined) {
        validUpdateData[typedKey] = data[typedKey];
      }
    }
  }
  if (Object.keys(validUpdateData).length === 0) {
     console.warn("No valid fields after filtering undefined for timeline event update.");
    return false;
  }

  const fieldsToUpdate = Object.keys(validUpdateData).map(key => `${key} = ?`).join(", ");
  const valuesToUpdate = Object.values(validUpdateData).map(val => val === undefined ? null : val);
  valuesToUpdate.push(eventId); // For the WHERE id = ?

  try {
    const sql = `UPDATE TimelineEvents SET ${fieldsToUpdate} WHERE id = ?`;
    console.log("Executing SQL for updateTimelineEvent:", sql, valuesToUpdate);
    const result = await db.runAsync(sql, valuesToUpdate);
    return result.changes > 0;
  } catch (error) {
    console.error(`Error updating timeline event ID ${eventId}:`, error);
    throw error;
  }
};

// Delete a timeline event
export const deleteTimelineEvent = async (eventId: number): Promise<boolean> => {
  const db = await getDb();
  try {
    const sql = "DELETE FROM TimelineEvents WHERE id = ?";
    console.log("Executing SQL for deleteTimelineEvent:", sql, [eventId]);
    const result = await db.runAsync(sql, [eventId]);
    return result.changes > 0;
  } catch (error) {
    console.error(`Error deleting timeline event ID ${eventId}:`, error);
    throw error;
  }
};
