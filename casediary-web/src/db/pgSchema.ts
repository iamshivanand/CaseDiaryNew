import {
  pgTable,
  serial,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  real,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

// ============================================================================
// 1. MULTI-TENANT CHAMBERS & SUBSCRIPTION PLANS
// ============================================================================
export const chambers = pgTable("chambers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "Sharma & Associates"
  plan_tier: varchar("plan_tier", { length: 50 }).default("solo").notNull(), // "solo" | "chamber_pro" | "firm_enterprise"
  plan_status: varchar("plan_status", { length: 50 }).default("active").notNull(), // "active" | "trial" | "past_due" | "cancelled"
  max_seats: integer("max_seats").default(1).notNull(), // Solo: 1, Pro: 5, Enterprise: 25+
  storage_limit_mb: integer("storage_limit_mb").default(5120).notNull(), // 5GB default
  billing_cycle: varchar("billing_cycle", { length: 20 }).default("monthly").notNull(), // "monthly" | "yearly"
  trial_ends_at: timestamp("trial_ends_at"),
  subscription_expires_at: timestamp("subscription_expires_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// 2. ADVOCATE USERS & AUTHENTICATION
// ============================================================================
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique(),
  phone: varchar("phone", { length: 20 }).unique(),
  password_hash: text("password_hash"), // Secure hash for web credentials
  barCouncilNumber: varchar("barCouncilNumber", { length: 100 }), // e.g. "D/1234/2018"
  chamberAddress: text("chamberAddress"),
  role: varchar("role", { length: 50 }).default("senior_advocate").notNull(), // "senior_advocate" | "junior_advocate" | "clerk" | "admin"
  avatar_url: text("avatar_url"),
  is_verified: boolean("is_verified").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// 3. CHAMBER TEAM MEMBERSHIP & ROLES
// ============================================================================
export const chamber_members = pgTable(
  "chamber_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    chamber_id: uuid("chamber_id")
      .references(() => chambers.id, { onDelete: "cascade" })
      .notNull(),
    user_id: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    role: varchar("role", { length: 50 }).default("Junior Advocate").notNull(), // "Senior Advocate", "Junior Advocate", "Court Clerk / Munshi"
    barCouncilNumber: varchar("barCouncilNumber", { length: 100 }),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 255 }),
    assigned_courts: text("assigned_courts"), // "Tis Hazari, High Court of Delhi"
    status: varchar("status", { length: 50 }).default("Active").notNull(), // "Active" | "On Leave" | "Invited"
    joined_at: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => ({
    chamberIdx: index("idx_chamber_members_chamber").on(table.chamber_id),
    userIdx: index("idx_chamber_members_user").on(table.user_id),
  })
);

// ============================================================================
// 4. CASES (100% PARITY WITH MOBILE SQLite + CLOUD SYNC METADATA)
// ============================================================================
export const cases = pgTable(
  "cases",
  {
    id: serial("id").primaryKey(),
    uniqueId: text("uniqueId").unique().notNull(), // Client UUID for non-conflicting sync
    chamber_id: uuid("chamber_id").references(() => chambers.id, {
      onDelete: "cascade",
    }),
    user_id: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    assigned_member_id: uuid("assigned_member_id").references(() => users.id, {
      onDelete: "set null",
    }),

    CaseTitle: text("CaseTitle"),
    ClientName: text("ClientName"),
    OnBehalfOf: text("OnBehalfOf"), // Petitioner / Respondent / Accused
    CNRNumber: text("CNRNumber"),
    case_number: text("case_number"),
    case_year: integer("case_year"),
    session_trial_number: text("session_trial_number"),

    court_id: integer("court_id"),
    court_name: text("court_name"),
    case_type_id: integer("case_type_id"),
    case_type_name: text("case_type_name"),

    dateFiled: text("dateFiled"),
    NextDate: text("NextDate"), // YYYY-MM-DD
    PreviousDate: text("PreviousDate"), // YYYY-MM-DD
    StatuteOfLimitations: text("StatuteOfLimitations"),

    crime_number: text("crime_number"),
    crime_year: integer("crime_year"),
    police_station_name: text("police_station_name"),
    district_name: text("district_name"),
    Undersection: text("Undersection"),

    FirstParty: text("FirstParty"),
    OppositeParty: text("OppositeParty"),
    Accussed: text("Accussed"),
    ClientContactNumber: text("ClientContactNumber"),

    JudgeName: text("JudgeName"),
    OpposingCounsel: text("OpposingCounsel"),
    OppositeAdvocate: text("OppositeAdvocate"),
    OppAdvocateContactNumber: text("OppAdvocateContactNumber"),

    CaseStatus: text("CaseStatus").default("Open"), // Open, In Progress, Reserved, Disposed
    Priority: text("Priority").default("Medium"), // High, Medium, Low
    case_stage: text("case_stage"), // Arguments, Evidence, Notice, etc.

    total_fee: integer("total_fee").default(0),
    fee_paid: integer("fee_paid").default(0),
    date_fee: real("date_fee").default(0),
    date_fee_collected: real("date_fee_collected").default(0),
    date_fee_paid: integer("date_fee_paid").default(0),

    CaseDescription: text("CaseDescription"),
    CaseNotes: text("CaseNotes"),

    // Cloud Sync & Integrity Flags
    is_deleted: boolean("is_deleted").default(false).notNull(), // Soft deletion for sync
    sync_version: integer("sync_version").default(1).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueIdIdx: index("idx_cases_unique_id").on(table.uniqueId),
    chamberIdx: index("idx_cases_chamber").on(table.chamber_id),
    userIdx: index("idx_cases_user").on(table.user_id),
    nextDateIdx: index("idx_cases_next_date").on(table.NextDate),
    updatedAtIdx: index("idx_cases_updated_at").on(table.updated_at),
  })
);

