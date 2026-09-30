import { sql } from "drizzle-orm";
import {
  sqliteTable,
  integer,
  text,
  real,
  index,
} from "drizzle-orm/sqlite-core";

export const Users = sqliteTable("Users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name"),
  email: text("email").unique(),
  phone: text("phone"),
  barCouncilNumber: text("barCouncilNumber"),
  chamberAddress: text("chamberAddress"),
  created_at: text("created_at")
    .notNull()
    .default(sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`),
});

export const CaseTypes = sqliteTable("CaseTypes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  user_id: integer("user_id").references(() => Users.id, {
    onDelete: "cascade",
  }),
});

export const Courts = sqliteTable("Courts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  court_type: text("court_type"), // e.g. District, High Court, Sessions
  user_id: integer("user_id").references(() => Users.id, {
    onDelete: "cascade",
  }),
});

export const Districts = sqliteTable("Districts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  state: text("state"),
  user_id: integer("user_id").references(() => Users.id, {
    onDelete: "cascade",
  }),
});

export const PoliceStations = sqliteTable("PoliceStations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  district_id: integer("district_id").references(() => Districts.id, {
    onDelete: "set null",
  }),
  user_id: integer("user_id").references(() => Users.id, {
    onDelete: "cascade",
  }),
});

export const Cases = sqliteTable(
  "Cases",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    uniqueId: text("uniqueId").unique().notNull(),
    user_id: integer("user_id").references(() => Users.id, {
      onDelete: "cascade",
    }),

    CaseTitle: text("CaseTitle"),
    ClientName: text("ClientName"),
    OnBehalfOf: text("OnBehalfOf"), // Petitioner / Respondent / Applicant / Accused
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
    police_station_id: integer("police_station_id").references(
      () => PoliceStations.id,
      { onDelete: "set null" }
    ),
    district_id: integer("district_id").references(() => Districts.id, {
      onDelete: "set null",
    }),
    Undersection: text("Undersection"),

    FirstParty: text("FirstParty"),
    OppositeParty: text("OppositeParty"),
    Accussed: text("Accussed"),
    ClientContactNumber: text("ClientContactNumber"),

    JudgeName: text("JudgeName"),
    OpposingCounsel: text("OpposingCounsel"),
    OppositeAdvocate: text("OppositeAdvocate"),
    OppAdvocateContactNumber: text("OppAdvocateContactNumber"),

    CaseStatus: text("CaseStatus").default("Open"), // Open, In Progress, Reserved, Disposed, Appealed
    Priority: text("Priority").default("Medium"), // High, Medium, Low
    case_stage: text("case_stage"), // Framing of Charge, Evidence, Arguments, Notice, etc.

    total_fee: integer("total_fee").default(0),
    fee_paid: integer("fee_paid").default(0),
    date_fee: real("date_fee").default(0),
    date_fee_collected: real("date_fee_collected").default(0),
    date_fee_paid: integer("date_fee_paid").default(0),

    CaseDescription: text("CaseDescription"),
    CaseNotes: text("CaseNotes"),
    assigned_member_id: integer("assigned_member_id"),

    created_at: text("created_at")
      .notNull()
      .default(sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`),
    updated_at: text("updated_at")
      .notNull()
      .default(sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`),
  },
  (table) => ({
    userIdIdx: index("idx_cases_user_id").on(table.user_id),
    nextDateIdx: index("idx_cases_next_date").on(table.NextDate),
    caseStatusIdx: index("idx_cases_case_status").on(table.CaseStatus),
    updatedAtIdx: index("idx_cases_updated_at").on(table.updated_at),
  })
);

export const CaseTimeline = sqliteTable(
  "CaseTimeline",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    case_id: integer("case_id")
      .notNull()
      .references(() => Cases.id, { onDelete: "cascade" }),
    hearing_date: text("hearing_date").notNull(),
    notes: text("notes"),
    event_type: text("event_type").default("hearing"), // hearing, order, fee, adjournment, filing
    amount: real("amount"),
    payment_mode: text("payment_mode"),
    created_at: text("created_at")
      .notNull()
      .default(sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`),
    updated_at: text("updated_at")
      .notNull()
      .default(sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`),
  },
  (table) => ({
    caseIdIdx: index("idx_casetimeline_case_id").on(table.case_id),
    hearingDateIdx: index("idx_casetimeline_hearing_date").on(table.hearing_date),
  })
);

export const CaseDocuments = sqliteTable(
  "CaseDocuments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    case_id: integer("case_id")
      .notNull()
      .references(() => Cases.id, { onDelete: "cascade" }),
    stored_filename: text("stored_filename").notNull(),
    original_display_name: text("original_display_name").notNull(),
    file_type: text("file_type"),
    file_size: integer("file_size"),
    category: text("category").default("general"), // pleading, order, evidence, receipt
    created_at: text("created_at")
      .notNull()
      .default(sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`),
    user_id: integer("user_id").references(() => Users.id, {
      onDelete: "set null",
    }),
  },
  (table) => ({
    caseIdIdx: index("idx_casedocuments_case_id").on(table.case_id),
  })
);

