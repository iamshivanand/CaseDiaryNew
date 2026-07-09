import { CaseDataScreen } from "../Types/appTypes";
import { CaseWithDetails } from "../DataBase";
import { formatDate } from "./commonFunctions";
import { ParsedTextCase } from "./ecourtsParser";

/**
 * Maps a SQLite database case record (or search result) to the structure expected by UI components.
 * Consolidates the formatting of nextHearing, previousHearing, and lastUpdate dates.
 * 
 * @param dbCase The raw case data object from the database query
 * @returns A UI-ready CaseDataScreen representation
 */
export const mapCaseDbToScreen = (dbCase: Partial<CaseWithDetails> & { id: number }): CaseDataScreen => {
  return {
    id: dbCase.id,
    title: dbCase.CaseTitle || 'No Title',
    client: dbCase.ClientName || 'Unknown Client',
    status: (dbCase.CaseStatus === 'Active' || dbCase.CaseStatus === 'Closed' || dbCase.CaseStatus === 'Pending' ? dbCase.CaseStatus : 'Pending') as 'Active' | 'Pending' | 'Closed',
    nextHearing: dbCase.NextDate ? formatDate(dbCase.NextDate) : 'N/A',
    lastUpdate: dbCase.updated_at ? formatDate(dbCase.updated_at) : 'N/A',
    previousHearing: dbCase.PreviousDate ? formatDate(dbCase.PreviousDate) : 'N/A',
    priority: dbCase.Priority || 'Low',
  };
};

const FIELD_ALIASES: Record<string, string[]> = {
  CNRNumber: ["cino", "cnr", "cnrnumber", "cnr_no", "cnr_number"],
  CaseTitle: ["title", "case_title", "parties", "title_name"],
  ClientName: ["clientname", "client", "client_name", "petparty_name", "petitioner"],
  FirstParty: ["firstparty", "first_party", "petparty_name", "petitioner", "plaintiff"],
  OppositeParty: ["oppositeparty", "opposite_party", "resparty_name", "respondent", "defendant"],
  case_number: ["case_number", "case_no", "caseno", "reg_no", "registration_no", "reg_number"],
  case_year: ["case_year", "year", "reg_year", "registration_year"],
  court_name: ["court_name", "court", "court_no_desg_name", "establishment_name", "forum"],
  case_type_name: ["case_type_name", "case_type", "type_name", "type", "ltype_name"],
  NextDate: ["nextdate", "next_date", "date_next_list", "next_hearing", "hearing_date"],
  PreviousDate: ["previousdate", "previous_date", "date_last_list", "last_date", "prev_date"],
  CaseNotes: ["casenotes", "notes", "note", "remark", "remarks", "comment", "comments"],
  Accussed: ["accussed", "accused", "accused_name", "accused_list"],
  Undersection: ["undersection", "under_section", "section", "sections", "act", "acts"],
  policeStationName: ["policestation", "police_station", "ps", "ps_name", "police_station_name"],
  district: ["district", "district_name", "dist", "district_code"],
  state: ["state", "state_name", "state_code"],
  dateFiled: ["datefiled", "date_filed", "filing_date", "fil_date"],
  JudgeName: ["judgename", "judge", "judge_name", "presiding_judge"],
  OpposingCounsel: ["opposingcounsel", "opposing_counsel", "counsel", "advocate", "opposing_advocate"],
  CaseDescription: ["casedescription", "description", "desc"],
  CaseStatus: ["casestatus", "case_status", "status", "stage_of_case"]
};

function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Fuzzy matches case keys from raw JSON maps to canonical ParsedTextCase fields.
 */
