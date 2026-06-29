import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const Users = sqliteTable('Users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name'),
  email: text('email').unique(),
  created_at: text('created_at').notNull().default(sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`),
});

export const CaseTypes = sqliteTable('CaseTypes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  user_id: integer('user_id').references(() => Users.id, { onDelete: 'cascade' }),
});

export const Courts = sqliteTable('Courts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  user_id: integer('user_id').references(() => Users.id, { onDelete: 'cascade' }),
});

export const Districts = sqliteTable('Districts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  state: text('state'),
  user_id: integer('user_id').references(() => Users.id, { onDelete: 'cascade' }),
});

export const PoliceStations = sqliteTable('PoliceStations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  district_id: integer('district_id').references(() => Districts.id, { onDelete: 'set null' }),
  user_id: integer('user_id').references(() => Users.id, { onDelete: 'cascade' }),
});

export const Cases = sqliteTable('Cases', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  uniqueId: text('uniqueId').unique().notNull(),
  user_id: integer('user_id').references(() => Users.id, { onDelete: 'cascade' }),

  CaseTitle: text('CaseTitle'),
  ClientName: text('ClientName'),
  OnBehalfOf: text('OnBehalfOf'),
  CNRNumber: text('CNRNumber'),
  case_number: text('case_number'),
  case_year: integer('case_year'),
  session_trial_number: text('session_trial_number'),

  court_id: integer('court_id'),
  court_name: text('court_name'),
  case_type_id: integer('case_type_id'),
  case_type_name: text('case_type_name'),

  dateFiled: text('dateFiled'),
  NextDate: text('NextDate'),
  PreviousDate: text('PreviousDate'),
  StatuteOfLimitations: text('StatuteOfLimitations'),

  crime_number: text('crime_number'),
  crime_year: integer('crime_year'),
  police_station_id: integer('police_station_id').references(() => PoliceStations.id, { onDelete: 'set null' }),
  Undersection: text('Undersection'),

  FirstParty: text('FirstParty'),
  OppositeParty: text('OppositeParty'),
  Accussed: text('Accussed'),
  ClientContactNumber: text('ClientContactNumber'),

  JudgeName: text('JudgeName'),
  OpposingCounsel: text('OpposingCounsel'),
  OppositeAdvocate: text('OppositeAdvocate'),
  OppAdvocateContactNumber: text('OppAdvocateContactNumber'),

  CaseStatus: text('CaseStatus'),
  Priority: text('Priority'),

  CaseDescription: text('CaseDescription'),
  CaseNotes: text('CaseNotes'),

  created_at: text('created_at').notNull().default(sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`),
  updated_at: text('updated_at').notNull().default(sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`),
}, (table) => ({
  userIdIdx: index('idx_cases_user_id').on(table.user_id),
  nextDateIdx: index('idx_cases_next_date').on(table.NextDate),
  caseStatusIdx: index('idx_cases_case_status').on(table.CaseStatus),
  updatedAtIdx: index('idx_cases_updated_at').on(table.updated_at),
}));

export const CaseDocuments = sqliteTable('CaseDocuments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  case_id: integer('case_id').notNull().references(() => Cases.id, { onDelete: 'cascade' }),
  stored_filename: text('stored_filename').notNull(),
  original_display_name: text('original_display_name').notNull(),
  file_type: text('file_type'),
  file_size: integer('file_size'),
  created_at: text('created_at').notNull().default(sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`),
  user_id: integer('user_id').references(() => Users.id, { onDelete: 'set null' }),
}, (table) => ({
  caseIdIdx: index('idx_casedocuments_case_id').on(table.case_id),
}));

export const CaseTimeline = sqliteTable('CaseTimeline', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  case_id: integer('case_id').notNull().references(() => Cases.id, { onDelete: 'cascade' }),
  notes: text('notes'),
  hearing_date: text('hearing_date').notNull(),
  created_at: text('created_at').notNull().default(sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`),
  updated_at: text('updated_at').notNull().default(sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`),
}, (table) => ({
  caseIdIdx: index('idx_casetimeline_case_id').on(table.case_id),
}));

export const LawyerProfiles = sqliteTable('LawyerProfiles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id').notNull().references(() => Users.id, { onDelete: 'cascade' }),
  name: text('name'),
  avatarUrl: text('avatarUrl'),
  designation: text('designation'),
  practiceAreas: text('practiceAreas'),
  aboutMe: text('aboutMe'),
  contactInfo: text('contactInfo'),
  languages: text('languages'),
  stats: text('stats'),
  recentActivity: text('recentActivity'),
});

export const UserInformation = sqliteTable('UserInformation', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id').notNull().references(() => Users.id, { onDelete: 'cascade' }),
  fullName: text('fullName'),
  phone: text('phone'),
  email: text('email'),
  gender: text('gender'),
  professionalTitle: text('professionalTitle'),
  yearsOfExperience: integer('yearsOfExperience'),
  licenseNumber: text('licenseNumber'),
  location: text('location'),
  practiceAreas: text('practiceAreas'),
  avatarUrl: text('avatarUrl'),
});
