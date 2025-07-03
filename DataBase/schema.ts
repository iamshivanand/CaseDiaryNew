// DataBase/schema.ts

import * as SQLite from 'expo-sqlite';

// ---------------
// TYPE INTERFACES
// ---------------

export interface User {
  id: number; // Or string if using UUIDs, but INTEGER PRIMARY KEY is simpler for SQLite
  name?: string | null;
  email?: string | null; // Should be unique if used for login
  created_at: string; // ISO8601
}

export interface CaseType {
  id: number;
  name: string; // E.g., "Civil", "Criminal"
  user_id?: number | null; // Null for global types, user_id for custom types
  // is_global: boolean; // Alternative to nullable user_id: 1 for global, 0 for user-specific
}

export interface Court {
  id: number;
  name: string; // E.g., "District Court - City A"
  user_id?: number | null;
}

export interface District {
  id: number;
  name: string; // E.g., "District Name"
  state?: string | null; // E.g., "State Name"
  user_id?: number | null;
}

export interface PoliceStation {
  id: number;
  name: string;
  district_id?: number | null; // FK to Districts
  user_id?: number | null;
}

export interface CaseDocument {
  id: number;
  case_id: number; // FK to Cases
  stored_filename: string; // Unique name used for storing the file locally
  original_display_name: string; // Original name of the file for UI
  file_type?: string | null; // E.g., "pdf", "jpg", "docx"
  file_size?: number | null; // In bytes
  created_at: string; // ISO8601, when document was added
  user_id?: number | null; // Who uploaded this document, if relevant
}

export interface Case {
  id: number;
  uniqueId: string; // Keep for now if it's used as an external stable ID
  user_id?: number | null; // FK to Users, who this case belongs to or who created it

  // Case Details
  CNRNumber?: string | null;
  court_id?: number | null; // FK to Courts
  dateFiled?: string | null; // ISO8601 "YYYY-MM-DD"
  case_type_id?: number | null; // FK to CaseTypes
  case_number?: string | null;
  case_year?: number | null;
  crime_number?: string | null;
  crime_year?: number | null;

  // Parties & Representation
  OnBehalfOf?: string | null; // Consider if this should be a link to a Clients table later
  FirstParty?: string | null;
  OppositeParty?: string | null;
  ClientContactNumber?: string | null; // Associated with FirstParty or OnBehalfOf?
  Accussed?: string | null; // Could be multiple, consider a separate table in future if details needed per accused

  // Legal Details
  Undersection?: string | null;
  police_station_id?: number | null; // FK to PoliceStations

  // Opposition Details
  OppositeAdvocate?: string | null;
  OppAdvocateContactNumber?: string | null;

  // Status and Dates
  CaseStatus?: string | null; // Consider a CaseStatuses lookup table if statuses are predefined
  PreviousDate?: string | null; // ISO8601 "YYYY-MM-DD"
  NextDate?: string | null; // ISO8601 "YYYY-MM-DD"

  // Timestamps
  created_at: string; // ISO8601
  updated_at: string; // ISO8601
}


// ---------------
// DDL STATEMENTS
// ---------------

// Using 'TEXT' for dates and timestamps to store ISO8601 strings.
// Using 'INTEGER' for boolean-like flags (0 or 1).
// ON UPDATE CASCADE and ON DELETE SET NULL are examples; choose constraints carefully.
// For user-specific lookup items, user_id being NULL could signify a global/predefined item.

export const CREATE_USERS_TABLE = `
CREATE TABLE IF NOT EXISTS Users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))
);`;

export const CREATE_CASE_TYPES_TABLE = `
CREATE TABLE IF NOT EXISTS CaseTypes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  user_id INTEGER, -- NULL for global types
  UNIQUE (name, user_id), -- A user cannot have two custom types with the same name
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);`;

export const CREATE_COURTS_TABLE = `
CREATE TABLE IF NOT EXISTS Courts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  user_id INTEGER, -- NULL for global courts
  UNIQUE (name, user_id),
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);`;

export const CREATE_DISTRICTS_TABLE = `
CREATE TABLE IF NOT EXISTS Districts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  state TEXT,
  user_id INTEGER, -- NULL for global districts
  UNIQUE (name, state, user_id),
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);`;

export const CREATE_POLICE_STATIONS_TABLE = `
CREATE TABLE IF NOT EXISTS PoliceStations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  district_id INTEGER,
  user_id INTEGER, -- NULL for global stations
  UNIQUE (name, district_id, user_id),
  FOREIGN KEY (district_id) REFERENCES Districts(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);`;

