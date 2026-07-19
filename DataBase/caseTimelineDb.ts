// DataBase/caseTimelineDb.ts
import { getDb } from './connection';
import { CaseTimelineRow } from './schema';

export type CaseTimelineInsertData = Omit<CaseTimelineRow, 'id' | 'created_at' | 'updated_at'>;

// Add a new timeline event
export const addCaseTimelineEvent = async (eventData: CaseTimelineInsertData): Promise<number | null> => {
  const db = await getDb();
  if (!eventData.case_id || !eventData.hearing_date) {
    throw new Error("Case ID and hearing date are required for a timeline event.");
  }

  const fields = Object.keys(eventData).join(", ");
  const placeholders = Object.keys(eventData).map(() => "?").join(", ");
  const values = Object.values(eventData).map(val => val === undefined ? null : val);

  try {
    const sql = `INSERT INTO CaseTimeline (${fields}) VALUES (${placeholders})`;
    console.log("Executing SQL for addCaseTimelineEvent:", sql, values);
    const result = await db.runAsync(sql, values);
    return result.lastInsertRowId;
  } catch (error) {
    console.error("Error adding case timeline event:", error);
    throw error;
  }
};

// Get all timeline events for a specific case
export const getCaseTimelineEventsByCaseId = async (caseId: number): Promise<CaseTimelineRow[]> => {
  const db = await getDb();
  try {
    const sql = "SELECT * FROM CaseTimeline WHERE case_id = ? ORDER BY hearing_date DESC, created_at DESC";
    return await db.getAllAsync<CaseTimelineRow>(sql, [caseId]);
  } catch (error) {
    console.error(`Error fetching case timeline events for case ID ${caseId}:`, error);
    throw error;
  }
};

export const updateCaseTimelineEvent = async (id: number, data: { hearing_date?: string; notes?: string }): Promise<boolean> => {
  const db = await getDb();
  const fields: string[] = [];
  const values: any[] = [];
  if (data.hearing_date !== undefined) {
    fields.push("hearing_date = ?");
    values.push(data.hearing_date);
  }
  if (data.notes !== undefined) {
    fields.push("notes = ?");
    values.push(data.notes);
  }
  if (fields.length === 0) return false;
  values.push(id);
  try {
    const result = await db.runAsync(`UPDATE CaseTimeline SET ${fields.join(", ")}, updated_at = STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW') WHERE id = ?`, values);
    return result.changes > 0;
  } catch (error) {
    console.error(`Error updating timeline event ID ${id}:`, error);
    throw error;
  }
};

export const deleteCaseTimelineEvent = async (id: number): Promise<boolean> => {
  const db = await getDb();
  try {
    const result = await db.runAsync("DELETE FROM CaseTimeline WHERE id = ?", [id]);
    return result.changes > 0;
  } catch (error) {
    console.error(`Error deleting timeline event ID ${id}:`, error);
    throw error;
  }
};
