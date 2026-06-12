// DataBase/schema.ts

import * as SQLite from 'expo-sqlite';
import statesAndDistrictsData from '../assets/states-and-districts.json';
import policeStationsData from '../assets/police-stations.json';

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

export interface CaseTimelineRow {
  id: number;
  case_id: number; // Foreign Key to Cases table
  hearing_date: string; // ISO8601 "YYYY-MM-DD" or full timestamp
  notes: string;
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

export const CREATE_CASE_TIMELINE_TABLE = `
CREATE TABLE IF NOT EXISTS CaseTimeline (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  notes TEXT,
  hearing_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),
  updated_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),
  FOREIGN KEY (case_id) REFERENCES Cases(id) ON DELETE CASCADE
);`;

// Index for faster timeline event lookups per case
export const CREATE_CASE_TIMELINE_CASE_ID_INDEX = `
CREATE INDEX IF NOT EXISTS idx_casetimeline_case_id ON CaseTimeline(case_id);
`;

// Trigger to update 'updated_at' timestamp on CaseTimeline table
export const CREATE_CASE_TIMELINE_UPDATED_AT_TRIGGER = `
CREATE TRIGGER IF NOT EXISTS trigger_casetimeline_updated_at
AFTER UPDATE ON CaseTimeline
FOR EACH ROW
BEGIN
  UPDATE CaseTimeline SET updated_at = STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW') WHERE id = OLD.id;
END;`;


import { initializeUserProfileDB } from './userProfileDB';
import { initializeUserInformationDB } from './userInformationDB';
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
  
  // Create indexes on Cases table for O(log N) query lookup speed
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_cases_user_id ON Cases(user_id);`);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_cases_next_date ON Cases(NextDate);`);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_cases_case_status ON Cases(CaseStatus);`);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_cases_updated_at ON Cases(updated_at);`);

  await db.execAsync(CREATE_CASE_DOCUMENTS_TABLE);
  await db.execAsync(CREATE_CASE_DOCUMENTS_CASE_ID_INDEX);
  await db.execAsync(CREATE_CASE_TIMELINE_TABLE);
  await db.execAsync(CREATE_CASE_TIMELINE_CASE_ID_INDEX);
  await db.execAsync(CREATE_CASE_TIMELINE_UPDATED_AT_TRIGGER);
  await initializeUserProfileDB(db);
  await initializeUserInformationDB(db);

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

