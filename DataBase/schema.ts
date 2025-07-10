// DataBase/schema.ts

import * as SQLite from 'expo-sqlite';

// --- Seeding Initial Data Constants ---
// Moved here from DataBase/index.ts to be co-located with seedInitialData function
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
  // Add more as needed
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
  // Add more as needed
];


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
  uniqueId: string;
  user_id?: number | null;

  // Case Identification & Core Details
  CaseTitle?: string | null;        // Primary title for the case
  ClientName?: string | null;       // Primary client associated with the case
  OnBehalfOf?: string | null;       // E.g., "Self", "Minor child", "Company XYZ" (if different from ClientName)
  CNRNumber?: string | null;        // CNR Number
  case_number?: string | null;      // Case number (e.g., O.S No. 123/2023)
  case_year?: number | null;        // Year of the case, if part of case_number or separate

  // Court and Type (Name stored directly, ID for future linking)
  court_id?: number | null;         // Optional ID for future linking to a managed Courts table
  court_name?: string | null;       // Actual name of the court (e.g., "District Court, Cityville")
  case_type_id?: number | null;     // Optional ID for future linking to a managed CaseTypes table
  case_type_name?: string | null;   // Actual name of the case type (e.g., "Civil Suit", "Criminal Appeal")

  // Dates
  dateFiled?: string | null;        // Date case was filed (ISO8601 "YYYY-MM-DD")
  NextDate?: string | null;         // Next hearing date (ISO8601 "YYYY-MM-DD")
  PreviousDate?: string | null;     // Previous hearing date (ISO8601 "YYYY-MM-DD")
  StatuteOfLimitations?: string | null; // Statute of limitations date

  // Legal Specifics
  crime_number?: string | null;     // FIR/Crime number, if applicable
  crime_year?: number | null;       // Year of the crime/FIR
  police_station_id?: number | null;// FK to PoliceStations table (if this table is managed)
  Undersection?: string | null;     // Relevant sections of law (e.g., "Sec 302 IPC, Sec 120B IPC")

  // Parties
  FirstParty?: string | null;       // Name of the first party (e.g., Plaintiff/Petitioner)
  OppositeParty?: string | null;    // Name of the opposite party (e.g., Defendant/Respondent)
  Accussed?: string | null;         // Name(s) of accused, if applicable
  ClientContactNumber?: string | null; // Contact number for the primary client

  // Counsel Details
  JudgeName?: string | null;        // Name of the presiding judge
  OpposingCounsel?: string | null;  // Name of the opposing counsel
  OppositeAdvocate?: string | null; // Often same as OpposingCounsel, or specific advocate name
  OppAdvocateContactNumber?: string | null; // Contact for opposing counsel

  // Case Status & Management
  CaseStatus?: string | null;       // Current status (e.g., "Open", "In Progress", "Closed", "Appealed")
  Priority?: string | null;         // Priority (e.g., "High", "Medium", "Low")

  // Descriptions & Notes
  CaseDescription?: string | null;  // Detailed description of the case
  CaseNotes?: string | null;        // Internal notes, strategy, etc.

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface TimelineEventRow {
  id: number;
  case_id: number; // Foreign Key to Cases table
  event_date: string; // ISO8601 "YYYY-MM-DD" or full timestamp
  description: string;
  created_at: string; // ISO8601
  updated_at: string; // ISO8601
  user_id?: number | null; // Optional: if events are user-specific or for audit
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
  user_id INTEGER,

  -- Case Identification & Core Details
  CaseTitle TEXT,
  ClientName TEXT,
  OnBehalfOf TEXT,
  CNRNumber TEXT,
  case_number TEXT,
  case_year INTEGER,

  -- Court and Type (Name stored directly, ID for future linking)
  court_id INTEGER,         -- Retained for future linking, FK constraint removed
  court_name TEXT,          -- Actual name of the court
  case_type_id INTEGER,     -- Retained for future linking, FK constraint removed
  case_type_name TEXT,      -- Actual name of the case type

  -- Dates
  dateFiled TEXT,
  NextDate TEXT,
  PreviousDate TEXT,
  StatuteOfLimitations TEXT,

  -- Legal Specifics
  crime_number TEXT,
  crime_year INTEGER,
  police_station_id INTEGER,
  Undersection TEXT,

  -- Parties
  FirstParty TEXT,
  OppositeParty TEXT,
  Accussed TEXT,
  ClientContactNumber TEXT,

  -- Counsel Details
  JudgeName TEXT,
  OpposingCounsel TEXT,
  OppositeAdvocate TEXT,
  OppAdvocateContactNumber TEXT,

  -- Case Status & Management
  CaseStatus TEXT,
  Priority TEXT,

  -- Descriptions & Notes
  CaseDescription TEXT,
  CaseNotes TEXT,

  -- Timestamps
  created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),
  updated_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),

  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
  -- FOREIGN KEY (court_id) REFERENCES Courts(id) ON DELETE SET NULL, -- FK constraint explicitly removed
  -- FOREIGN KEY (case_type_id) REFERENCES CaseTypes(id) ON DELETE SET NULL, -- FK constraint explicitly removed
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

export const CREATE_TIMELINE_EVENTS_TABLE = `
CREATE TABLE IF NOT EXISTS TimelineEvents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  event_date TEXT NOT NULL, -- Store as ISO8601 string
  description TEXT NOT NULL,
  user_id INTEGER, -- Optional: who created this event
  created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),
  updated_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),
  FOREIGN KEY (case_id) REFERENCES Cases(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL
);`;

// Index for faster timeline event lookups per case
export const CREATE_TIMELINE_EVENTS_CASE_ID_INDEX = `
CREATE INDEX IF NOT EXISTS idx_timelineevents_case_id ON TimelineEvents(case_id);
`;

// Trigger to update 'updated_at' timestamp on TimelineEvents table
export const CREATE_TIMELINE_EVENTS_UPDATED_AT_TRIGGER = `
CREATE TRIGGER IF NOT EXISTS trigger_timelineevents_updated_at
AFTER UPDATE ON TimelineEvents
FOR EACH ROW
BEGIN
  UPDATE TimelineEvents SET updated_at = STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW') WHERE id = OLD.id;
END;`;

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
  await db.execAsync(CREATE_TIMELINE_EVENTS_TABLE);
  await db.execAsync(CREATE_TIMELINE_EVENTS_CASE_ID_INDEX);
  await db.execAsync(CREATE_TIMELINE_EVENTS_UPDATED_AT_TRIGGER);

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
