import { CaseDataScreen } from "../Types/appTypes";
import { CaseWithDetails } from "../DataBase";
import { formatDate } from "./commonFunctions";

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
    status: dbCase.CaseStatus || 'Pending',
    nextHearing: dbCase.NextDate ? formatDate(dbCase.NextDate) : 'N/A',
    lastUpdate: dbCase.updated_at ? formatDate(dbCase.updated_at) : 'N/A',
    previousHearing: dbCase.PreviousDate ? formatDate(dbCase.PreviousDate) : 'N/A',
    priority: dbCase.Priority || 'Low',
  };
};
