// DataBase/index.ts
import { eq, and } from "drizzle-orm";
import * as FileSystem from "expo-file-system";

// SQLite import might not be directly needed here if all DB interactions use getDb()
// import * as SQLite from 'expo-sqlite';

// getDb is now imported from connection.ts
import { getDb, getDrizzleDb, __TEST_ONLY_resetDbInstance } from "./connection";
import { Cases as drizzleCases } from "./drizzleSchema";
import {
  CaseType,
  Court,
  District,
  PoliceStation,
  CaseDocument,
  Case as CaseRow,
  User,
  DocumentDraft,
} from "./schema";
import { notifyCaseUpdated } from "../utils/caseEvents";
import {
  getLocalDateString,
  normalizeDateToYYYYMMDD,
} from "../utils/commonFunctions";
import {
  scheduleCaseReminder,
  cancelCaseReminder,
} from "../utils/notificationScheduler";

// Re-export getDb so it's available when importing from './DataBase'
export { getDb, getDrizzleDb };

const DOCUMENTS_DIRECTORY = FileSystem.documentDirectory + "documents/";

// --- Seeding Initial Data constants are moved to schema.ts with seedInitialData function ---

// --- CRUD Operations for Lookups (CaseTypes, Courts, etc.) ---
// These functions will now use the imported getDb
export const addCaseType = async (
  name: string,
  userId?: number | null
): Promise<number | null> => {
  const db = await getDb();
  if (!name || name.trim() === "")
    throw new Error("Case type name cannot be empty.");
  const trimmed = name.trim();
  const existing = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM CaseTypes WHERE LOWER(name) = LOWER(?) AND (user_id IS NULL OR user_id = ?)",
    [trimmed, userId ?? null]
  );
  if (existing) {
    return existing.id;
  }
  const result = await db.runAsync(
    "INSERT INTO CaseTypes (name, user_id) VALUES (?, ?)",
    [trimmed, userId ?? null]
  );
  return result.lastInsertRowId;
};
export const getCaseTypes = async (
  userId?: number | null
): Promise<CaseType[]> => {
  const db = await getDb();
  let query = "SELECT * FROM CaseTypes WHERE user_id IS NULL";
  const params: any[] = [];
  if (userId != null) {
    query += " OR user_id = ?";
    params.push(userId);
  }
  query += " ORDER BY name ASC";
  return db.getAllAsync<CaseType>(query, params);
};
export const updateCaseType = async (
  id: number,
  name: string,
  userId: number
): Promise<boolean> => {
  const db = await getDb();
  if (!name || name.trim() === "")
    throw new Error("Case type name cannot be empty.");
  const result = await db.runAsync(
    "UPDATE CaseTypes SET name = ? WHERE id = ? AND user_id = ?",
    [name.trim(), id, userId]
  );
  return result.changes > 0;
};
export const deleteCaseType = async (
  id: number,
  userId: number
): Promise<boolean> => {
  const db = await getDb();
  const result = await db.runAsync(
    "DELETE FROM CaseTypes WHERE id = ? AND user_id = ?",
    [id, userId]
  );
  return result.changes > 0;
};

export const addCourt = async (
  name: string,
  userId?: number | null
): Promise<number | null> => {
  const db = await getDb();
  if (!name || name.trim() === "")
    throw new Error("Court name cannot be empty.");
  const trimmed = name.trim();
  const existing = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM Courts WHERE LOWER(name) = LOWER(?) AND (user_id IS NULL OR user_id = ?)",
    [trimmed, userId ?? null]
  );
  if (existing) {
    return existing.id;
  }
  const result = await db.runAsync(
    "INSERT INTO Courts (name, user_id) VALUES (?, ?)",
    [trimmed, userId ?? null]
  );
  return result.lastInsertRowId;
};
export const getCourts = async (userId?: number | null): Promise<Court[]> => {
  const db = await getDb();
  let query = "SELECT * FROM Courts WHERE user_id IS NULL";
  const params: any[] = [];
  if (userId != null) {
    query += " OR user_id = ?";
    params.push(userId);
  }
  query += " ORDER BY name ASC";
  return db.getAllAsync<Court>(query, params);
};
export const updateCourt = async (
  id: number,
  name: string,
  userId: number
): Promise<boolean> => {
  const db = await getDb();
  if (!name || name.trim() === "")
    throw new Error("Court name cannot be empty.");
  const result = await db.runAsync(
    "UPDATE Courts SET name = ? WHERE id = ? AND user_id = ?",
    [name.trim(), id, userId]
  );
  return result.changes > 0;
};
export const deleteCourt = async (
  id: number,
  userId: number
): Promise<boolean> => {
  const db = await getDb();
  const result = await db.runAsync(
    "DELETE FROM Courts WHERE id = ? AND user_id = ?",
    [id, userId]
  );
  return result.changes > 0;
};
// ... (Assume similar CRUD for Districts, PoliceStations are here or will be added, using imported getDb)

