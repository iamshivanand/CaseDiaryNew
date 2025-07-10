// DataBase/index.ts
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { initializeSchema, CaseType, Court, District, PoliceStation, CaseDocument, Case as CaseRow, User } from './schema'; // Assuming Case is renamed to CaseRow to avoid conflict

const DATABASE_NAME = "CaseDiary.db";
const DOCUMENTS_DIRECTORY = FileSystem.documentDirectory + "documents/";


let dbInstance: SQLite.SQLiteDatabase | null = null;

// --- Database Initialization and Connection Management ---

/**
 * ONLY FOR TEST ENVIRONMENTS. Clears the singleton dbInstance.
 */
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
      await seedInitialData(dbInstance);
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
  { name: 'Bareilly', state: 'Uttar Pradesh' },
  { name: 'Lucknow', state: 'Uttar Pradesh' },
  { name: 'Mumbai City', state: 'Maharashtra' },
  { name: 'South Delhi', state: 'Delhi' },
  { name: 'North Goa', state: 'Goa' },
  { name: 'Jaipur', state: 'Rajasthan' },
  { name: 'Patna', state: 'Bihar' },
  { name: 'Kolkata', state: 'West Bengal' },
  { name: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Bangalore Urban', state: 'Karnataka' },
];

const PREDEFINED_CASE_TYPES: Array<Omit<CaseType, 'id' | 'user_id'>> = [
  { name: 'Civil' },
  { name: 'Criminal' },
  { name: 'Family' },
  { name: 'Writ' },
  { name: 'Corporate' },
  { name: 'Revenue' },
  { name: 'Consumer' },
  { name: 'Labour' },
  { name: 'Arbitration' },
  { name: 'Service Matter' },
];

export const seedInitialData = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  console.log("Attempting to seed initial data...");

  // Seed Case Types
  try {
    for (const caseType of PREDEFINED_CASE_TYPES) {
      const existing = await db.getFirstAsync<CaseType>(
        "SELECT * FROM CaseTypes WHERE name = ? AND user_id IS NULL",
        [caseType.name]
      );
      if (!existing) {
        await db.runAsync("INSERT INTO CaseTypes (name, user_id) VALUES (?, NULL)", [caseType.name]);
        console.log(`Seeded CaseType: ${caseType.name}`);
      }
    }
  } catch (error) {
    console.error("Error seeding case types:", error);
  }

  // Seed Districts
  try {
    for (const district of PREDEFINED_DISTRICTS) {
      const existing = await db.getFirstAsync<District>(
        "SELECT * FROM Districts WHERE name = ? AND state = ? AND user_id IS NULL",
        [district.name, district.state]
      );
      if (!existing) {
        await db.runAsync("INSERT INTO Districts (name, state, user_id) VALUES (?, ?, NULL)", [
          district.name,
          district.state,
        ]);
        console.log(`Seeded District: ${district.name}, ${district.state}`);
      }
    }
  } catch (error) {
    console.error("Error seeding districts:", error);
  }
  console.log("Initial data seeding process complete.");
};