export const DocumentDrafts = sqliteTable("DocumentDrafts", {
  id: text("id").primaryKey(), // UUID or string
  user_id: integer("user_id").references(() => Users.id, { onDelete: "set null" }),
  chamber_id: text("chamber_id"),
  author_name: text("author_name"),
  author_role: text("author_role"),
  case_id: integer("case_id").references(() => Cases.id, { onDelete: "set null" }),
  case_title: text("case_title"),
  client_name: text("client_name"),
  case_number: text("case_number"),
  title: text("title").notNull(),
  template_type: text("template_type").notNull(), // bail, vakalatnama, notice, petition, memo, custom
  template_category: text("template_category").default("general"),
  template_description: text("template_description"),
  html_content: text("html_content"),
  is_custom_template: integer("is_custom_template").default(0), // 0 or 1
  created_at: text("created_at")
    .notNull()
    .default(sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`),
  updated_at: text("updated_at")
    .notNull()
    .default(sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`),
});

export const LawyerProfiles = sqliteTable("LawyerProfiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id")
    .notNull()
    .references(() => Users.id, { onDelete: "cascade" }),
  name: text("name"),
  avatarUrl: text("avatarUrl"),
  designation: text("designation"),
  practiceAreas: text("practiceAreas"),
  aboutMe: text("aboutMe"),
  contactInfo: text("contactInfo"),
  languages: text("languages"),
  barCouncilNumber: text("barCouncilNumber"),
  chamberAddress: text("chamberAddress"),
  letterheadConfig: text("letterheadConfig"), // JSON config for PDF generation
});

export const AppNotifications = sqliteTable("AppNotifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  category: text("category").default("hearing"), // hearing, fee, system
  case_id: integer("case_id"),
  is_read: integer("is_read").default(0),
  created_at: text("created_at")
    .notNull()
    .default(sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`),
});

export const ChamberMembers = sqliteTable("ChamberMembers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").references(() => Users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role").default("Junior Advocate"), // "Junior Advocate", "Senior Associate", "Court Clerk / Munshi", "Intern"
  barCouncilNumber: text("barCouncilNumber"),
  phone: text("phone"),
  email: text("email"),
  assigned_courts: text("assigned_courts"), // e.g. "Tis Hazari, Patiala House"
  status: text("status").default("Active"), // "Active", "On Leave"
  created_at: text("created_at")
    .notNull()
    .default(sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`),
});

export const CaseAssignments = sqliteTable("CaseAssignments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  case_id: integer("case_id").notNull().references(() => Cases.id, { onDelete: "cascade" }),
  member_id: integer("member_id").notNull().references(() => ChamberMembers.id, { onDelete: "cascade" }),
  duty_date: text("duty_date").notNull(), // YYYY-MM-DD
  duty_type: text("duty_type").default("Pass-Over Request"), // "Pass-Over Request", "Argue Bail / Application", "Evidence / Cross", "Take Next Date", "Process Fee / Inspection", "Collect Order"
  status: text("status").default("Pending"), // "Pending", "Attended", "Pass-Over Granted", "Date Taken", "Completed"
  notes: text("notes"),
  created_at: text("created_at")
    .notNull()
    .default(sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`),
  updated_at: text("updated_at")
    .notNull()
    .default(sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`),
});

