import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatDate } from "./commonFunctions";

export interface CauseListFieldDefinition {
  id: string;
  label: string;
  defaultSelected: boolean;
  baseWidthPercent: number;
  getValue: (c: any) => string;
}

export interface SortConfig {
  field: string;
  direction: "asc" | "desc";
}

export const CAUSE_LIST_STORAGE_KEY = "@cause_list_selected_fields";
export const CAUSE_LIST_SORT_KEY = "@cause_list_sort_config";

export const AVAILABLE_CAUSE_LIST_FIELDS: CauseListFieldDefinition[] = [
  {
    id: "CaseTitle",
    label: "Case Title",
    defaultSelected: true,
    baseWidthPercent: 25,
    getValue: (c: any) => c.CaseTitle || "No Title",
  },
  {
    id: "case_number",
    label: "Case Number",
    defaultSelected: true,
    baseWidthPercent: 12,
    getValue: (c: any) => {
      if (c.case_number && c.case_year) {
        return `${c.case_number}/${c.case_year}`;
      }
      return c.case_number || (c.case_year ? `${c.case_year}` : "-");
    },
  },
  {
    id: "ClientName",
    label: "Client Name",
    defaultSelected: true,
    baseWidthPercent: 14,
    getValue: (c: any) => c.ClientName || "-",
  },
  {
    id: "court_name",
    label: "Court",
    defaultSelected: true,
    baseWidthPercent: 15,
    getValue: (c: any) => c.court_name || "-",
  },
  {
    id: "JudgeName",
    label: "Presiding Judge",
    defaultSelected: false,
    baseWidthPercent: 14,
    getValue: (c: any) => c.JudgeName || "-",
  },
  {
    id: "case_stage",
    label: "Stage",
    defaultSelected: true,
    baseWidthPercent: 10,
    getValue: (c: any) => c.case_stage || "-",
  },
  {
    id: "Undersection",
    label: "Section / Act",
    defaultSelected: false,
    baseWidthPercent: 12,
    getValue: (c: any) => c.Undersection || "-",
  },
  {
    id: "CaseStatus",
    label: "Status",
    defaultSelected: false,
    baseWidthPercent: 10,
    getValue: (c: any) => c.CaseStatus || c.Status || "-",
  },
  {
    id: "OppositeParty",
    label: "Opposite Party",
    defaultSelected: false,
    baseWidthPercent: 14,
    getValue: (c: any) => c.OppositeParty || "-",
  },
  {
    id: "OppositeAdvocate",
    label: "Opposite Advocate",
    defaultSelected: false,
    baseWidthPercent: 14,
    getValue: (c: any) => c.OppositeAdvocate || "-",
  },
  {
    id: "PreviousDate",
    label: "Previous Date",
    defaultSelected: true,
    baseWidthPercent: 10,
    getValue: (c: any) => (c.PreviousDate ? formatDate(c.PreviousDate) : "-"),
  },
  {
    id: "CNRNumber",
    label: "CNR Number",
    defaultSelected: false,
    baseWidthPercent: 14,
    getValue: (c: any) => c.CNRNumber || "-",
  },
];

export const AVAILABLE_SORT_OPTIONS: { id: string; label: string }[] = [
  { id: "default", label: "Default Order" },
  { id: "court_name", label: "Court Name" },
  { id: "CaseTitle", label: "Case Title" },
  { id: "case_number", label: "Case Number" },
  { id: "ClientName", label: "Client Name" },
  { id: "case_stage", label: "Stage of Case" },
  { id: "JudgeName", label: "Judge Name" },
  { id: "PreviousDate", label: "Previous Date" },
  { id: "CaseStatus", label: "Status" },
];

export const DEFAULT_SORT_CONFIG: SortConfig = {
  field: "default",
  direction: "asc",
};

export const DEFAULT_SELECTED_FIELD_IDS = AVAILABLE_CAUSE_LIST_FIELDS
  .filter((f) => f.defaultSelected)
  .map((f) => f.id);

/**
 * Retrieves the stored field selection from AsyncStorage or returns defaults.
 */
export const getCauseListSelectedFields = async (): Promise<string[]> => {
  try {
    const raw = await AsyncStorage.getItem(CAUSE_LIST_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validIds = new Set(AVAILABLE_CAUSE_LIST_FIELDS.map((f) => f.id));
        const filtered = parsed.filter((id) => validIds.has(id));
        if (filtered.length > 0) {
          return filtered;
        }
      }
    }
  } catch (error) {
    console.error("Error reading cause list fields preference:", error);
  }
  return [...DEFAULT_SELECTED_FIELD_IDS];
};

/**
 * Saves user's field selection to AsyncStorage.
 */
export const saveCauseListSelectedFields = async (
  fieldIds: string[]
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      CAUSE_LIST_STORAGE_KEY,
      JSON.stringify(fieldIds)
    );
  } catch (error) {
    console.error("Error saving cause list fields preference:", error);
  }
};

/**
 * Retrieves the stored sort configuration or returns defaults.
 */
export const getCauseListSortConfig = async (): Promise<SortConfig> => {
  try {
    const raw = await AsyncStorage.getItem(CAUSE_LIST_SORT_KEY);
    if (raw) {
      const parsed: SortConfig = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed.field === "string" &&
        (parsed.direction === "asc" || parsed.direction === "desc")
      ) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Error reading cause list sort preference:", error);
  }
  return { ...DEFAULT_SORT_CONFIG };
};

/**
 * Saves user's sort configuration to AsyncStorage.
 */
export const saveCauseListSortConfig = async (
  sortConfig: SortConfig
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      CAUSE_LIST_SORT_KEY,
      JSON.stringify(sortConfig)
    );
  } catch (error) {
    console.error("Error saving cause list sort preference:", error);
  }
};

/**
 * Sorts cases array based on chosen field and direction.
 */
export const sortCasesForCauseList = (
  cases: any[],
  sortField?: string,
  sortDirection: "asc" | "desc" = "asc"
): any[] => {
  if (!cases || cases.length <= 1 || !sortField || sortField === "default") {
    return [...cases];
  }

  const sorted = [...cases].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === "CaseStatus") {
      valA = a.CaseStatus || a.Status || "";
      valB = b.CaseStatus || b.Status || "";
    }

    if (valA === undefined || valA === null) valA = "";
    if (valB === undefined || valB === null) valB = "";

    // Check if numeric comparison works
    const numA = Number(valA);
    const numB = Number(valB);
    let cmp = 0;
    if (!isNaN(numA) && !isNaN(numB) && valA !== "" && valB !== "") {
      cmp = numA - numB;
    } else {
      cmp = String(valA).localeCompare(String(valB), undefined, {
        numeric: true,
        sensitivity: "base",
      });
    }

    return sortDirection === "desc" ? -cmp : cmp;
  });

  return sorted;
};