// --- CRUD Operations for CaseTypes ---
export const addCaseType = async (name: string, userId?: number | null): Promise<number | null> => {
  const db = await getDb();
  if (!name || name.trim() === "") {
    throw new Error("Case type name cannot be empty.");
  }
  try {
    const result = await db.runAsync(
      "INSERT INTO CaseTypes (name, user_id) VALUES (?, ?)",
      [name.trim(), userId ?? null]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error(`Error adding case type "${name}":`, error);
    throw error;
  }
};

export const getCaseTypes = async (userId?: number | null): Promise<CaseType[]> => {
  const db = await getDb();
  let query = "SELECT * FROM CaseTypes WHERE user_id IS NULL";
  const params: (number | string | null)[] = []; // Adjusted type for params

  if (userId !== undefined && userId !== null) {
    query += " OR user_id = ?";
    params.push(userId);
  }
  query += " ORDER BY name ASC";

  return db.getAllAsync<CaseType>(query, params);
};

export const updateCaseType = async (id: number, name: string, userId: number): Promise<boolean> => {
  const db = await getDb();
  if (!name || name.trim() === "") {
    throw new Error("Case type name cannot be empty.");
  }
  try {
    const result = await db.runAsync(
      "UPDATE CaseTypes SET name = ? WHERE id = ? AND user_id = ?",
      [name.trim(), id, userId]
    );
    return result.changes > 0;
  } catch (error) {
    console.error(`Error updating case type ID ${id}:`, error);
    throw error;
  }
};

export const deleteCaseType = async (id: number, userId: number): Promise<boolean> => {
  const db = await getDb();
  try {
    const result = await db.runAsync(
      "DELETE FROM CaseTypes WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    return result.changes > 0;
  } catch (error) {
    console.error(`Error deleting case type ID ${id}:`, error);
    throw error;
  }
};

// --- CRUD Operations for Courts ---
export const addCourt = async (name: string, userId?: number | null): Promise<number | null> => {
  const db = await getDb();
  if (!name || name.trim() === "") throw new Error("Court name cannot be empty.");
  try {
    const result = await db.runAsync("INSERT INTO Courts (name, user_id) VALUES (?, ?)", [name.trim(), userId ?? null]);
    return result.lastInsertRowId;
  } catch (error) { console.error(`Error adding court "${name}":`, error); throw error; }
};

export const getCourts = async (userId?: number | null): Promise<Court[]> => {
  const db = await getDb();
  let query = "SELECT * FROM Courts WHERE user_id IS NULL";
  const params: (number | string | null)[] = [];
  if (userId !== undefined && userId !== null) { query += " OR user_id = ?"; params.push(userId); }
  query += " ORDER BY name ASC";
  return db.getAllAsync<Court>(query, params);
};

export const updateCourt = async (id: number, name: string, userId: number): Promise<boolean> => {
  const db = await getDb();
  if (!name || name.trim() === "") throw new Error("Court name cannot be empty.");
  try {
    const result = await db.runAsync("UPDATE Courts SET name = ? WHERE id = ? AND user_id = ?", [name.trim(), id, userId]);
    return result.changes > 0;
  } catch (error) { console.error(`Error updating court ID ${id}:`, error); throw error; }
};

export const deleteCourt = async (id: number, userId: number): Promise<boolean> => {
  const db = await getDb();
  try {
    const result = await db.runAsync("DELETE FROM Courts WHERE id = ? AND user_id = ?", [id, userId]);
    return result.changes > 0;
  } catch (error) { console.error(`Error deleting court ID ${id}:`, error); throw error; }
};


// --- CRUD Operations for Districts ---
export const addDistrict = async (name: string, state?: string | null, userId?: number | null): Promise<number | null> => {
  const db = await getDb();
  if (!name || name.trim() === "") throw new Error("District name cannot be empty.");
  try {
    const result = await db.runAsync(
      "INSERT INTO Districts (name, state, user_id) VALUES (?, ?, ?)",
      [name.trim(), state ?? null, userId ?? null]
    );
    return result.lastInsertRowId;
  } catch (error) { console.error(`Error adding district "${name}":`, error); throw error; }
};

export const getDistricts = async (userId?: number | null): Promise<District[]> => {
  const db = await getDb();
  let query = "SELECT * FROM Districts WHERE user_id IS NULL";
  const params: (number | string | null)[] = [];
  if (userId !== undefined && userId !== null) { query += " OR user_id = ?"; params.push(userId); }
  query += " ORDER BY state ASC, name ASC";
  return db.getAllAsync<District>(query, params);
};

// Add update and delete for Districts if user-added districts should be manageable.

// --- CRUD Operations for PoliceStations ---
export const addPoliceStation = async (name: string, districtId?: number | null, userId?: number | null): Promise<number | null> => {
  const db = await getDb();
  if (!name || name.trim() === "") throw new Error("Police station name cannot be empty.");
  try {
    const result = await db.runAsync(
      "INSERT INTO PoliceStations (name, district_id, user_id) VALUES (?, ?, ?)",
      [name.trim(), districtId ?? null, userId ?? null]
    );
    return result.lastInsertRowId;
  } catch (error) { console.error(`Error adding police station "${name}":`, error); throw error; }
};

export const getPoliceStations = async (districtId?: number | null, userId?: number | null): Promise<PoliceStation[]> => {
  const db = await getDb();
  let query = "SELECT * FROM PoliceStations WHERE 1=1"; // Start with a true condition
  const params: (number | string | null)[] = [];

  if (districtId !== undefined && districtId !== null) {
    query += " AND district_id = ?";
    params.push(districtId);
  }
  // Filter by global and user-specific
  query += " AND (user_id IS NULL";
  if (userId !== undefined && userId !== null) {
    query += " OR user_id = ?";
    params.push(userId);
  }
  query += ")";
  query += " ORDER BY name ASC";
  return db.getAllAsync<PoliceStation>(query, params);
};
// Add update and delete for PoliceStations if user-added stations should be manageable.


// --- Document Management ---
interface UploadOptions {
  originalFileName: string;
  fileType: string;
  fileUri: string;
  caseId: number;
  userId?: number | null;
  fileSize?: number | null;
}

export const uploadCaseDocument = async (options: UploadOptions): Promise<number | null> => {
  const db = await getDb();
  const { originalFileName, fileType, fileUri, caseId, userId, fileSize } = options;

  const timestamp = Date.now();
  const sanitizedOriginalFileName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueStoredFileName = `${caseId}_${timestamp}_${sanitizedOriginalFileName}.${fileType}`;

  try {
    const dirInfo = await FileSystem.getInfoAsync(DOCUMENTS_DIRECTORY);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(DOCUMENTS_DIRECTORY, { intermediates: true });
    }

    const destinationUri = DOCUMENTS_DIRECTORY + uniqueStoredFileName;
    await FileSystem.copyAsync({ from: fileUri, to: destinationUri });

    const result = await db.runAsync(
      "INSERT INTO CaseDocuments (case_id, stored_filename, original_display_name, file_type, file_size, user_id) VALUES (?, ?, ?, ?, ?, ?)",
      [caseId, uniqueStoredFileName, originalFileName, fileType, fileSize ?? null, userId ?? null]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error("Error uploading file:", error);
    return null;
  }
};

export const getCaseDocuments = async (caseId: number): Promise<CaseDocument[]> => {
  const db = await getDb();
  return db.getAllAsync<CaseDocument>("SELECT * FROM CaseDocuments WHERE case_id = ? ORDER BY created_at DESC", [caseId]);
};

export const deleteCaseDocument = async (documentId: number): Promise<boolean> => {
  const db = await getDb();
  const doc = await db.getFirstAsync<CaseDocument>("SELECT stored_filename FROM CaseDocuments WHERE id = ?", [documentId]);
  if (!doc) {
    console.warn(`Document with ID ${documentId} not found for deletion.`);
    return false;
  }
  const filePath = DOCUMENTS_DIRECTORY + doc.stored_filename;
  try {
    const result = await db.runAsync("DELETE FROM CaseDocuments WHERE id = ?", [documentId]);
    if (result.changes > 0) {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath);
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error deleting document ID ${documentId}:`, error);
    throw error;
  }
};

export const getFullDocumentPath = (storedFileName: string | null | undefined): string | null => {
  if (!storedFileName) return null;
  return DOCUMENTS_DIRECTORY + storedFileName;
};

export const checkFileExists = async (filePath: string): Promise<boolean> => {
  try {
    const { exists } = await FileSystem.getInfoAsync(filePath);
    return exists;
  } catch (error) {
    console.error("Error checking file existence:", error);
    return false;
  }
};

// --- CRUD Operations for Cases ---
// Using CaseRow from schema.ts to avoid conflict with React Case keyword
export type CaseInsertData = Omit<CaseRow, 'id' | 'created_at' | 'updated_at'>;
export type CaseUpdateData = Partial<Omit<CaseRow, 'id' | 'uniqueId' | 'created_at' | 'updated_at'>>;


export const addCase = async (caseData: CaseInsertData): Promise<number | null> => {
    const db = await getDb();
    // Ensure uniqueId is present
    if (!caseData.uniqueId) {
        throw new Error("uniqueId is required to add a case.");
    }

    const fields = Object.keys(caseData).join(", ");
    const placeholders = Object.keys(caseData).map(() => "?").join(", ");
    const values = Object.values(caseData);

    try {
        const result = await db.runAsync(
            `INSERT INTO Cases (${fields}) VALUES (${placeholders})`,
            values
        );
        return result.lastInsertRowId;
    } catch (error) {
        console.error("Error adding case:", error);
        throw error;
    }
};

export interface CaseWithDetails extends CaseRow {
  caseTypeName?: string;
  courtName?: string;
  districtName?: string; // From PoliceStation -> District
  policeStationName?: string;
  // Add other joined names as needed
}

export const getCases = async (userId?: number | null): Promise<CaseWithDetails[]> => {
    const db = await getDb();
    // Basic query, can be expanded with more joins and filters
    let sql = `
        SELECT
            c.*,
            ct.name as caseTypeName,
            co.name as courtName,
            ps.name as policeStationName,
            d.name as districtName
        FROM Cases c
        LEFT JOIN CaseTypes ct ON c.case_type_id = ct.id
        LEFT JOIN Courts co ON c.court_id = co.id
        LEFT JOIN PoliceStations ps ON c.police_station_id = ps.id
        LEFT JOIN Districts d ON ps.district_id = d.id
    `;
    const params: (number | string)[] = [];
    if (userId !== undefined && userId !== null) {
        sql += " WHERE c.user_id = ?"; // Assuming cases are filtered by user_id
        params.push(userId);
    }
    sql += " ORDER BY c.updated_at DESC"; // Or NextDate, etc.

    return db.getAllAsync<CaseWithDetails>(sql, params);
};

export const getCaseById = async (id: number, userId?: number | null): Promise<CaseWithDetails | null> => {
    const db = await getDb();
     let sql = `
        SELECT
            c.*,
            ct.name as caseTypeName,
            co.name as courtName,
            ps.name as policeStationName,
            d.name as districtName
        FROM Cases c
        LEFT JOIN CaseTypes ct ON c.case_type_id = ct.id
        LEFT JOIN Courts co ON c.court_id = co.id
        LEFT JOIN PoliceStations ps ON c.police_station_id = ps.id
        LEFT JOIN Districts d ON ps.district_id = d.id
        WHERE c.id = ?
    `;
    const params: (number | string)[] = [id];

    if (userId !== undefined && userId !== null) {
        sql += " AND c.user_id = ?";
        params.push(userId);
    }
    const result = await db.getFirstAsync<CaseWithDetails>(sql, params);
    return result ?? null;
};


export const updateCase = async (id: number, data: CaseUpdateData, actorUserId?: number | null): Promise<boolean> => {
    const db = await getDb();
    // Fetch the current state of the case *before* the update
    // Pass actorUserId to getCaseById if you want to enforce that the user initiating the update owns the case or has rights
    const currentCaseData = await getCaseById(id, actorUserId);

    if (!currentCaseData) {
        console.warn(`Case with id ${id} not found or not accessible by user ${actorUserId}.`);
        return false;
    }

    const updatableData = { ...data };
    const fieldsToUpdate = Object.keys(updatableData).map(key => `${key} = ?`).join(", ");
    if (!fieldsToUpdate) {
        console.warn("No fields provided for update.");
        return false; // No actual fields to update
    }

    const valuesToUpdate = Object.values(updatableData);
    valuesToUpdate.push(id); // For the WHERE id = ?

    let sql = `UPDATE Cases SET ${fieldsToUpdate} WHERE id = ?`;
    const queryParams: any[] = [...valuesToUpdate];

    // If you want to ensure the case being updated belongs to the actorUserId (if provided)
    // This is an additional check beyond what getCaseById might do if actorUserId is for general fetching permission
    if (actorUserId !== undefined && actorUserId !== null && currentCaseData.user_id === actorUserId) {
        // This is fine, user is updating their own case.
        // If cases can be updated by users other than the owner (e.g. an admin), this logic needs adjustment.
    } else if (actorUserId !== undefined && actorUserId !== null && currentCaseData.user_id !== actorUserId) {
        // console.warn(`User ${actorUserId} attempting to update case ${id} owned by ${currentCaseData.user_id}.`);
        // Decide if this should be an error or if specific fields are allowed to be updated by others.
        // For now, let's assume only owner or system (actorUserId=null) can update.
        // If actorUserId is provided but doesn't match case owner, this might be an issue.
        // For simplicity, the getCaseById check should handle most ownership concerns for now.
    }

    try {
        const result = await db.runAsync(sql, queryParams);
        if (result.changes > 0) {
            // Log changes to CaseHistoryLog
            // Important: 'data' contains the new values. 'currentCaseData' contains old values.
            // Ensure currentCaseData and data are properly typed for key access.
            await logCaseChanges(id, currentCaseData as CaseRow, data as CaseUpdateData, actorUserId);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Error updating case ID ${id}:`, error);
        throw error;
    }
};

// --- Case History Log ---
interface CaseHistoryLogEntryData {
  case_id: number;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
  user_id?: number | null; // The user who performed the action
}

export const addCaseHistoryEntry = async (entry: CaseHistoryLogEntryData): Promise<number | null> => {
  const db = await getDb();
  try {
    const result = await db.runAsync(
      "INSERT INTO CaseHistoryLog (case_id, user_id, field_changed, old_value, new_value, timestamp) VALUES (?, ?, ?, ?, ?, STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))",
      [entry.case_id, entry.user_id ?? null, entry.field_changed, entry.old_value, entry.new_value]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error("Error adding case history entry:", error);
    throw error;
  }
};

// Define which fields of the CaseRow should be tracked for history.
// This helps in iterating and logging changes only for relevant fields.
// Exclude 'id', 'uniqueId', 'created_at', 'updated_at' as they are metadata or immutable.
const TRACKED_CASE_FIELDS: Array<keyof Omit<CaseRow, 'id' | 'uniqueId' | 'created_at' | 'updated_at'>> = [
  'user_id', 'CNRNumber', 'court_id', 'dateFiled', 'case_type_id',
  'case_number', 'case_year', 'crime_number', 'crime_year',
  'OnBehalfOf', 'FirstParty', 'OppositeParty', 'ClientContactNumber', 'Accussed',
  'Undersection', 'police_station_id',
  'OppositeAdvocate', 'OppAdvocateContactNumber',
  'CaseStatus', 'PreviousDate', 'NextDate'
];

const logCaseChanges = async (
    caseId: number,
    oldData: CaseRow, // Full old case data
    newData: CaseUpdateData, // Partial new data
    actorUserId?: number | null
) => {
    for (const key of TRACKED_CASE_FIELDS) {
        // Check if the field is present in newData and has changed
        if (newData.hasOwnProperty(key)) {
            const oldValue = oldData[key] !== undefined && oldData[key] !== null ? String(oldData[key]) : null;
            const newValue = newData[key] !== undefined && newData[key] !== null ? String(newData[key]) : null;

            if (oldValue !== newValue) {
                await addCaseHistoryEntry({
                    case_id: caseId,
                    field_changed: key,
                    old_value: oldValue,
                    new_value: newValue,
                    user_id: actorUserId
                });
            }
        }
    }
    // Special handling for PreviousDate if NextDate is changed (as per original logic)
    // This logic might be redundant if NextDate changes are already logged by the loop above,
    // but kept if explicit PreviousDate update is desired.
    if (newData.NextDate && newData.NextDate !== oldData.NextDate) {
        // The updateCase function already handles setting PreviousDate = old NextDate in the DB.
        // The change to NextDate itself is logged by the loop above.
        // If PreviousDate is also a field in newData and changed independently, it's logged.
        // If PreviousDate is ONLY changed implicitly when NextDate changes,
        // and not part of `newData` from the client, then its change isn't logged by the loop.
        // However, the `updateCase` in the plan was supposed to handle this.
        // Let's assume the `updateCase` in the DB would have set `PreviousDate = oldData.NextDate`
        // So, if `PreviousDate` is part of `TRACKED_CASE_FIELDS`, its change will be logged.
        // The current `updateCase` does not explicitly set `PreviousDate`.
        // This implies `PreviousDate` must be sent in the `data` payload if it needs to be updated.
    }
};


export const deleteCase = async (id: number, userId?: number | null): Promise<boolean> => {
    const db = await getDb();
    // Also delete associated documents from filesystem
    const documents = await getCaseDocuments(id);
    for (const doc of documents) {
        const filePath = getFullDocumentPath(doc.stored_filename);
        if (filePath) {
            try {
                const fileInfo = await FileSystem.getInfoAsync(filePath);
                if (fileInfo.exists) {
                    await FileSystem.deleteAsync(filePath);
                }
            } catch (e) { console.error("Error deleting file for case:", e); }
        }
    }
    // Deleting from Cases table will cascade to CaseDocuments and CaseHistoryLog due to FK constraints
    let sql = "DELETE FROM Cases WHERE id = ?";
    const params: (number|string)[] = [id];
    if (userId !== undefined && userId !== null) {
        sql += " AND user_id = ?";
        params.push(userId);
    }
    try {
        const result = await db.runAsync(sql, params);
        return result.changes > 0;
    } catch (error) {
        console.error(`Error deleting case ID ${id}:`, error);
        throw error;
    }
};


// --- Suggestions --- (Refactored from old getSuggestions)
export const getSuggestionsForField = async (
    fieldName: 'CaseTypes' | 'Courts' | 'Districts' | 'PoliceStations', // Add more as needed
    userId?: number | null,
    districtIdForPoliceStations?: number | null // Only for PoliceStations
): Promise<Array<{id: number, name: string}>> => {
    // This is a simplified version. In a real app, you might want more specific suggestion functions.
    const db = await getDb();
    let results: Array<{id: number, name: string}> = [];

    switch (fieldName) {
        case 'CaseTypes':
            results = await getCaseTypes(userId);
            break;
        case 'Courts':
            results = await getCourts(userId);
            break;
        case 'Districts':
            results = await getDistricts(userId);
            break;
        case 'PoliceStations':
            results = await getPoliceStations(districtIdForPoliceStations, userId);
            break;
        default:
            console.warn(`Suggestions not implemented for field: ${fieldName}`);
            return [];
    }
    return results.map(item => ({ id: item.id, name: item.name }));
};


export const searchCases = async (query: string, userId?: number | null): Promise<CaseWithDetails[]> => {
    const db = await getDb();
    const searchQuery = `%${query}%`;
    let sql = `
        SELECT
            c.*,
            ct.name as caseTypeName,
            co.name as courtName,
            ps.name as policeStationName,
            d.name as districtName
        FROM Cases c
        LEFT JOIN CaseTypes ct ON c.case_type_id = ct.id
        LEFT JOIN Courts co ON c.court_id = co.id
        LEFT JOIN PoliceStations ps ON c.police_station_id = ps.id
        LEFT JOIN Districts d ON ps.district_id = d.id
        WHERE (
            c.uniqueId LIKE ? OR
            c.CNRNumber LIKE ? OR
            c.case_number LIKE ? OR
            c.FirstParty LIKE ? OR
            c.OppositeParty LIKE ? OR
            c.Accussed LIKE ? OR
            c.Undersection LIKE ? OR
            ct.name LIKE ? OR
            co.name LIKE ? OR
            ps.name LIKE ? OR
            d.name LIKE ?
        )
    `;
    const params: any[] = [
        searchQuery, searchQuery, searchQuery, searchQuery,
        searchQuery, searchQuery, searchQuery, searchQuery,
        searchQuery, searchQuery, searchQuery
    ];

    if (userId !== undefined && userId !== null) {
        sql += " AND c.user_id = ?";
        params.push(userId);
    }
    sql += " ORDER BY c.updated_at DESC";

    return db.getAllAsync<CaseWithDetails>(sql, params);
};