export function fuzzyMapCaseKeys(rawCase: Record<string, any>): ParsedTextCase {
  const result: any = {};
  
  // Normalize incoming keys for fast matching
  const normalizedIncoming: Record<string, any> = {};
  Object.keys(rawCase).forEach(k => {
    normalizedIncoming[normalizeKey(k)] = rawCase[k];
  });

  // Loop through target fields and match aliases
  Object.keys(FIELD_ALIASES).forEach(targetField => {
    // Combine court post and establishment name if both are present
    if (targetField === "court_name") {
      const desg = normalizedIncoming["courtnodesgname"] || normalizedIncoming["court_no_desg_name"];
      const est = normalizedIncoming["establishmentname"] || normalizedIncoming["establishment_name"];
      if (desg && est) {
        result.court_name = `${desg}, ${est}`;
        return;
      }
    }

    const aliases = FIELD_ALIASES[targetField];
    for (const alias of aliases) {
      const normAlias = normalizeKey(alias);
      if (normalizedIncoming[normAlias] !== undefined) {
        result[targetField] = normalizedIncoming[normAlias];
        break;
      }
    }
  });

  // Handle case number combination if registration number/year are present
  if (normalizedIncoming["regno"] && normalizedIncoming["regyear"]) {
    result.case_number = `${normalizedIncoming["regno"]}/${normalizedIncoming["regyear"]}`;
  }

  // Ensure case_year is a string
  if (result.case_year !== undefined && result.case_year !== null) {
    result.case_year = String(result.case_year);
  }
  // Ensure case_number is a string
  if (result.case_number !== undefined && result.case_number !== null) {
    result.case_number = String(result.case_number);
  }

  // Handle default title if missing
  if (!result.CaseTitle) {
    const pet = result.FirstParty || result.ClientName || "";
    const res = result.OppositeParty || "";
    if (pet && res) {
      result.CaseTitle = `${pet} vs. ${res}`;
    } else {
      result.CaseTitle = pet || res || result.case_number || "Imported Case";
    }
  }

  // Handle Accused auto-population for criminal cases if missing
  if (!result.Accussed && result.OppositeParty) {
    const lowerType = (result.case_type_name || "").toLowerCase();
    const lowerPet = (result.FirstParty || "").toLowerCase();
    if (
      lowerType.includes("criminal") ||
      lowerType.includes("trial") ||
      lowerType.includes("bail") ||
      lowerType.includes("state") ||
      lowerPet.includes("state") ||
      lowerPet.includes("govt") ||
      lowerPet.includes("sarkar")
    ) {
      result.Accussed = result.OppositeParty;
    }
  }

  // Default CaseStatus to Active if missing
  if (!result.CaseStatus) {
    result.CaseStatus = "Active";
  }

  // Format dates to YYYY-MM-DD internally for DB safety if they are strings
  const formatToISO = (val: any) => {
    if (!val || typeof val !== "string") return val;
    const trimmed = val.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const parts = trimmed.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      } else if (parts[0].length === 4) {
        const [year, month, day] = parts;
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
    }
    return val;
  };

  if (result.NextDate) result.NextDate = formatToISO(result.NextDate);
  if (result.PreviousDate) result.PreviousDate = formatToISO(result.PreviousDate);
  if (result.dateFiled) result.dateFiled = formatToISO(result.dateFiled);

  return result;
}

/**
 * Compares scanned cases with existing DB cases to find duplicates and changes.
 */
export function checkDuplicateAndDiffCases(
  scannedCases: ParsedTextCase[],
  existingCases: any[]
): ParsedTextCase[] {
  return scannedCases.map(c => {
    let alreadyExists = false;
    let hasUpdates = false;
    let dbCaseId: number | undefined = undefined;
    const changes: Record<string, { oldValue: any; newValue: any }> = {};

    const cleanStr = (s: any) => (s ? s.toString().trim().toLowerCase() : "");

    // Find matching case in DB
    const matchingDbCase = existingCases.find(e => {
      // Match by CNR Number first
      if (c.CNRNumber && e.CNRNumber) {
        const cCNR = cleanStr(c.CNRNumber).replace(/[^a-z0-9]/g, "");
        const eCNR = cleanStr(e.CNRNumber).replace(/[^a-z0-9]/g, "");
        if (cCNR && cCNR === eCNR) return true;
      }
      // Match by Case Number & Court Name fallback
      if (c.case_number && e.case_number && c.court_name && e.court_name) {
        const cNo = cleanStr(c.case_number).replace(/[^a-z0-9]/g, "");
        const eNo = cleanStr(e.case_number).replace(/[^a-z0-9]/g, "");
        const cCourt = cleanStr(c.court_name).replace(/\s+/g, "");
        const eCourt = cleanStr(e.court_name).replace(/\s+/g, "");
        if (cNo && cNo === eNo && cCourt && cCourt === eCourt) return true;
      }
      return false;
    });

    if (matchingDbCase) {
      alreadyExists = true;
      dbCaseId = matchingDbCase.id;

      // Compare fields to detect updates
      const fieldsToCompare: Array<{ key: keyof ParsedTextCase; dbKey: string }> = [
        { key: "NextDate", dbKey: "NextDate" },
        { key: "PreviousDate", dbKey: "PreviousDate" },
        { key: "CaseNotes", dbKey: "CaseNotes" },
        { key: "court_name", dbKey: "court_name" },
        { key: "case_type_name", dbKey: "case_type_name" },
        { key: "Undersection", dbKey: "Undersection" },
        { key: "Accussed", dbKey: "Accussed" },
        { key: "ClientName", dbKey: "ClientName" },
        { key: "CaseStatus", dbKey: "CaseStatus" },
        { key: "JudgeName", dbKey: "JudgeName" },
        { key: "OpposingCounsel", dbKey: "OpposingCounsel" },
        { key: "CaseDescription", dbKey: "CaseDescription" }
      ];

      for (const field of fieldsToCompare) {
        const newValue = c[field.key];
        const oldValue = matchingDbCase[field.dbKey];

        // We only care if the new value is present and different
        if (newValue !== undefined && newValue !== null && newValue.toString().trim() !== "") {
          const cleanNew = cleanStr(newValue);
          const cleanOld = cleanStr(oldValue);

          if (cleanNew !== cleanOld) {
            hasUpdates = true;
            changes[field.dbKey] = {
              oldValue: oldValue || "N/A",
              newValue: newValue
            };
          }
        }
      }
    }

    return {
      ...c,
      alreadyExists,
      hasUpdates,
      dbCaseId,
      changes: Object.keys(changes).length > 0 ? changes : undefined
    };
  });
}
