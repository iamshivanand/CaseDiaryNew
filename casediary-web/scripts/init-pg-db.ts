import { sql } from "../src/db/pgClient";

async function main() {
  console.log("🚀 Initializing PostgreSQL tables in Docker container...");

  try {
    // 1. Chambers Table
    await sql`
      CREATE TABLE IF NOT EXISTS chambers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        plan_tier VARCHAR(50) NOT NULL DEFAULT 'solo',
        plan_status VARCHAR(50) NOT NULL DEFAULT 'active',
        max_seats INTEGER NOT NULL DEFAULT 1,
        storage_limit_mb INTEGER NOT NULL DEFAULT 5120,
        billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
        trial_ends_at TIMESTAMP,
        subscription_expires_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    // 2. Users Table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(20) UNIQUE,
        password_hash TEXT,
        "barCouncilNumber" VARCHAR(100),
        "chamberAddress" TEXT,
        role VARCHAR(50) NOT NULL DEFAULT 'senior_advocate',
        avatar_url TEXT,
        is_verified BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    // 3. Chamber Members Table
    await sql`
      CREATE TABLE IF NOT EXISTS chamber_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chamber_id UUID NOT NULL REFERENCES chambers(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'Junior Advocate',
        "barCouncilNumber" VARCHAR(100),
        phone VARCHAR(20),
        email VARCHAR(255),
        assigned_courts TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'Active',
        joined_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    // 4. Cases Table
    await sql`
      CREATE TABLE IF NOT EXISTS cases (
        id SERIAL PRIMARY KEY,
        "uniqueId" TEXT UNIQUE NOT NULL,
        chamber_id UUID REFERENCES chambers(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        assigned_member_id UUID REFERENCES users(id) ON DELETE SET NULL,

        "CaseTitle" TEXT,
        "ClientName" TEXT,
        "OnBehalfOf" TEXT,
        "CNRNumber" TEXT,
        case_number TEXT,
        case_year INTEGER,
        session_trial_number TEXT,

        court_id INTEGER,
        court_name TEXT,
        case_type_id INTEGER,
        case_type_name TEXT,

        "dateFiled" TEXT,
        "NextDate" TEXT,
        "PreviousDate" TEXT,
        "StatuteOfLimitations" TEXT,

        crime_number TEXT,
        crime_year INTEGER,
        police_station_name TEXT,
        district_name TEXT,
        "Undersection" TEXT,

        "FirstParty" TEXT,
        "OppositeParty" TEXT,
        "Accussed" TEXT,
        "ClientContactNumber" TEXT,

        "JudgeName" TEXT,
        "OpposingCounsel" TEXT,
        "OppositeAdvocate" TEXT,
        "OppAdvocateContactNumber" TEXT,

        "CaseStatus" TEXT DEFAULT 'Open',
        "Priority" TEXT DEFAULT 'Medium',
        case_stage TEXT,

        total_fee INTEGER DEFAULT 0,
        fee_paid INTEGER DEFAULT 0,
        date_fee REAL DEFAULT 0,
        date_fee_collected REAL DEFAULT 0,
        date_fee_paid INTEGER DEFAULT 0,

        "CaseDescription" TEXT,
        "CaseNotes" TEXT,

        is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
        sync_version INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    // 5. Case Timeline
    await sql`
      CREATE TABLE IF NOT EXISTS case_timeline (
        id SERIAL PRIMARY KEY,
        "uniqueId" TEXT UNIQUE NOT NULL,
        case_unique_id TEXT NOT NULL REFERENCES cases("uniqueId") ON DELETE CASCADE,
        hearing_date TEXT NOT NULL,
        notes TEXT,
        event_type VARCHAR(50) DEFAULT 'hearing',
        amount REAL,
        payment_mode VARCHAR(50),
        is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    // 6. Case Documents
    await sql`
      CREATE TABLE IF NOT EXISTS case_documents (
        id SERIAL PRIMARY KEY,
        "uniqueId" TEXT UNIQUE NOT NULL,
        case_unique_id TEXT NOT NULL REFERENCES cases("uniqueId") ON DELETE CASCADE,
        stored_filename TEXT NOT NULL,
        original_display_name TEXT NOT NULL,
        file_type VARCHAR(50),
        file_size INTEGER,
        file_url TEXT,
        category VARCHAR(50) DEFAULT 'general',
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    // 7. Document Drafts
    await sql`
      CREATE TABLE IF NOT EXISTS document_drafts (
        id TEXT PRIMARY KEY,
        chamber_id UUID REFERENCES chambers(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        case_unique_id TEXT,
        case_title TEXT,
        client_name TEXT,
        case_number TEXT,
        title TEXT NOT NULL,
        template_type TEXT NOT NULL,
        template_category TEXT DEFAULT 'general',
        html_content TEXT,
        prosemirror_json TEXT,
        is_custom_template BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    // 8. Case Assignments
    await sql`
      CREATE TABLE IF NOT EXISTS case_assignments (
        id SERIAL PRIMARY KEY,
        "uniqueId" TEXT UNIQUE NOT NULL,
        chamber_id UUID NOT NULL REFERENCES chambers(id) ON DELETE CASCADE,
        case_unique_id TEXT NOT NULL REFERENCES cases("uniqueId") ON DELETE CASCADE,
        member_id UUID NOT NULL REFERENCES chamber_members(id) ON DELETE CASCADE,
        duty_date TEXT NOT NULL,
        duty_type TEXT DEFAULT 'Pass-Over Request',
        status TEXT DEFAULT 'Pending',
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    // Indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_cases_unique_id ON cases("uniqueId");`;
    await sql`CREATE INDEX IF NOT EXISTS idx_cases_chamber ON cases(chamber_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_cases_next_date ON cases("NextDate");`;
    await sql`CREATE INDEX IF NOT EXISTS idx_timeline_case_unique ON case_timeline(case_unique_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_assignments_duty_date ON case_assignments(duty_date);`;

    console.log("✅ All PostgreSQL tables & indexes created successfully in Docker!");
  } catch (err) {
    console.error("❌ Failed to initialize database:", err);
  } finally {
    await sql.end();
  }
}

main();