export const CREATE_CASE_DOCUMENTS_TABLE = `
CREATE TABLE IF NOT EXISTS CaseDocuments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  stored_filename TEXT NOT NULL,
  original_display_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),
  user_id INTEGER, -- Optional: if document privacy is per user, not just per case
  FOREIGN KEY (case_id) REFERENCES Cases(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL
);`;
// Index for faster document lookups per case
export const CREATE_CASE_DOCUMENTS_CASE_ID_INDEX = `
CREATE INDEX IF NOT EXISTS idx_casedocuments_case_id ON CaseDocuments(case_id);
`;


export const CREATE_CASES_TABLE = `
CREATE TABLE IF NOT EXISTS Cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uniqueId TEXT UNIQUE NOT NULL, -- Consider if this is still needed or if 'id' is sufficient
  user_id INTEGER, -- Case owner/creator

  -- Case Details
  CNRNumber TEXT,
  court_id INTEGER,
  dateFiled TEXT,
  case_type_id INTEGER,
  case_number TEXT,
  case_year INTEGER,
  crime_number TEXT,
  crime_year INTEGER,

  -- Parties & Representation
  OnBehalfOf TEXT,
  FirstParty TEXT,
  OppositeParty TEXT,
  ClientContactNumber TEXT,
  Accussed TEXT,

  -- Legal Details
  Undersection TEXT,
  police_station_id INTEGER,

  -- Opposition Details
  OppositeAdvocate TEXT,
  OppAdvocateContactNumber TEXT,

  -- Status and Dates
  CaseStatus TEXT,
  PreviousDate TEXT,
  NextDate TEXT,
  -- caseHistory TEXT, -- Old JSON history, to be removed

  -- Timestamps
  created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),
  updated_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),

  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE, -- Or SET NULL if cases should remain if user deleted
  FOREIGN KEY (court_id) REFERENCES Courts(id) ON DELETE SET NULL,
  FOREIGN KEY (case_type_id) REFERENCES CaseTypes(id) ON DELETE SET NULL,
  FOREIGN KEY (police_station_id) REFERENCES PoliceStations(id) ON DELETE SET NULL
);`;

// Trigger to update 'updated_at' timestamp on Cases table
export const CREATE_CASES_UPDATED_AT_TRIGGER = `
CREATE TRIGGER IF NOT EXISTS trigger_cases_updated_at
AFTER UPDATE ON Cases
FOR EACH ROW
BEGIN
  UPDATE Cases SET updated_at = STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW') WHERE id = OLD.id;
END;`;

// Future table for CaseHistoryLog (defined here for completeness of schema design)
export const CREATE_CASE_HISTORY_LOG_TABLE = `
CREATE TABLE IF NOT EXISTS CaseHistoryLog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  timestamp TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),
  user_id INTEGER, -- Who made the change (if available)
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  FOREIGN KEY (case_id) REFERENCES Cases(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL
);`;
export const CREATE_CASE_HISTORY_LOG_CASE_ID_INDEX = `
CREATE INDEX IF NOT EXISTS idx_casehistorylog_case_id ON CaseHistoryLog(case_id);
`;

// Function to execute all DDL statements
export const initializeSchema = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  // Enable foreign keys - this is important for SQLite to enforce constraints
  // It's often good practice to do this at the start of a connection.
  // With expo-sqlite/next, this might be on by default or managed differently,
  // but explicit is often better.
  try {
    await db.execAsync('PRAGMA foreign_keys = ON;');
    console.log("Foreign keys enabled.");
  } catch (e) {
    console.error("Error enabling foreign keys, or already enabled:", e);
    // If this fails, subsequent FK constraints might not be enforced.
    // Depending on the exact expo-sqlite version, errors here might be ignorable if FKs are on by default.
  }

  await db.execAsync(CREATE_USERS_TABLE);
  await db.execAsync(CREATE_CASE_TYPES_TABLE);
  await db.execAsync(CREATE_COURTS_TABLE);
  await db.execAsync(CREATE_DISTRICTS_TABLE);
  await db.execAsync(CREATE_POLICE_STATIONS_TABLE);
  // Cases table must be created before CaseDocuments and CaseHistoryLog if they have FKs to it
  await db.execAsync(CREATE_CASES_TABLE);
  await db.execAsync(CREATE_CASES_UPDATED_AT_TRIGGER); // Trigger for Cases
  await db.execAsync(CREATE_CASE_DOCUMENTS_TABLE);
  await db.execAsync(CREATE_CASE_DOCUMENTS_CASE_ID_INDEX);
  await db.execAsync(CREATE_CASE_HISTORY_LOG_TABLE);
  await db.execAsync(CREATE_CASE_HISTORY_LOG_CASE_ID_INDEX);

  console.log("Database schema initialized.");
};

// Utility to check if a table exists
export const tableExists = async (db: SQLite.SQLiteDatabase, tableName: string): Promise<boolean> => {
  const result = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?;",
    [tableName]
  );
  return (result?.count ?? 0) > 0;
};
