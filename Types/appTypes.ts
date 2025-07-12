// Types/appTypes.ts

export interface CaseType { // For lookups like Case Type dropdown
  id: number;
  name: string;
}

export interface Court { // For lookups like Court dropdown
  id: number;
  name: string;
}

// This is the main Case data structure, based on DataBase/schema.ts Case interface
// and includes additional fields requested for the UI.
export interface CaseData {
  id?: number | string; // Primary key from the database, can be string if UUID from CaseDetails
  uniqueId: string; // Stable unique identifier from schema.ts or CaseDetails

  // Case Details from schema.ts or common requirements
  CaseTitle?: string | null; // This was added as a primary display title
  CNRNumber?: string | null;
  court_id?: number | null; // FK to Courts table
  dateFiled?: string | null; // ISO8601 "YYYY-MM-DD" - Mapped from CaseDetails.dateFiled
  case_type_id?: number | null; // FK to CaseTypes table
  case_number?: string | null; // From schema.ts, can be different from CaseTitle
  case_year?: number | null;
  crime_number?: string | null;
  crime_year?: number | null;

  // Parties & Representation from schema.ts or common requirements
  OnBehalfOf?: string | null; // Can be used for Client Name if CaseData.ClientName isn't set
  ClientName?: string | null; // Explicit Client Name field for the form
  FirstParty?: string | null;
  OppositeParty?: string | null;
  ClientContactNumber?: string | null;
  Accussed?: string | null;

  // Legal Details from schema.ts or common requirements
  Undersection?: string | null;
  police_station_id?: number | null; // FK to PoliceStations

  // Opposition Details from schema.ts or common requirements
  OppositeAdvocate?: string | null; // Can be used for OpposingCounsel
  OpposingCounsel?: string | null; // Explicit field for the form
  OppAdvocateContactNumber?: string | null;

  // Status and Dates from schema.ts or common requirements
  CaseStatus?: string | null; // From schema.ts, general status string
  Status?: string | null; // Specifically for the dropdown (Open, In Progress, Closed etc.)
  Priority?: string | null; // Requested dropdown: High, Medium, Low
  PreviousDate?: string | null; // ISO8601 "YYYY-MM-DD"
  NextDate?: string | null; // ISO8601 "YYYY-MM-DD" (Can be "Hearing Date")
  FiledDate?: string | null; // Explicit field for form, maps to dateFiled
  HearingDate?: string | null; // Explicit field for form, maps to NextDate
  StatuteOfLimitations?: string | null; // Requested Date Picker
  ClosedDate?: string | null; // Requested Date Picker, relevant if Status is "Closed"

  // Description / Notes
  CaseDescription?: string | null; // Requested Multiline TextArea
  CaseNotes?: string | null; // Requested Multiline TextArea, general notes

  // Timestamps (from schema.ts, if available and needed)
  created_at?: string; // ISO8601
  updated_at?: string; // ISO8601
  user_id?: number | null; // FK to Users

  // Fields for denormalized data / display purposes (populated from lookups or joins)
  court_name?: string | null; // Mapped from CaseDetails.court
  case_type_name?: string | null; // Mapped from CaseDetails.caseType

  // To hold actual Document and TimelineEvent arrays for EditCaseScreen
  documents?: Document[];
  timelineEvents?: TimelineEvent[];
}


export interface Document {
  id: number; // from CaseDocument id
  case_id: number; // from CaseDocument case_id
  fileName: string; // from CaseDocument original_display_name
  uploadDate: string; // from CaseDocument created_at (ISO string or pre-formatted)
  fileType?: string | null; // from CaseDocument file_type
  fileSize?: number | null; // from CaseDocument file_size
  uri?: string; // Local URI for new/cached files
  stored_filename?: string; // from CaseDocument stored_filename
}

export interface TimelineEvent {
  id: number | string; // number from DB, string for temporary _clientSideId if 'new'
  case_id?: number;    // Will be set when saving new events to DB
  date: string;        // ISO8601 "YYYY-MM-DD" or full timestamp
  description: string;
  user_id?: number | null; // From TimelineEventRow

  // Client-side flags for managing state before saving
  _clientSideId?: string; // For 'new' items before they have a DB id (e.g., uuidv4())
  _status?: 'new' | 'modified' | 'deleted' | 'synced';
  // 'synced' can be used after successful save to clear _status, or item is just re-fetched
}

// For dropdowns
export interface DropdownOption {
  label: string;
  value: string | number;
}

// Specific dropdown option lists
export const caseStatusOptions: DropdownOption[] = [
  { label: "Select Status...", value: "" },
  { label: "Open", value: "Open" },
  { label: "In Progress", value: "In Progress" },
  { label: "Closed", value: "Closed" },
  { label: "On Hold", value: "On Hold" },
  { label: "Appealed", value: "Appealed" },
];

export const priorityOptions: DropdownOption[] = [
  { label: "Select Priority...", value: "" },
  { label: "High", value: "High" },
  { label: "Medium", value: "Medium" },
  { label: "Low", value: "Low" },
];

// Lookup type options (examples, assuming these would be populated from the database)
export interface CaseTypeOption extends DropdownOption { value: number; }
export interface CourtOption extends DropdownOption { value: number; }

// New CaseData interface for the Cases screen
export interface CaseDataScreen {
  id?: string | number; // Optional: for keys or navigation
  title: string;
  client: string;
  status: "Active" | "Pending" | "Closed";
  nextHearing: string;
  lastUpdate: string;
  previousHearing: string;
}
