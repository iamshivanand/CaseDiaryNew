// DataBase/index.ts
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { initializeSchema, CaseType, Court, District, PoliceStation, CaseDocument, Case as CaseRow, User } from './schema';

const DATABASE_NAME = "CaseDiary.db";
const DOCUMENTS_DIRECTORY = FileSystem.documentDirectory + "documents/";

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const __TEST_ONLY_resetDbInstance = () => {
  if (process.env.NODE_ENV === 'test') {
    dbInstance = null;
  } else {
    console.warn("__TEST_ONLY_resetDbInstance called outside of test environment. This is not allowed.");
  }
};

export const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (dbInstance === null) {
    try {
      const instance = await SQLite.openDatabaseAsync(DATABASE_NAME);
      console.log("Database opened successfully.");
      dbInstance = instance;
      await initializeSchema(dbInstance);
      await seedInitialData(dbInstance); // Ensure this is called after schema init
    } catch (error) {
      console.error("Failed to open or initialize database:", error);
      throw error;
    }
  }
  if (!dbInstance) {
    throw new Error("Database instance is null after attempting to open.");
  }
  return dbInstance;
};

// --- Seeding Initial Data ---
const PREDEFINED_DISTRICTS: Array<Omit<District, 'id' | 'user_id'>> = [
  { name: 'Bareilly', state: 'Uttar Pradesh' }, { name: 'Lucknow', state: 'Uttar Pradesh' }, // ... other districts
];
const PREDEFINED_CASE_TYPES: Array<Omit<CaseType, 'id' | 'user_id'>> = [
  { name: 'Civil' }, { name: 'Criminal' }, { name: 'Family' }, // ... other case types
];
// Courts are not predefined here, user will add them via profile.

export const seedInitialData = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  console.log("Attempting to seed initial data...");
  try {
    for (const caseType of PREDEFINED_CASE_TYPES) {
      const existing = await db.getFirstAsync<CaseType>("SELECT * FROM CaseTypes WHERE name = ? AND user_id IS NULL", [caseType.name]);
      if (!existing) {
        await db.runAsync("INSERT INTO CaseTypes (name, user_id) VALUES (?, NULL)", [caseType.name]);
        console.log(`Seeded CaseType: ${caseType.name}`);
      }
    }
    for (const district of PREDEFINED_DISTRICTS) {
      const existing = await db.getFirstAsync<District>("SELECT * FROM Districts WHERE name = ? AND state = ? AND user_id IS NULL", [district.name, district.state]);
      if (!existing) {
        await db.runAsync("INSERT INTO Districts (name, state, user_id) VALUES (?, ?, NULL)", [district.name, district.state]);
        console.log(`Seeded District: ${district.name}, ${district.state}`);
      }
    }
  } catch (error) { console.error("Error during initial data seeding:", error); }
  console.log("Initial data seeding process complete.");
};

// --- CRUD Operations for Lookups (CaseTypes, Courts, etc.) ---
// (Assuming addCaseType, getCaseTypes, etc. are correctly implemented as per previous versions)
export const addCaseType = async (name: string, userId?: number | null): Promise<number | null> => {
  const db = await getDb(); if (!name || name.trim() === "") throw new Error("Case type name cannot be empty.");
  const result = await db.runAsync("INSERT INTO CaseTypes (name, user_id) VALUES (?, ?)", [name.trim(), userId ?? null]); return result.lastInsertRowId;
};
export const getCaseTypes = async (userId?: number | null): Promise<CaseType[]> => {
  const db = await getDb(); let query = "SELECT * FROM CaseTypes WHERE user_id IS NULL"; const params: any[] = [];
  if (userId != null) { query += " OR user_id = ?"; params.push(userId); } query += " ORDER BY name ASC"; return db.getAllAsync<CaseType>(query, params);
};
// ... (updateCaseType, deleteCaseType - assuming they exist and are correct)
export const addCourt = async (name: string, userId?: number | null): Promise<number | null> => {
  const db = await getDb(); if (!name || name.trim() === "") throw new Error("Court name cannot be empty.");
  const result = await db.runAsync("INSERT INTO Courts (name, user_id) VALUES (?, ?)", [name.trim(), userId ?? null]); return result.lastInsertRowId;
};
export const getCourts = async (userId?: number | null): Promise<Court[]> => {
  const db = await getDb(); let query = "SELECT * FROM Courts WHERE user_id IS NULL"; const params: any[] = [];
  if (userId != null) { query += " OR user_id = ?"; params.push(userId); } query += " ORDER BY name ASC"; return db.getAllAsync<Court>(query, params);
};
// ... (updateCourt, deleteCourt)
// ... (similar functions for Districts, PoliceStations)