// Function to seed initial data
export const seedInitialData = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  console.log("Seeding initial data...");

  // Seed Districts
  try {
    await db.withTransactionAsync(async () => {
      for (const stateObj of statesAndDistrictsData.states) {
        for (const distName of stateObj.districts) {
          await db.runAsync(
            "INSERT OR IGNORE INTO Districts (name, state, user_id) VALUES (?, ?, NULL)",
            [distName.trim(), stateObj.state.trim()]
          );
        }
      }
    });
    console.log("Predefined districts seeded or already exist.");
  } catch (error) {
    console.error("Error seeding predefined districts:", error);
    // Decide if you want to throw, or just log and continue
  }

  // Seed Police Stations for Delhi, Maharashtra, and Uttar Pradesh
  try {
    const targetStates = ["Delhi (NCT)", "Maharashtra", "Uttar Pradesh"];
    await db.withTransactionAsync(async () => {
      const districts = await db.getAllAsync<{ id: number; name: string; state: string }>(
        "SELECT id, name, state FROM Districts WHERE state IN (?, ?, ?)",
        targetStates
      );

      const mappings = (policeStationsData.mappings || {}) as Record<string, string[]>;

      for (const dist of districts) {
        let stations: string[] = [];
        if (mappings[dist.name]) {
          stations = mappings[dist.name];
        } else {
          const isMaharashtra = dist.state === "Maharashtra";
          const cityOrKotwali = isMaharashtra ? "City" : "Kotwali";
          stations = [
            `${dist.name} Sadar Police Station`,
            `${dist.name} ${cityOrKotwali} Police Station`,
            `${dist.name} Mahila Police Station`
          ];
        }

        for (const psName of stations) {
          await db.runAsync(
            "INSERT OR IGNORE INTO PoliceStations (name, district_id, user_id) VALUES (?, ?, NULL)",
            [psName.trim(), dist.id]
          );
        }
      }
    });
    console.log("Predefined police stations seeded or already exist.");
  } catch (error) {
    console.error("Error seeding predefined police stations:", error);
  }

  // Seed Case Types
  try {
    for (const caseType of PREDEFINED_CASE_TYPES) {
      // Current DDL has UNIQUE (name, user_id), so user_id NULL means unique by name.
      await db.runAsync(
        "INSERT OR IGNORE INTO CaseTypes (name, user_id) VALUES (?, NULL)",
        [caseType.name]
      );
    }
    console.log("Predefined case types seeded or already exist.");
  } catch (error) {
    console.error("Error seeding predefined case types:", error);
    // Decide if you want to throw, or just log and continue
  }

  // Seed Mock Cases for manual testing
  try {
    const casesCount = await db.getFirstAsync<{ count: number }>("SELECT count(*) as count FROM Cases;");
    if (casesCount && casesCount.count === 0) {
      console.log("Seeding mock cases for manual user verification...");
      const mockCases = [
        {
          uniqueId: "mock-case-1",
          CaseTitle: "Aman Gupta vs. State of Delhi",
          ClientName: "Aman Gupta",
          CNRNumber: "DLDH010001232026",
          case_number: "Crl.A./450/2026",
          court_name: "High Court of Delhi - Room 12",
          case_type_name: "Criminal Appeal",
          CaseStatus: "Active",
          Priority: "High",
          NextDate: new Date().toISOString().split('T')[0], // Today
          ClientContactNumber: "+919876543210",
          FirstParty: "Aman Gupta",
          OppositeParty: "State of Delhi",
          JudgeName: "Justice S. K. Kaul",
          Undersection: "Section 302 IPC",
          CaseDescription: "Appeal against conviction under section 302 IPC."
        },
        {
          uniqueId: "mock-case-2",
          CaseTitle: "Priya Sharma vs. Amit Sharma",
          ClientName: "Priya Sharma",
          CNRNumber: "DLDH010001242026",
          case_number: "H.M.P./89/2026",
          court_name: "Family Court - Dwarka",
          case_type_name: "Family Matter",
          CaseStatus: "Active",
          Priority: "Medium",
          NextDate: new Date().toISOString().split('T')[0], // Today
          ClientContactNumber: "+919812345678",
          FirstParty: "Priya Sharma",
          OppositeParty: "Amit Sharma",
          JudgeName: "Judge Anita Singh",
          Undersection: "Section 13 Hindu Marriage Act",
          CaseDescription: "Petition for dissolution of marriage by mutual consent."
        },
        {
          uniqueId: "mock-case-3",
          CaseTitle: "Tech Solutions Pvt Ltd vs. BuildCorp India",
          ClientName: "Tech Solutions Pvt Ltd",
          CNRNumber: "MHCB010098762025",
          case_number: "O.S./1240/2025",
          court_name: "City Civil Court - Mumbai",
          case_type_name: "Civil Suit",
          CaseStatus: "Active",
          Priority: "High",
          NextDate: new Date().toISOString().split('T')[0], // Today
          ClientContactNumber: "+919900887766",
          FirstParty: "Tech Solutions Pvt Ltd",
          OppositeParty: "BuildCorp India",
          JudgeName: "Judge R. V. Patel",
          Undersection: "Section 37 Arbitration Act",
          CaseDescription: "Commercial dispute regarding non-payment of software licensing fees."
        },
        {
          uniqueId: "mock-case-4",
          CaseTitle: "State of UP vs. Vikram Singh",
          ClientName: "State of UP",
          CNRNumber: "UPBR010022332024",
          case_number: "Sessions Trial/45/2024",
          court_name: "District & Sessions Court - Bareilly",
          case_type_name: "Criminal Trial",
          CaseStatus: "Active",
          Priority: "Low",
          NextDate: new Date().toISOString().split('T')[0], // Today
          ClientContactNumber: "+918877665544",
          FirstParty: "State of UP",
          OppositeParty: "Vikram Singh",
          JudgeName: "Judge M. C. Gupta",
          Undersection: "Section 307 IPC",
          CaseDescription: "Attempt to murder trial."
        },
        {
          uniqueId: "mock-case-5",
          CaseTitle: "Rakesh Verma vs. Municipal Corporation",
          ClientName: "Rakesh Verma",
          CNRNumber: "DLCT010055442026",
          case_number: "W.P.(C)/5672/2026",
          court_name: "High Court of Delhi - Room 5",
          case_type_name: "Writ Petition",
          CaseStatus: "Active",
          Priority: "Medium",
          NextDate: new Date().toISOString().split('T')[0], // Today
          ClientContactNumber: "+917766554433",
          FirstParty: "Rakesh Verma",
          OppositeParty: "Municipal Corporation of Delhi",
          JudgeName: "Justice Manmohan",
          Undersection: "Article 226 Constitution of India",
          CaseDescription: "Writ petition against illegal demolition notice."
        },
        {
          uniqueId: "mock-case-6",
          CaseTitle: "Suresh Kumar vs. Union of India",
          ClientName: "Suresh Kumar",
          CNRNumber: "DLDH010099882025",
          case_number: "W.P.(C)/9988/2025",
          court_name: "High Court of Delhi",
          case_type_name: "Service Matter",
          CaseStatus: "Active",
          Priority: "Low",
          NextDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
          ClientContactNumber: "+919876543211",
          FirstParty: "Suresh Kumar",
          OppositeParty: "Union of India",
          JudgeName: "Justice Sanjeev Sachdeva",
          Undersection: "Article 14 Constitution of India",
          CaseDescription: "Service promotion dispute."
        },
        {
          uniqueId: "mock-case-7",
          CaseTitle: "Anjali Rao vs. ICICI Bank",
          ClientName: "Anjali Rao",
          CNRNumber: "MHCB010088772026",
          case_number: "C.C./405/2026",
          court_name: "Consumer Forum - Bandra",
          case_type_name: "Consumer Complaint",
          CaseStatus: "Active",
          Priority: "High",
          NextDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
          ClientContactNumber: "+919998887776",
          FirstParty: "Anjali Rao",
          OppositeParty: "ICICI Bank Ltd",
          JudgeName: "President K. S. Chaudhari",
          Undersection: "Section 12 Consumer Protection Act",
          CaseDescription: "Unfair trade practices regarding credit card charges."
        },
        {
          uniqueId: "mock-case-8",
          CaseTitle: "Karan Johar vs. Dharma Productions Employees",
          ClientName: "Karan Johar",
          CNRNumber: "MHCB010011222026",
          case_number: "L.C./78/2026",
          court_name: "Labour Court - Mumbai",
          case_type_name: "Labour Matter",
          CaseStatus: "Active",
          Priority: "Medium",
          NextDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
          ClientContactNumber: "+919888877777",
          FirstParty: "Karan Johar",
          OppositeParty: "Dharma Productions Employees Union",
          JudgeName: "Judge S. B. Shinde",
          Undersection: "Industrial Disputes Act Section 10",
          CaseDescription: "Wages settlement dispute."
        },
        {
          uniqueId: "mock-case-9",
          CaseTitle: "State of Maharashtra vs. Sanjay Dutt",
          ClientName: "State of Maharashtra",
          CNRNumber: "MHCB010077881993",
          case_number: "TADA Case/1/1993",
          court_name: "Special TADA Court - Mumbai",
          case_type_name: "Criminal Trial",
          CaseStatus: "Closed",
          Priority: "High",
          NextDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
          ClientContactNumber: "+919999999999",
          FirstParty: "State of Maharashtra",
          OppositeParty: "Sanjay Dutt",
          JudgeName: "Judge P. D. Kode",
          Undersection: "TADA Act Section 3",
          CaseDescription: "Closed trial under TADA provisions."
        },
        {
          uniqueId: "mock-case-10",
          CaseTitle: "Deepak Chawla vs. Income Tax Department",
          ClientName: "Deepak Chawla",
          CNRNumber: "DLDH010066772025",
          case_number: "ITA/890/2025",
          court_name: "ITAT - Delhi Bench",
          case_type_name: "Revenue Matter",
          CaseStatus: "Active",
          Priority: "Low",
          NextDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
          ClientContactNumber: "+919555444332",
          FirstParty: "Deepak Chawla",
          OppositeParty: "Income Tax Department",
          JudgeName: "Member R. S. Syal",
          Undersection: "Section 254 Income Tax Act",
          CaseDescription: "Tax assessment appeal."
        },
        {
          uniqueId: "mock-case-11",
          CaseTitle: "Neeraj Chopra vs. Javelin Sports India",
          ClientName: "Neeraj Chopra",
          CNRNumber: "UPBR010044552026",
          case_number: "O.S./23/2026",
          court_name: "High Court of Allahabad",
          case_type_name: "Arbitration",
          CaseStatus: "Active",
          Priority: "High",
          NextDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
          ClientContactNumber: "+919877777777",
          FirstParty: "Neeraj Chopra",
          OppositeParty: "Javelin Sports India",
          JudgeName: "Justice Pritinker Diwaker",
          Undersection: "Section 9 Arbitration Act",
          CaseDescription: "Interim measures in sports contract arbitration."
        },
        {
          uniqueId: "mock-case-12",
          CaseTitle: "Sunil Gavaskar vs. Rohan Gavaskar",
          ClientName: "Sunil Gavaskar",
          CNRNumber: "MHCB010055662026",
          case_number: "Partition Suit/12/2026",
          court_name: "High Court of Bombay",
          case_type_name: "Civil Suit",
          CaseStatus: "Active",
          Priority: "Medium",
          NextDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
          ClientContactNumber: "+919111222333",
          FirstParty: "Sunil Gavaskar",
          OppositeParty: "Rohan Gavaskar",
          JudgeName: "Justice G. S. Patel",
          Undersection: "Section 54 CPC",
          CaseDescription: "Amicable family property partition suit."
        },
        {
          uniqueId: "mock-case-13",
          CaseTitle: "State of Karnataka vs. Veerappan Associates",
          ClientName: "State of Karnataka",
          CNRNumber: "KABU010033442026",
          case_number: "Spl.CC/456/2026",
          court_name: "Special Forest Court - Bangalore",
          case_type_name: "Criminal Trial",
          CaseStatus: "Active",
          Priority: "High",
          NextDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
          ClientContactNumber: "+919000000000",
          FirstParty: "State of Karnataka",
          OppositeParty: "Veerappan Associates",
          JudgeName: "Judge V. G. Bopaiah",
          Undersection: "Forest Act Section 104",
          CaseDescription: "Illegal smuggling of sandalwood."
        },
        {
          uniqueId: "mock-case-14",
          CaseTitle: "Shalini Sharma vs. CBSE",
          ClientName: "Shalini Sharma",
          CNRNumber: "DLDH010044882026",
          case_number: "W.P.(C)/7890/2026",
          court_name: "High Court of Delhi - Room 2",
          case_type_name: "Writ Petition",
          CaseStatus: "Active",
          Priority: "Low",
          NextDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
          ClientContactNumber: "+919666777888",
          FirstParty: "Shalini Sharma",
          OppositeParty: "CBSE",
          JudgeName: "Justice Rekha Palli",
          Undersection: "Article 226 Constitution of India",
          CaseDescription: "Petition seeking correction of spelling in Marksheet."
        },
        {
          uniqueId: "mock-case-15",
          CaseTitle: "Reliance Industries vs. Future Retail",
          ClientName: "Reliance Industries",
          CNRNumber: "MHCB010022992025",
          case_number: "Com.A.S./40/2025",
          court_name: "Commercial Court - Mumbai",
          case_type_name: "Corporate",
          CaseStatus: "Active",
          Priority: "High",
          NextDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
          ClientContactNumber: "+919222222222",
          FirstParty: "Reliance Industries Ltd",
          OppositeParty: "Future Retail Ltd",
          JudgeName: "Judge B. P. Colabawalla",
          Undersection: "Insolvency and Bankruptcy Code Section 7",
          CaseDescription: "Corporate insolvency resolution process."
        },
        {
          uniqueId: "mock-case-16",
          CaseTitle: "Vijay Mallya vs. SBI Consortium",
          ClientName: "Vijay Mallya",
          CNRNumber: "KABU010011992022",
          case_number: "O.A./555/2022",
          court_name: "DRT - Bangalore",
          case_type_name: "Revenue Matter",
          CaseStatus: "Active",
          Priority: "High",
          NextDate: null,
          ClientContactNumber: "+447700900077",
          FirstParty: "Vijay Mallya",
          OppositeParty: "SBI Consortium",
          JudgeName: "Presiding Officer DRT",
          Undersection: "SARFAESI Act Section 13",
          CaseDescription: "Recovery of dues from Kingfisher Airlines."
        },
        {
          uniqueId: "mock-case-17",
          CaseTitle: "Arnab Goswami vs. State of Maharashtra",
          ClientName: "Arnab Goswami",
          CNRNumber: "MHCB010088992023",
          case_number: "Crl.W.P./890/2023",
          court_name: "High Court of Bombay",
          case_type_name: "Writ Petition",
          CaseStatus: "Active",
          Priority: "Medium",
          NextDate: null,
          ClientContactNumber: "+919111111111",
          FirstParty: "Arnab Goswami",
          OppositeParty: "State of Maharashtra",
          JudgeName: "Justice S. S. Shinde",
          Undersection: "Section 482 CrPC",
          CaseDescription: "Petition for quashing FIR in abetment to suicide case."
        },
        {
          uniqueId: "mock-case-18",
          CaseTitle: "Mukesh Ambani vs. Anil Ambani (Gas Dispute)",
          ClientName: "Mukesh Ambani",
          CNRNumber: "MHCB010000002010",
          case_number: "Civil Appeal/123/2010",
          court_name: "Supreme Court of India",
          case_type_name: "Civil Suit",
          CaseStatus: "Closed",
          Priority: "High",
          NextDate: null,
          ClientContactNumber: "+919822012345",
          FirstParty: "Mukesh Ambani",
          OppositeParty: "Anil Ambani",
          JudgeName: "CJI K. G. Balakrishnan",
          Undersection: "Companies Act Section 397",
          CaseDescription: "Gas supply and pricing family dispute."
        },
        {
          uniqueId: "mock-case-19",
          CaseTitle: "Ajay Devgn vs. Income Tax Appellate",
          ClientName: "Ajay Devgn",
          CNRNumber: "MHCB010011442024",
          case_number: "ITA/560/2024",
          court_name: "ITAT - Mumbai",
          case_type_name: "Revenue Matter",
          CaseStatus: "Active",
          Priority: "Low",
          NextDate: null,
          ClientContactNumber: "+919000100020",
          FirstParty: "Ajay Devgn",
          OppositeParty: "Income Tax Appellate Tribunal",
          JudgeName: "Vice President ITAT",
          Undersection: "Section 143(3) Income Tax Act",
          CaseDescription: "Disallowance of business promotional expenses."
        },
        {
          uniqueId: "mock-case-20",
          CaseTitle: "Gautam Adani vs. Hindenburg Research",
          ClientName: "Gautam Adani",
          CNRNumber: "GJAH010099002026",
          case_number: "Defamation Suit/120/2026",
          court_name: "High Court of Gujarat",
          case_type_name: "Civil Suit",
          CaseStatus: "Active",
          Priority: "High",
          NextDate: null,
          ClientContactNumber: "+919000000001",
          FirstParty: "Gautam Adani",
          OppositeParty: "Hindenburg Research LLC",
          JudgeName: "Justice Sunita Agarwal",
          Undersection: "Section 499 IPC / Defamation CPC",
          CaseDescription: "Suit for damages and permanent injunction."
        }
      ];

      for (const mc of mockCases) {
        await db.runAsync(
          `INSERT INTO Cases (
            uniqueId, CaseTitle, ClientName, CNRNumber, case_number, 
            court_name, case_type_name, CaseStatus, Priority, NextDate, 
            ClientContactNumber, FirstParty, OppositeParty, JudgeName, 
            Undersection, CaseDescription, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [
            mc.uniqueId, mc.CaseTitle, mc.ClientName, mc.CNRNumber, mc.case_number,
            mc.court_name, mc.case_type_name, mc.CaseStatus, mc.Priority, mc.NextDate,
            mc.ClientContactNumber, mc.FirstParty, mc.OppositeParty, mc.JudgeName,
            mc.Undersection, mc.CaseDescription
          ]
        );
      }
      console.log("Mock cases seeded successfully.");
    }
  } catch (error) {
    console.error("Error seeding mock cases:", error);
  }

  console.log("Initial data seeding process complete.");
};