// --- Document Management ---
interface UploadOptions {
  originalFileName: string;
  fileType: string;
  fileUri: string;
  caseId: number;
  userId?: number | null;
  fileSize?: number | null;
}
export const uploadCaseDocument = async (
  options: UploadOptions
): Promise<number | null> => {
  const db = await getDb();
  const { originalFileName, fileType, fileUri, caseId, userId, fileSize } =
    options;
  console.log("Uploading document with options:", options);
  const caseExists = await getCaseById(caseId);
  if (!caseExists) {
    console.error("Case not found");
    return null;
  }
  const timestamp = Date.now();
  const nameParts = originalFileName.split(".");
  const extension = nameParts.length > 1 ? nameParts.pop() : "dat";
  const baseName = nameParts.join(".");
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const uniqueStoredFileName = `${caseId}_${timestamp}_${sanitizedBaseName}.${extension}`;
  const mimeTypeForDb = fileType;
  try {
    const dirInfo = await FileSystem.getInfoAsync(DOCUMENTS_DIRECTORY);
    if (!dirInfo.exists) {
      console.log("Documents directory does not exist, creating it...");
      await FileSystem.makeDirectoryAsync(DOCUMENTS_DIRECTORY, {
        intermediates: true,
      });
    }
    const destinationUri = DOCUMENTS_DIRECTORY + uniqueStoredFileName;
    console.log("Copying file from", fileUri, "to", destinationUri);
    await FileSystem.copyAsync({ from: fileUri, to: destinationUri });
    console.log("File copied successfully");
    const result = await db.runAsync(
      "INSERT INTO CaseDocuments (case_id, stored_filename, original_display_name, file_type, file_size, user_id) VALUES (?, ?, ?, ?, ?, ?)",
      [
        caseId,
        uniqueStoredFileName,
        originalFileName,
        mimeTypeForDb,
        fileSize ?? null,
        userId ?? null,
      ]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error("Error uploading file:", error);
    return null;
  }
};
export const getCaseDocuments = async (
  caseId: number
): Promise<CaseDocument[]> => {
  const db = await getDb();
  return db.getAllAsync<CaseDocument>(
    "SELECT * FROM CaseDocuments WHERE case_id = ? ORDER BY created_at DESC",
    [caseId]
  );
};
export const deleteCaseDocument = async (
  documentId: number
): Promise<boolean> => {
  const db = await getDb();
  const doc = await db.getFirstAsync<CaseDocument>(
    "SELECT stored_filename FROM CaseDocuments WHERE id = ?",
    [documentId]
  );
  if (!doc) {
    console.warn(`Document with ID ${documentId} not found.`);
    return false;
  }
  const filePath = DOCUMENTS_DIRECTORY + doc.stored_filename;
  try {
    const result = await db.runAsync("DELETE FROM CaseDocuments WHERE id = ?", [
      documentId,
    ]);
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
export const getFullDocumentPath = (
  storedFileName: string | null | undefined
): string | null => {
  if (!storedFileName) return null;
  return DOCUMENTS_DIRECTORY + storedFileName;
};

export interface ScannedPdfRow {
  id: number;
  case_id: number;
  stored_filename: string;
  original_display_name: string;
  file_type?: string | null;
  file_size?: number | null;
  created_at: string;
  CaseTitle?: string | null;
}

export const getAllScannedPdfs = async (): Promise<ScannedPdfRow[]> => {
  const db = await getDb();
  const sql = `
    SELECT cd.*, c.CaseTitle
    FROM CaseDocuments cd
    LEFT JOIN Cases c ON cd.case_id = c.id
    WHERE cd.stored_filename LIKE '%.pdf' OR cd.file_type LIKE '%pdf%'
    ORDER BY cd.created_at DESC
  `;
  return db.getAllAsync<ScannedPdfRow>(sql);
};

// --- CRUD Operations for Cases ---
export type CaseInsertData = Omit<CaseRow, "id" | "created_at" | "updated_at">;
export type CaseUpdateData = Partial<
  Omit<CaseRow, "id" | "uniqueId" | "created_at" | "updated_at">
>;

export const addCase = async (
  caseData: CaseInsertData
): Promise<number | null> => {
  const drizzleDb = await getDrizzleDb();
  if (!caseData.uniqueId) throw new Error("uniqueId is required.");

  if (caseData.court_name && !caseData.court_id) {
    try {
      const existingCourtId = await addCourt(
        caseData.court_name,
        caseData.user_id
      );
      if (existingCourtId) caseData.court_id = existingCourtId;
    } catch (e) {
      console.warn("Could not auto-register court_name in addCase:", e);
    }
  }

  if (caseData.case_type_name && !caseData.case_type_id) {
    try {
      const existingCaseTypeId = await addCaseType(
        caseData.case_type_name,
        caseData.user_id
      );
      if (existingCaseTypeId) caseData.case_type_id = existingCaseTypeId;
    } catch (e) {
      console.warn("Could not auto-register case_type_name in addCase:", e);
    }
  }

  const validCaseData: { [key: string]: any } = {};
  for (const key in caseData) {
    if (Object.prototype.hasOwnProperty.call(caseData, key)) {
      const typedKey = key as keyof CaseInsertData;
      if (
        key === "NextDate" ||
        key === "PreviousDate" ||
        key === "dateFiled" ||
        key === "StatuteOfLimitations"
      ) {
        validCaseData[typedKey] = normalizeDateToYYYYMMDD(caseData[typedKey]);
      } else if (caseData[typedKey] !== undefined) {
        validCaseData[typedKey] = caseData[typedKey];
      }
    }
  }
  if (Object.keys(validCaseData).length === 0)
    throw new Error("No valid fields for addCase.");
  try {
    const result = await drizzleDb
      .insert(drizzleCases)
      .values(validCaseData)
      .returning({ id: drizzleCases.id });
    const caseId = result[0]?.id || null;
    if (caseId) {
      try {
        const newCase = await getCaseById(caseId);
        if (newCase && newCase.NextDate) {
          await scheduleCaseReminder(newCase);
        }
      } catch (e) {
        console.error("Failed to schedule notification on addCase:", e);
      }
    }
    return caseId;
  } catch (error) {
    console.error(
      "Error adding case via Drizzle:",
      error,
      "Values:",
      validCaseData
    );
    throw error;
  }
};

export interface CaseWithDetails extends CaseRow {
  districtName?: string | null;
  policeStationName?: string | null;
  lookupCourtName?: string | null;
  lookupCaseTypeName?: string | null;
}

export const getCases = async (
  userId?: number | null,
  limit: number = -1,
  offset: number = 0,
  options?: {
    status?: "Active" | "Closed" | "All";
    dateFilter?: "today" | "tomorrow" | "yesterday" | "undated" | null;
    searchQuery?: string;
  }
): Promise<CaseWithDetails[]> => {
  const db = await getDb();
  let sql = `SELECT c.*, ps.name as policeStationName, d.name as districtName, co.name as lookupCourtName, ct.name as lookupCaseTypeName
             FROM Cases c
             LEFT JOIN PoliceStations ps ON c.police_station_id = ps.id
             LEFT JOIN Districts d ON c.district_id = d.id
             LEFT JOIN Courts co ON c.court_id = co.id
             LEFT JOIN CaseTypes ct ON c.case_type_id = ct.id`;

  const whereClauses: string[] = [];
  const params: any[] = [];

  if (userId !== undefined && userId !== null) {
    whereClauses.push("c.user_id = ?");
    params.push(userId);
  }

  if (options) {
    const { status, dateFilter, searchQuery } = options;

    if (status && status !== "All") {
      if (status === "Active") {
        whereClauses.push("(c.CaseStatus IS NULL OR c.CaseStatus != 'Closed')");
      } else if (status === "Closed") {
        whereClauses.push("c.CaseStatus = 'Closed'");
      }
    }

    if (dateFilter) {
      const todayStr = getLocalDateString(new Date());
      if (dateFilter === "today") {
        whereClauses.push("c.NextDate = ?");
        params.push(todayStr);
      } else if (dateFilter === "tomorrow") {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = getLocalDateString(tomorrow);
        whereClauses.push("c.NextDate = ?");
        params.push(tomorrowStr);
      } else if (dateFilter === "yesterday") {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getLocalDateString(yesterday);
        whereClauses.push("c.NextDate = ?");
        params.push(yesterdayStr);
      } else if (dateFilter === "undated") {
        whereClauses.push(
          "(c.NextDate IS NULL OR c.NextDate = '' OR c.NextDate = 'N/A')"
        );
      }
    }

    if (searchQuery && searchQuery.trim() !== "") {
      const escapedQuery = `%${searchQuery.trim()}%`;
      whereClauses.push(
        "(c.CaseTitle LIKE ? OR c.ClientName LIKE ? OR c.case_number LIKE ? OR c.CNRNumber LIKE ? OR c.FirstParty LIKE ? OR c.OppositeParty LIKE ? OR c.crime_number LIKE ? OR c.session_trial_number LIKE ? OR EXISTS (SELECT 1 FROM CaseTimeline cte WHERE cte.case_id = c.id AND cte.notes LIKE ?))"
      );
      params.push(
        escapedQuery,
        escapedQuery,
        escapedQuery,
        escapedQuery,
        escapedQuery,
        escapedQuery,
        escapedQuery,
        escapedQuery,
        escapedQuery
      );
    }
  }

  if (whereClauses.length > 0) {
    sql += " WHERE " + whereClauses.join(" AND ");
  }

  // Consistent sorting: non-null NextDate ascending first, followed by undated/null cases, then updated_at DESC
  sql += ` ORDER BY 
    CASE WHEN c.NextDate IS NULL OR c.NextDate = '' OR c.NextDate = 'N/A' THEN 1 ELSE 0 END ASC, 
    c.NextDate ASC, 
    c.updated_at DESC`;

  if (limit !== -1) {
    sql += " LIMIT ? OFFSET ?";
    params.push(limit, offset);
  } else if (offset > 0) {
    sql += " LIMIT -1 OFFSET ?";
    params.push(offset);
  }

  return db.getAllAsync<CaseWithDetails>(sql, params);
};

export const getCaseById = async (
  id: number,
  userId?: number | null
): Promise<CaseWithDetails | null> => {
  const db = await getDb();
  let sql = `SELECT c.*, ps.name as policeStationName, d.name as districtName, co.name as lookupCourtName, ct.name as lookupCaseTypeName 
             FROM Cases c
             LEFT JOIN PoliceStations ps ON c.police_station_id = ps.id
             LEFT JOIN Districts d ON c.district_id = d.id
             LEFT JOIN Courts co ON c.court_id = co.id
             LEFT JOIN CaseTypes ct ON c.case_type_id = ct.id
             WHERE c.id = ?`;
  const params: any[] = [id];
  if (userId != null) {
    sql += " AND c.user_id = ?";
    params.push(userId);
  }
  const result = await db.getFirstAsync<CaseWithDetails>(sql, params);
  return result ?? null;
};

export const updateCase = async (
  id: number,
  data: CaseUpdateData,
  actorUserId?: number | null
): Promise<boolean> => {
  const db = await getDb();
  console.log("Updating case with ID:", id, "and data:", data);
  const currentCaseData = await getCaseById(id);
  if (!currentCaseData) {
    console.warn(`Case ${id} not found.`);
    return false;
  }

  const setClauses: string[] = [];
  const params: any[] = [];

  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const typedKey = key as keyof CaseUpdateData;
      let val = data[typedKey];
      if (val !== undefined) {
        if (
          key === "NextDate" ||
          key === "PreviousDate" ||
          key === "dateFiled" ||
          key === "StatuteOfLimitations"
        ) {
          val = normalizeDateToYYYYMMDD(val);
        }
        setClauses.push(`${key} = ?`);
        params.push(val);
      }
    }
  }

  if (setClauses.length === 0) {
    console.warn("No fields for update.");
    return false;
  }

  setClauses.push("updated_at = STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')");
  params.push(id);

  let sql = `UPDATE Cases SET ${setClauses.join(", ")} WHERE id = ?`;
  if (actorUserId != null) {
    sql += " AND user_id = ?";
    params.push(actorUserId);
  }

  try {
    const result = await db.runAsync(sql, params);
    if (result.changes > 0) {
      notifyCaseUpdated(id);
      try {
        const updatedCase = await getCaseById(id);
        if (updatedCase) {
          if (updatedCase.NextDate) {
            await scheduleCaseReminder(updatedCase);
          } else {
            await cancelCaseReminder(id);
          }
        }
      } catch (e) {
        console.error("Failed to schedule notification on updateCase:", e);
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error updating case ID ${id}:`, error);
    throw error;
  }
};

export const deleteCase = async (
  id: number,
  userId?: number | null
): Promise<boolean> => {
  const drizzleDb = await getDrizzleDb();
  const documents = await getCaseDocuments(id);
  for (const doc of documents) {
    const filePath = getFullDocumentPath(doc.stored_filename);
    if (filePath) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists) await FileSystem.deleteAsync(filePath);
      } catch (e) {
        console.error("Error deleting file for case:", e);
      }
    }
  }
  try {
    await cancelCaseReminder(id);
  } catch (e) {
    console.error("Failed to cancel notification on deleteCase:", e);
  }
  try {
    const conditions = [eq(drizzleCases.id, id)];
    if (userId != null) {
      conditions.push(eq(drizzleCases.user_id, userId));
    }
    const result = await drizzleDb
      .delete(drizzleCases)
      .where(and(...conditions))
      .returning({ id: drizzleCases.id });
    return result.length > 0;
  } catch (error) {
    console.error(`Error deleting case ID ${id} via Drizzle:`, error);
    throw error;
  }
};

export const searchCases = async (
  query: string,
  userId?: number | null,
  limit: number = -1,
  offset: number = 0
): Promise<CaseWithDetails[]> => {
  const db = await getDb();
  const searchQuery = `%${query}%`;
  let sql = `
        SELECT c.*, ps.name as policeStationName, d.name as districtName, co.name as lookupCourtName, ct.name as lookupCaseTypeName
        FROM Cases c
        LEFT JOIN PoliceStations ps ON c.police_station_id = ps.id
        LEFT JOIN Districts d ON c.district_id = d.id
        LEFT JOIN Courts co ON c.court_id = co.id
        LEFT JOIN CaseTypes ct ON c.case_type_id = ct.id
        WHERE (
            c.uniqueId LIKE ? OR c.CaseTitle LIKE ? OR c.ClientName LIKE ? OR c.CNRNumber LIKE ? OR
            c.case_number LIKE ? OR c.court_name LIKE ? OR co.name LIKE ? OR c.case_type_name LIKE ? OR ct.name LIKE ? OR
            c.JudgeName LIKE ? OR c.OnBehalfOf LIKE ? OR c.FirstParty LIKE ? OR
            c.OppositeParty LIKE ? OR c.OpposingCounsel LIKE ? OR c.Accussed LIKE ? OR
            c.Undersection LIKE ? OR c.CaseStatus LIKE ? OR c.Priority LIKE ? OR
            c.CaseDescription LIKE ? OR c.CaseNotes LIKE ? OR c.StatuteOfLimitations LIKE ? OR
            ps.name LIKE ? OR d.name LIKE ?
        )
    `;
  const params: any[] = Array(23).fill(searchQuery);
  if (userId !== undefined && userId !== null) {
    sql += " AND c.user_id = ?";
    params.push(userId);
  }

  // Sort consistently: active dates ascending first, undated at the end, then updated_at DESC
  sql += ` ORDER BY 
      CASE WHEN c.NextDate IS NULL OR c.NextDate = '' OR c.NextDate = 'N/A' THEN 1 ELSE 0 END ASC,
      c.NextDate ASC, 
      c.updated_at DESC`;

  if (limit !== -1) {
    sql += " LIMIT ? OFFSET ?";
    params.push(limit, offset);
  } else if (offset > 0) {
    sql += " LIMIT -1 OFFSET ?";
    params.push(offset);
  }

  console.log("Search SQL:", sql);
  return db.getAllAsync<CaseWithDetails>(sql, params);
};

// Export timeline CRUD functions
export * from "./caseTimelineDb";

// Export user profile functions
export * from "./userProfileDB";
// Export Suggestion an other lookup functions if they are still in use and correct
// For example:
// export const getSuggestionsForField = async (...) => { ... } // This was present before
// Ensure all exported functions use the new getDb from './connection' if they interact with DB.
// The getSuggestionsForField was in this file before, assuming it's still needed.
export const getSuggestionsForField = async (
  fieldName: string,
  userId?: number | null
): Promise<{ id: number; name: string }[]> => {
  const db = await getDb();
  const results = await db.getAllAsync<any>(
    `SELECT DISTINCT ${fieldName} as name FROM Cases WHERE ${fieldName} IS NOT NULL AND user_id = ?`,
    [userId]
  );
  return results.map((row, index) => ({ id: index, name: row.name }));
};

export const getTotalCases = async (
  userId?: number | null
): Promise<number> => {
  const db = await getDb();
  let sql = "SELECT COUNT(*) as count FROM Cases";
  const params: any[] = [];
  if (userId != null) {
    sql += " WHERE user_id = ?";
    params.push(userId);
  }
  const result = await db.getFirstAsync<{ count: number }>(sql, params);
  return result?.count ?? 0;
};

export const getUpcomingHearings = async (
  userId?: number | null
): Promise<number> => {
  const db = await getDb();
  const today = getLocalDateString(new Date());
  let sql = "SELECT COUNT(*) as count FROM Cases WHERE NextDate > ?";
  const params: any[] = [today];
  if (userId != null) {
    sql += " AND user_id = ?";
    params.push(userId);
  }
  const result = await db.getFirstAsync<{ count: number }>(sql, params);
  return result?.count ?? 0;
};

export const addUser = async (
  name: string,
  email: string
): Promise<number | null> => {
  const db = await getDb();
  try {
    const existingUser = await db.getFirstAsync<User>("SELECT * FROM Users");
    if (existingUser) {
      return existingUser.id;
    }
    const result = await db.runAsync(
      "INSERT INTO Users (name, email) VALUES (?, ?)",
      [name, email]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error("Error adding user:", error);
    return null;
  }
};

export const addDistrict = async (
  name: string,
  state?: string,
  userId?: number | null
): Promise<number | null> => {
  const db = await getDb();
  if (!name || name.trim() === "")
    throw new Error("District name cannot be empty.");
  const result = await db.runAsync(
    "INSERT OR IGNORE INTO Districts (name, state, user_id) VALUES (?, ?, ?)",
    [name.trim(), state ?? null, userId ?? null]
  );
  return result.lastInsertRowId;
};

export const getDistricts = async (
  userId?: number | null,
  state?: string | null
): Promise<District[]> => {
  const db = await getDb();
  let query = "SELECT * FROM Districts WHERE (user_id IS NULL";
  const params: any[] = [];
  if (userId != null) {
    query += " OR user_id = ?";
    params.push(userId);
  }
  query += ")";
  if (state != null) {
    query += " AND LOWER(state) = LOWER(?)";
    params.push(state);
  }
  query += " ORDER BY name ASC";
  return db.getAllAsync<District>(query, params);
};

export const addPoliceStation = async (
  name: string,
  districtId?: number | null,
  userId?: number | null
): Promise<number | null> => {
  const db = await getDb();
  if (!name || name.trim() === "")
    throw new Error("Police station name cannot be empty.");
  const trimmed = name.trim();
  const existing = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM PoliceStations WHERE LOWER(name) = LOWER(?) AND (district_id = ? OR (district_id IS NULL AND ? IS NULL)) AND (user_id IS NULL OR user_id = ?)",
    [trimmed, districtId ?? null, districtId ?? null, userId ?? null]
  );
  if (existing) {
    return existing.id;
  }
  const result = await db.runAsync(
    "INSERT INTO PoliceStations (name, district_id, user_id) VALUES (?, ?, ?)",
    [trimmed, districtId ?? null, userId ?? null]
  );
  return result.lastInsertRowId;
};

export const getPoliceStations = async (
  districtId?: number | null,
  userId?: number | null
): Promise<PoliceStation[]> => {
  const db = await getDb();
  let query = "SELECT * FROM PoliceStations WHERE (user_id IS NULL";
  const params: any[] = [];
  if (userId != null) {
    query += " OR user_id = ?";
    params.push(userId);
  }
  query += ")";
  if (districtId != null) {
    query += " AND district_id = ?";
    params.push(districtId);
  }
  query += " ORDER BY name ASC";
  return db.getAllAsync<PoliceStation>(query, params);
};

// --- Document Draft Management ---

export const saveDocumentDraft = async (
  draft: DocumentDraft
): Promise<void> => {
  const db = await getDb();
  let content = draft.html_content;
  let templateType = draft.template_type;
  let isCustom = draft.is_custom_template ?? 0;
  let title = draft.title || "Draft Document";

  if (
    content === undefined ||
    content === null ||
    templateType === undefined ||
    templateType === null ||
    templateType === ""
  ) {
    const existing = await getDocumentDraftById(draft.id);
    if (content === undefined || content === null) {
      content = existing?.html_content || "<div><p>Document Content</p></div>";
    }
    if (!templateType) {
      templateType = existing?.template_type || "draft";
    }
    if (draft.is_custom_template === undefined && existing?.is_custom_template !== undefined) {
      isCustom = existing.is_custom_template;
    }
  }

  await db.runAsync(
    `INSERT OR REPLACE INTO document_drafts (id, case_id, title, template_type, html_content, is_custom_template, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      draft.id,
      draft.case_id ?? null,
      title,
      templateType || "draft",
      content,
      isCustom,
      draft.created_at || new Date().toISOString(),
      new Date().toISOString(),
    ]
  );
};

export const getDocumentDrafts = async (
  caseId?: number | null,
  isCustomTemplate?: number | null,
  excludeHtml: boolean = false,
  limit?: number | null,
  offset?: number | null
): Promise<DocumentDraft[]> => {
  const db = await getDb();
  const columns = excludeHtml
    ? "d.id, d.case_id, d.title, d.template_type, d.is_custom_template, d.created_at, d.updated_at, c.CaseTitle as case_title, c.ClientName as client_name, c.case_number"
    : "d.*, c.CaseTitle as case_title, c.ClientName as client_name, c.case_number";
  let query = `SELECT ${columns} FROM document_drafts d LEFT JOIN Cases c ON d.case_id = c.id WHERE 1=1`;
  const params: any[] = [];
  if (isCustomTemplate !== undefined && isCustomTemplate !== null) {
    query += " AND d.is_custom_template = ?";
    params.push(isCustomTemplate);
  }
  if (caseId !== undefined && caseId !== null) {
    query += " AND d.case_id = ?";
    params.push(caseId);
  }
  query += " ORDER BY d.updated_at DESC";
  if (limit !== undefined && limit !== null) {
    query += " LIMIT ?";
    params.push(limit);
  }
  if (offset !== undefined && offset !== null) {
    query += " OFFSET ?";
    params.push(offset);
  }
  return db.getAllAsync<DocumentDraft>(query, params);
};

export const getDocumentDraftById = async (
  id: string
): Promise<DocumentDraft | null> => {
  const db = await getDb();
  return db.getFirstAsync<DocumentDraft>(
    `SELECT d.*, c.CaseTitle as case_title, c.ClientName as client_name, c.case_number 
     FROM document_drafts d 
     LEFT JOIN Cases c ON d.case_id = c.id 
     WHERE d.id = ?`,
    [id]
  );
};

export const deleteDocumentDraft = async (id: string): Promise<boolean> => {
  const db = await getDb();
  const result = await db.runAsync("DELETE FROM document_drafts WHERE id = ?", [
    id,
  ]);
  return result.changes > 0;
};

// --- Financial & Dashboard Counts ---

export const getFinancialSummary = async (
  userId?: number
): Promise<{
  totalCollected: number;
  totalRemaining: number;
  totalAgreed: number;
}> => {
  const db = await getDb();
  let sql = `SELECT SUM(COALESCE(fee_paid, 0)) as totalCollected,
                    SUM(CASE WHEN COALESCE(total_fee, 0) > COALESCE(fee_paid, 0) THEN (COALESCE(total_fee, 0) - COALESCE(fee_paid, 0)) ELSE 0 END) as totalRemaining,
                    SUM(COALESCE(total_fee, 0)) as totalAgreed
             FROM Cases`;
  const params: any[] = [];
  if (userId !== undefined && userId !== null) {
    sql += " WHERE user_id = ?";
    params.push(userId);
  }
  const result = await db.getFirstAsync<{
    totalCollected: number | null;
    totalRemaining: number | null;
    totalAgreed: number | null;
  }>(sql, params);
  return {
    totalCollected: result?.totalCollected ?? 0,
    totalRemaining: result?.totalRemaining ?? 0,
    totalAgreed: result?.totalAgreed ?? 0,
  };
};

export const getYesterdaysCases = async (
  userId?: number
): Promise<CaseRow[]> => {
  const db = await getDb();
  let sql =
    "SELECT * FROM Cases WHERE 1=1 AND (CaseStatus IS NULL OR CaseStatus != 'Closed')";
  const params: any[] = [];
  if (userId !== undefined && userId !== null) {
    sql += " AND user_id = ?";
    params.push(userId);
  }
  const allCases = await db.getAllAsync<CaseRow>(sql, params);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  return allCases.filter((c) => {
    if (c.CaseStatus === "Closed") return false;
    if (!c.NextDate) return false;
    const normalized = normalizeDateToYYYYMMDD(c.NextDate);
    return normalized === yesterdayStr;
  });
};

export const getYesterdaysCasesCount = async (
  userId?: number
): Promise<number> => {
  const cases = await getYesterdaysCases(userId);
  return cases.length;
};

export const getUndatedCases = async (userId?: number): Promise<CaseRow[]> => {
  const db = await getDb();
  let sql =
    "SELECT * FROM Cases WHERE 1=1 AND (CaseStatus IS NULL OR CaseStatus != 'Closed')";
  const params: any[] = [];
  if (userId !== undefined && userId !== null) {
    sql += " AND user_id = ?";
    params.push(userId);
  }
  const allCases = await db.getAllAsync<CaseRow>(sql, params);
  const todayStr = getLocalDateString(new Date());

  return allCases.filter((c) => {
    if (c.CaseStatus === "Closed") return false;
    const normalized = normalizeDateToYYYYMMDD(c.NextDate);
    if (!normalized) return true;
    return normalized < todayStr;
  });
};

export const getUndatedCasesCount = async (
  userId?: number
): Promise<number> => {
  const cases = await getUndatedCases(userId);
  return cases.length;
};

export interface DocumentDraftRevision {
  id: string;
  draft_id: string;
  revision_number: number;
  html_content: string;
  created_at: string;
}

export const saveDraftRevision = async (
  draftId: string,
  htmlContent: string
): Promise<void> => {
  const db = await getDb();
  const revs = await db.getAllAsync<{ revision_number: number }>(
    "SELECT revision_number FROM document_draft_revisions WHERE draft_id = ? ORDER BY revision_number DESC LIMIT 1",
    [draftId]
  );
  const nextRev = revs && revs.length > 0 ? revs[0].revision_number + 1 : 1;
  const id = `${draftId}_rev_${nextRev}_${Date.now()}`;
  await db.runAsync(
    "INSERT INTO document_draft_revisions (id, draft_id, revision_number, html_content, created_at) VALUES (?, ?, ?, ?, ?)",
    [id, draftId, nextRev, htmlContent, new Date().toISOString()]
  );
};

export const getDraftRevisions = async (
  draftId: string
): Promise<DocumentDraftRevision[]> => {
  const db = await getDb();
  return db.getAllAsync<DocumentDraftRevision>(
    "SELECT * FROM document_draft_revisions WHERE draft_id = ? ORDER BY revision_number DESC",
    [draftId]
  );
};