// --- Document Management ---
interface UploadOptions {
  originalFileName: string; fileType: string; fileUri: string; caseId: number; userId?: number | null; fileSize?: number | null;
}
export const uploadCaseDocument = async (options: UploadOptions): Promise<number | null> => {
  const db = await getDb(); const { originalFileName, fileType, fileUri, caseId, userId, fileSize } = options;
  const timestamp = Date.now(); const nameParts = originalFileName.split('.');
  const extension = nameParts.length > 1 ? nameParts.pop() : 'dat'; const baseName = nameParts.join('.');
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniqueStoredFileName = `${caseId}_${timestamp}_${sanitizedBaseName}.${extension}`;
  const mimeTypeForDb = fileType;
  try {
    const dirInfo = await FileSystem.getInfoAsync(DOCUMENTS_DIRECTORY);
    if (!dirInfo.exists) { await FileSystem.makeDirectoryAsync(DOCUMENTS_DIRECTORY, { intermediates: true }); }
    const destinationUri = DOCUMENTS_DIRECTORY + uniqueStoredFileName;
    await FileSystem.copyAsync({ from: fileUri, to: destinationUri });
    const result = await db.runAsync(
      "INSERT INTO CaseDocuments (case_id, stored_filename, original_display_name, file_type, file_size, user_id) VALUES (?, ?, ?, ?, ?, ?)",
      [caseId, uniqueStoredFileName, originalFileName, mimeTypeForDb, fileSize ?? null, userId ?? null]
    ); return result.lastInsertRowId;
  } catch (error) { console.error("Error uploading file:", error); return null; }
};
export const getCaseDocuments = async (caseId: number): Promise<CaseDocument[]> => {
  const db = await getDb(); return db.getAllAsync<CaseDocument>("SELECT * FROM CaseDocuments WHERE case_id = ? ORDER BY created_at DESC", [caseId]);
};
export const deleteCaseDocument = async (documentId: number): Promise<boolean> => {
  const db = await getDb(); const doc = await db.getFirstAsync<CaseDocument>("SELECT stored_filename FROM CaseDocuments WHERE id = ?", [documentId]);
  if (!doc) { console.warn(`Document with ID ${documentId} not found.`); return false; }
  const filePath = DOCUMENTS_DIRECTORY + doc.stored_filename;
  try {
    const result = await db.runAsync("DELETE FROM CaseDocuments WHERE id = ?", [documentId]);
    if (result.changes > 0) {
      const fileInfo = await FileSystem.getInfoAsync(filePath); if (fileInfo.exists) { await FileSystem.deleteAsync(filePath); }
      return true;
    } return false;
  } catch (error) { console.error(`Error deleting document ID ${documentId}:`, error); throw error; }
};
export const getFullDocumentPath = (storedFileName: string | null | undefined): string | null => {
  if (!storedFileName) return null; return DOCUMENTS_DIRECTORY + storedFileName;
};

// --- CRUD Operations for Cases ---
export type CaseInsertData = Omit<CaseRow, 'id' | 'created_at' | 'updated_at'>;
export type CaseUpdateData = Partial<Omit<CaseRow, 'id' | 'uniqueId' | 'created_at' | 'updated_at'>>;

export const addCase = async (caseData: CaseInsertData): Promise<number | null> => {
  const db = await getDb(); if (!caseData.uniqueId) throw new Error("uniqueId is required.");
  const validCaseData: { [key: string]: any } = {};
  for (const key in caseData) {
    if (Object.prototype.hasOwnProperty.call(caseData, key)) {
      const typedKey = key as keyof CaseInsertData;
      if (caseData[typedKey] !== undefined) validCaseData[typedKey] = caseData[typedKey];
    }
  }
  const fields = Object.keys(validCaseData).join(", ");
  const placeholders = Object.keys(validCaseData).map(() => "?").join(", ");
  const values = Object.values(validCaseData).map(val => (val === undefined ? null : val));
  if (!fields || values.length === 0) throw new Error("No valid fields for addCase.");
  try {
    const sql = `INSERT INTO Cases (${fields}) VALUES (${placeholders})`;
    console.log("Executing SQL for addCase:", sql, values);
    const result = await db.runAsync(sql, values); return result.lastInsertRowId;
  } catch (error) { console.error("Error adding case:", error, "SQL:", `INSERT INTO Cases (${fields}) VALUES (${placeholders})`, "Values:", values); throw error; }
};

export interface CaseWithDetails extends CaseRow {
  districtName?: string | null; policeStationName?: string | null;
}

export const getCases = async (userId?: number | null): Promise<CaseWithDetails[]> => {
  const db = await getDb();
  let sql = `SELECT c.*, ps.name as policeStationName, d.name as districtName FROM Cases c
             LEFT JOIN PoliceStations ps ON c.police_station_id = ps.id
             LEFT JOIN Districts d ON ps.district_id = d.id`;
  const params: any[] = [];
  if (userId != null) { sql += " WHERE c.user_id = ?"; params.push(userId); }
  sql += " ORDER BY c.updated_at DESC";
  return db.getAllAsync<CaseWithDetails>(sql, params);
};