// ============================================================================
// 5. CASE TIMELINE (HEARINGS, ORDERS, PROCEEDINGS, FEES)
// ============================================================================
export const case_timeline = pgTable(
  "case_timeline",
  {
    id: serial("id").primaryKey(),
    uniqueId: text("uniqueId").unique().notNull(), // Client UUID
    case_unique_id: text("case_unique_id")
      .references(() => cases.uniqueId, { onDelete: "cascade" })
      .notNull(),
    hearing_date: text("hearing_date").notNull(),
    notes: text("notes"),
    event_type: varchar("event_type", { length: 50 }).default("hearing"), // hearing | order | fee | adjournment
    amount: real("amount"),
    payment_mode: varchar("payment_mode", { length: 50 }),
    is_deleted: boolean("is_deleted").default(false).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    timelineCaseIdx: index("idx_timeline_case_unique").on(table.case_unique_id),
    timelineDateIdx: index("idx_timeline_date").on(table.hearing_date),
  })
);

// ============================================================================
// 6. CASE DOCUMENTS & VAULT
// ============================================================================
export const case_documents = pgTable(
  "case_documents",
  {
    id: serial("id").primaryKey(),
    uniqueId: text("uniqueId").unique().notNull(),
    case_unique_id: text("case_unique_id")
      .references(() => cases.uniqueId, { onDelete: "cascade" })
      .notNull(),
    stored_filename: text("stored_filename").notNull(),
    original_display_name: text("original_display_name").notNull(),
    file_type: varchar("file_type", { length: 50 }),
    file_size: integer("file_size"),
    file_url: text("file_url"), // S3 / MinIO / Local cloud storage URL
    category: varchar("category", { length: 50 }).default("general"),
    user_id: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    is_deleted: boolean("is_deleted").default(false).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    docCaseIdx: index("idx_documents_case_unique").on(table.case_unique_id),
  })
);

// ============================================================================
// 7. LEGAL DRAFTING STUDIO (TIPTAP DOCUMENT DRAFTS)
// ============================================================================
export const document_drafts = pgTable("document_drafts", {
  id: text("id").primaryKey(), // UUID
  chamber_id: uuid("chamber_id").references(() => chambers.id, {
    onDelete: "cascade",
  }),
  user_id: uuid("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  case_unique_id: text("case_unique_id"),
  case_title: text("case_title"),
  client_name: text("client_name"),
  case_number: text("case_number"),
  title: text("title").notNull(),
  template_type: text("template_type").notNull(), // bail, vakalatnama, petition, memo
  template_category: text("template_category").default("general"),
  html_content: text("html_content"),
  prosemirror_json: text("prosemirror_json"), // TipTap lossless JSON exchange format
  is_custom_template: boolean("is_custom_template").default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// 8. CASE ASSIGNMENTS (PASS-OVER BOARD & JUNIOR DELEGATION)
// ============================================================================
export const case_assignments = pgTable(
  "case_assignments",
  {
    id: serial("id").primaryKey(),
    uniqueId: text("uniqueId").unique().notNull(),
    chamber_id: uuid("chamber_id")
      .references(() => chambers.id, { onDelete: "cascade" })
      .notNull(),
    case_unique_id: text("case_unique_id")
      .references(() => cases.uniqueId, { onDelete: "cascade" })
      .notNull(),
    member_id: uuid("member_id")
      .references(() => chamber_members.id, { onDelete: "cascade" })
      .notNull(),
    duty_date: text("duty_date").notNull(), // YYYY-MM-DD
    duty_type: text("duty_type").default("Pass-Over Request"),
    status: text("status").default("Pending"), // Pending | Attended | Pass-Over Granted | Completed
    notes: text("notes"),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    dutyDateIdx: index("idx_assignments_duty_date").on(table.duty_date),
    chamberAssignmentIdx: index("idx_assignments_chamber").on(table.chamber_id),
  })
);
