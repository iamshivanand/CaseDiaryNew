import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dbDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "casediary.db");
const sqlite = new Database(dbPath);

// Enable WAL mode & foreign keys for high performance and integrity
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

// Initialize tables if not already created
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    barCouncilNumber TEXT,
    chamberAddress TEXT,
    created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))
  );

  CREATE TABLE IF NOT EXISTS CaseTypes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    user_id INTEGER REFERENCES Users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS Courts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    court_type TEXT,
    user_id INTEGER REFERENCES Users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS Districts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    state TEXT,
    user_id INTEGER REFERENCES Users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS PoliceStations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    district_id INTEGER REFERENCES Districts(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES Users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS Cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uniqueId TEXT UNIQUE NOT NULL,
    user_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
    CaseTitle TEXT,
    ClientName TEXT,
    OnBehalfOf TEXT,
    CNRNumber TEXT,
    case_number TEXT,
    case_year INTEGER,
    session_trial_number TEXT,
    court_id INTEGER,
    court_name TEXT,
    case_type_id INTEGER,
    case_type_name TEXT,
    dateFiled TEXT,
    NextDate TEXT,
    PreviousDate TEXT,
    StatuteOfLimitations TEXT,
    crime_number TEXT,
    crime_year INTEGER,
    police_station_id INTEGER REFERENCES PoliceStations(id) ON DELETE SET NULL,
    district_id INTEGER REFERENCES Districts(id) ON DELETE SET NULL,
    Undersection TEXT,
    FirstParty TEXT,
    OppositeParty TEXT,
    Accussed TEXT,
    ClientContactNumber TEXT,
    JudgeName TEXT,
    OpposingCounsel TEXT,
    OppositeAdvocate TEXT,
    OppAdvocateContactNumber TEXT,
    CaseStatus TEXT DEFAULT 'Open',
    Priority TEXT DEFAULT 'Medium',
    case_stage TEXT,
    total_fee INTEGER DEFAULT 0,
    fee_paid INTEGER DEFAULT 0,
    date_fee REAL DEFAULT 0,
    date_fee_collected REAL DEFAULT 0,
    date_fee_paid INTEGER DEFAULT 0,
    CaseDescription TEXT,
    CaseNotes TEXT,
    created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),
    updated_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))
  );

  CREATE TABLE IF NOT EXISTS CaseTimeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL REFERENCES Cases(id) ON DELETE CASCADE,
    hearing_date TEXT NOT NULL,
    notes TEXT,
    event_type TEXT DEFAULT 'hearing',
    amount REAL,
    payment_mode TEXT,
    created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),
    updated_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))
  );

  CREATE TABLE IF NOT EXISTS CaseDocuments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL REFERENCES Cases(id) ON DELETE CASCADE,
    stored_filename TEXT NOT NULL,
    original_display_name TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    category TEXT DEFAULT 'general',
    created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),
    user_id INTEGER REFERENCES Users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS DocumentDrafts (
    id TEXT PRIMARY KEY,
    user_id INTEGER REFERENCES Users(id) ON DELETE SET NULL,
    chamber_id TEXT,
    author_name TEXT,
    author_role TEXT,
    case_id INTEGER REFERENCES Cases(id) ON DELETE SET NULL,
    case_title TEXT,
    client_name TEXT,
    case_number TEXT,
    title TEXT NOT NULL,
    template_type TEXT NOT NULL,
    template_category TEXT DEFAULT 'general',
    template_description TEXT,
    html_content TEXT,
    is_custom_template INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),
    updated_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))
  );

  CREATE TABLE IF NOT EXISTS LawyerProfiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    name TEXT,
    avatarUrl TEXT,
    designation TEXT,
    practiceAreas TEXT,
    aboutMe TEXT,
    contactInfo TEXT,
    languages TEXT,
    barCouncilNumber TEXT,
    chamberAddress TEXT,
    letterheadConfig TEXT
  );

  CREATE TABLE IF NOT EXISTS AppNotifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT DEFAULT 'hearing',
    case_id INTEGER,
    is_read INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))
  );

  CREATE TABLE IF NOT EXISTS ChamberMembers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'Junior Advocate',
    barCouncilNumber TEXT,
    phone TEXT,
    email TEXT,
    assigned_courts TEXT,
    status TEXT DEFAULT 'Active',
    created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))
  );

  CREATE TABLE IF NOT EXISTS CaseAssignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL REFERENCES Cases(id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL REFERENCES ChamberMembers(id) ON DELETE CASCADE,
    duty_date TEXT NOT NULL,
    duty_type TEXT DEFAULT 'Pass-Over Request',
    status TEXT DEFAULT 'Pending',
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),
    updated_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))
  );

  CREATE INDEX IF NOT EXISTS idx_cases_user_id ON Cases(user_id);
  CREATE INDEX IF NOT EXISTS idx_cases_next_date ON Cases(NextDate);
  CREATE INDEX IF NOT EXISTS idx_cases_case_status ON Cases(CaseStatus);
  CREATE INDEX IF NOT EXISTS idx_cases_updated_at ON Cases(updated_at);
  CREATE INDEX IF NOT EXISTS idx_casetimeline_case_id ON CaseTimeline(case_id);
  CREATE INDEX IF NOT EXISTS idx_casetimeline_hearing_date ON CaseTimeline(hearing_date);
  CREATE INDEX IF NOT EXISTS idx_caseassignments_duty_date ON CaseAssignments(duty_date);
  CREATE INDEX IF NOT EXISTS idx_caseassignments_member_id ON CaseAssignments(member_id);
`);

// Migration safeguard for existing sqlite db: add assigned_member_id column if missing
try {
  sqlite.exec("ALTER TABLE Cases ADD COLUMN assigned_member_id INTEGER REFERENCES ChamberMembers(id);");
} catch {
  // column already exists
}

// Migration safeguards for DocumentDrafts multi-tenancy & custom templates
const draftMigrations = [
  "ALTER TABLE DocumentDrafts ADD COLUMN user_id INTEGER REFERENCES Users(id) ON DELETE SET NULL;",
  "ALTER TABLE DocumentDrafts ADD COLUMN chamber_id TEXT;",
  "ALTER TABLE DocumentDrafts ADD COLUMN author_name TEXT;",
  "ALTER TABLE DocumentDrafts ADD COLUMN author_role TEXT;",
  "ALTER TABLE DocumentDrafts ADD COLUMN template_category TEXT DEFAULT 'general';",
  "ALTER TABLE DocumentDrafts ADD COLUMN template_description TEXT;",
];
for (const sqlQuery of draftMigrations) {
  try {
    sqlite.exec(sqlQuery);
  } catch {
    // column already exists
  }
}

export const db = drizzle(sqlite, { schema });
export { sqlite };

// Auto-seed initial sample cases and advocate profile if database is fresh
import("./seed").then(({ seedDatabase, seedChamberTeam }) => {
  try {
    seedDatabase();
    if (seedChamberTeam) seedChamberTeam();
  } catch (err) {
    console.error("Auto-seed error:", err);
  }
});