export const getCaseById = async (id: number, userId?: number | null): Promise<CaseWithDetails | null> => {
  const db = await getDb();
  let sql = `SELECT c.*, ps.name as policeStationName, d.name as districtName FROM Cases c
             LEFT JOIN PoliceStations ps ON c.police_station_id = ps.id
             LEFT JOIN Districts d ON ps.district_id = d.id
             WHERE c.id = ?`;
  const params: any[] = [id];
  if (userId != null) { sql += " AND c.user_id = ?"; params.push(userId); }
  const result = await db.getFirstAsync<CaseWithDetails>(sql, params); return result ?? null;
};

export const updateCase = async (id: number, data: CaseUpdateData, actorUserId?: number | null): Promise<boolean> => {
  const db = await getDb(); const currentCaseData = await getCaseById(id, actorUserId);
  if (!currentCaseData) { console.warn(`Case ${id} not found or not accessible.`); return false; }
  const validUpdateData: { [key: string]: any } = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const typedKey = key as keyof CaseUpdateData;
      if (data[typedKey] !== undefined) validUpdateData[typedKey] = data[typedKey];
    }
  }
  if (Object.keys(validUpdateData).length === 0) { console.warn("No fields for update."); return false; }
  const fieldsToUpdate = Object.keys(validUpdateData).map(key => `${key} = ?`).join(", ");
  const valuesToUpdate = Object.values(validUpdateData).map(val => (val === undefined ? null : val));
  valuesToUpdate.push(id);
  let sql = `UPDATE Cases SET ${fieldsToUpdate} WHERE id = ?`;
  console.log("Executing SQL for updateCase:", sql, valuesToUpdate);
  try {
    const result = await db.runAsync(sql, valuesToUpdate);
    if (result.changes > 0) {
      await logCaseChanges(id, currentCaseData, data, actorUserId); return true;
    } return false;
  } catch (error) { console.error(`Error updating case ID ${id}:`, error, "SQL:", sql, "Values:", valuesToUpdate); throw error; }
};

const TRACKED_CASE_FIELDS: Array<keyof Omit<CaseRow, 'id' | 'uniqueId' | 'created_at' | 'updated_at'>> = [
  'user_id', 'CaseTitle', 'ClientName', 'OnBehalfOf', 'CNRNumber', 'case_number', 'case_year',
  'court_id', 'court_name', 'case_type_id', 'case_type_name',
  'dateFiled', 'NextDate', 'PreviousDate', 'StatuteOfLimitations',
  'crime_number', 'crime_year', 'police_station_id', 'Undersection',
  'FirstParty', 'OppositeParty', 'Accussed', 'ClientContactNumber',
  'JudgeName', 'OpposingCounsel', 'OppositeAdvocate', 'OppAdvocateContactNumber',
  'CaseStatus', 'Priority', 'CaseDescription', 'CaseNotes'
];
// (addCaseHistoryEntry and logCaseChanges as previously defined, assuming they are correct)
interface CaseHistoryLogEntryData { case_id: number; field_changed: string; old_value: string | null; new_value: string | null; user_id?: number | null; }
export const addCaseHistoryEntry = async (entry: CaseHistoryLogEntryData): Promise<number | null> => { /* ... as before ... */ return null; };
const logCaseChanges = async (caseId: number, oldData: CaseRow, newData: CaseUpdateData, actorUserId?: number | null) => { /* ... as before ... */ };


export const deleteCase = async (id: number, userId?: number | null): Promise<boolean> => { /* ... as before ... */ return false; };

export const searchCases = async (query: string, userId?: number | null): Promise<CaseWithDetails[]> => {
    const db = await getDb();
    const searchQuery = `%${query}%`;
    let sql = `
        SELECT c.*, ps.name as policeStationName, d.name as districtName
        FROM Cases c
        LEFT JOIN PoliceStations ps ON c.police_station_id = ps.id
        LEFT JOIN Districts d ON ps.district_id = d.id
        WHERE (
            c.uniqueId LIKE ? OR c.CaseTitle LIKE ? OR c.ClientName LIKE ? OR c.CNRNumber LIKE ? OR
            c.case_number LIKE ? OR c.court_name LIKE ? OR c.case_type_name LIKE ? OR
            c.JudgeName LIKE ? OR c.OnBehalfOf LIKE ? OR c.FirstParty LIKE ? OR
            c.OppositeParty LIKE ? OR c.OpposingCounsel LIKE ? OR c.Accussed LIKE ? OR
            c.Undersection LIKE ? OR c.CaseStatus LIKE ? OR c.Priority LIKE ? OR
            c.CaseDescription LIKE ? OR c.CaseNotes LIKE ? OR c.StatuteOfLimitations LIKE ? OR
            ps.name LIKE ? OR d.name LIKE ?
        )
    `; // Total 21 '?'
    const params: any[] = Array(21).fill(searchQuery);

    if (userId !== undefined && userId !== null) {
        sql += " AND c.user_id = ?";
        params.push(userId);
    }
    sql += " ORDER BY c.updated_at DESC";
    console.log("Search SQL:", sql); // Log search SQL
    return db.getAllAsync<CaseWithDetails>(sql, params);
};
