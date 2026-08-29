// utils/bulkCaseManager.ts
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { getDb } from "../DataBase";
import { formatDate, normalizeDateToYYYYMMDD } from "./commonFunctions";

export interface AnalyzedCaseItem {
  rowIndex: number;
  action: "NEW" | "UPDATE" | "UNCHANGED" | "ERROR";
  statusReason?: string;
  mappedData: Record<string, any>;
  existingCase?: any;
  diffs?: Array<{
    field: string;
    label: string;
    oldValue: any;
    newValue: any;
  }>;
  selected: boolean;
}

export interface BulkUpsertResult {
  insertedCount: number;
  updatedCount: number;
  unchangedCount: number;
  errorCount: number;
  errors: Array<{ rowIndex: number; error: string }>;
}

export const CSV_COLUMNS = [
  { key: "App_Case_ID", label: "App Case ID (Do Not Change)", header: "App_Case_ID" },
  { key: "CNR_Number", label: "CNR Number", header: "CNR_Number" },
  { key: "Case_Title", label: "Case Title *", header: "Case_Title" },
  { key: "Case_Number", label: "Case Number", header: "Case_Number" },
  { key: "Case_Type", label: "Case Type", header: "Case_Type" },
  { key: "Court_Name", label: "Court Name", header: "Court_Name" },
  { key: "Client_Name", label: "Client / Petitioner", header: "Client_Name" },
  { key: "Opposite_Party", label: "Opposite Party / Respondent", header: "Opposite_Party" },
  { key: "Next_Hearing_Date", label: "Next Hearing Date (DD-MM-YYYY)", header: "Next_Hearing_Date" },
  { key: "Previous_Hearing_Date", label: "Previous Hearing Date (DD-MM-YYYY)", header: "Previous_Hearing_Date" },
  { key: "Stage", label: "Stage / Purpose of Hearing", header: "Stage" },
  { key: "Fee_Total", label: "Total Fee Agreed", header: "Fee_Total" },
  { key: "Fee_Paid", label: "Total Fee Paid", header: "Fee_Paid" },
  { key: "Notes", label: "Notes / Remarks", header: "Notes" },
];

/**
 * Escapes a cell value for RFC 4180 CSV compliance
 */
export function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Parses an RFC 4180 CSV string into an array of row arrays
 */
export function parseCsvContent(content: string): string[][] {
  const cleanContent = content.replace(/^\uFEFF/, ""); // Remove UTF-8 BOM if present
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < cleanContent.length; i++) {
    const char = cleanContent[i];
    const nextChar = cleanContent[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentCell += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentCell.trim());
        currentCell = "";
      } else if (char === "\r") {
        if (nextChar === "\n") {
          i++; // Skip \n
        }
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c !== "")) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = "";
      } else if (char === "\n") {
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c !== "")) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = "";
      } else {
        currentCell += char;
      }
    }
  }

  if (currentCell !== "" || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c !== "")) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Generates an RFC-4180 compliant CSV string from an array of cases
 */
export function generateCasesCSV(cases: any[]): string {
  const headers = CSV_COLUMNS.map((c) => c.header).join(",");
  const lines: string[] = [headers];

  for (const c of cases) {
    const row = [
      escapeCsvCell(c.id || ""),
      escapeCsvCell(c.CNRNumber || ""),
      escapeCsvCell(c.CaseTitle || ""),
      escapeCsvCell(c.case_number || ""),
      escapeCsvCell(c.case_type || ""),
      escapeCsvCell(c.court_name || ""),
      escapeCsvCell(c.ClientName || c.FirstParty || ""),
      escapeCsvCell(c.OppositeParty || ""),
      escapeCsvCell(c.nextHearing ? formatDate(c.nextHearing) : ""),
      escapeCsvCell(c.previousHearing ? formatDate(c.previousHearing) : ""),
      escapeCsvCell(c.stage_name || c.stage || ""),
      escapeCsvCell(c.total_fees || c.totalFee || 0),
      escapeCsvCell(c.fee_paid || c.feePaid || 0),
      escapeCsvCell(c.CaseNotes || c.notes || ""),
    ];
    lines.push(row.join(","));
  }

  // Prepend UTF-8 BOM so Microsoft Excel opens Unicode text properly
  return "\uFEFF" + lines.join("\r\n");
}

/**
 * Generates a ready-to-use Sample CSV Template with instructions and example rows
 */
export function generateSampleTemplateCSV(): string {
  const headers = CSV_COLUMNS.map((c) => c.header).join(",");
  const sampleRows = [
    [
      "", // App_Case_ID is blank for new cases
      "DLHC010012342026",
      "Ramesh Kumar vs State of Delhi",
      "CRL.M.C. 102/2026",
      "Criminal",
      "Delhi High Court - Court 12",
      "Ramesh Kumar",
      "State of NCT Delhi",
      "25-09-2026",
      "10-08-2026",
      "Final Arguments",
      "50000",
      "25000",
      "Bail granted. Next date for arguments on charge.",
    ].map(escapeCsvCell).join(","),
    [
      "",
      "MHAU020056782026",
      "Sharma Enterprises vs ABC Logistics Ltd",
      "Comm. Suit 45/2026",
      "Civil",
      "City Civil Court Bombay",
      "Sharma Enterprises",
      "ABC Logistics Ltd",
      "15-10-2026",
      "12-07-2026",
      "Evidence / Cross Examination",
      "75000",
      "50000",
      "Plaintiff witness examination pending.",
    ].map(escapeCsvCell).join(","),
  ];

  return "\uFEFF" + [headers, ...sampleRows].join("\r\n");
}

/**
 * Saves CSV content to cache and opens system share dialog
 */
export async function shareCsvFile(
  content: string,
  fileName: string = "Advocase_Cases_Export.csv"
): Promise<boolean> {
  try {
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileUri = `${FileSystem.cacheDirectory}${cleanFileName}`;
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error("Sharing is not available on this device.");
    }

    await Sharing.shareAsync(fileUri, {
      mimeType: "text/csv",
      dialogTitle: "Export Case Data (CSV / Excel)",
      UTI: "public.comma-separated-values-text",
    });
    return true;
  } catch (err) {
    console.error("Error sharing CSV file:", err);
    throw err;
  }
}

/**
 * Performs dry-run analysis of imported rows against the SQLite database
 */
export async function analyzeImportRows(
  rows: Record<string, any>[],
  mappings: Record<string, string>,
  userId?: number | null
): Promise<AnalyzedCaseItem[]> {
  const db = await getDb();
  const analyzed: AnalyzedCaseItem[] = [];

  // Fetch all existing cases for user
  const existingCases = await db.getAllAsync<any>(
    "SELECT * FROM Cases WHERE user_id IS NULL OR user_id = ?",
    [userId ?? null]
  );

  const idMap = new Map<number, any>();
  const cnrMap = new Map<string, any>();
  const caseNumMap = new Map<string, any>();

  for (const ec of existingCases) {
    if (ec.id) idMap.set(ec.id, ec);
    if (ec.CNRNumber && ec.CNRNumber.trim() !== "") {
      cnrMap.set(ec.CNRNumber.trim().toUpperCase(), ec);
    }
    if (ec.case_number && ec.case_number.trim() !== "") {
      caseNumMap.set(ec.case_number.trim().toUpperCase(), ec);
    }
  }

  for (let i = 0; i < rows.length; i++) {
    const rawRow = rows[i];
    const mapped: Record<string, any> = {};

    // Apply mappings
    for (const targetKey of Object.keys(mappings)) {
      const sourceCol = mappings[targetKey];
      if (sourceCol && sourceCol !== "none" && rawRow[sourceCol] !== undefined) {
        mapped[targetKey] = String(rawRow[sourceCol]).trim();
      }
    }

    // Direct header fallbacks
    if (!mapped.App_Case_ID && rawRow.App_Case_ID) mapped.App_Case_ID = rawRow.App_Case_ID;
    if (!mapped.CaseTitle && rawRow.Case_Title) mapped.CaseTitle = rawRow.Case_Title;
    if (!mapped.CNRNumber && rawRow.CNR_Number) mapped.CNRNumber = rawRow.CNR_Number;
    if (!mapped.case_number && rawRow.Case_Number) mapped.case_number = rawRow.Case_Number;
    if (!mapped.court_name && rawRow.Court_Name) mapped.court_name = rawRow.Court_Name;
    if (!mapped.case_type && rawRow.Case_Type) mapped.case_type = rawRow.Case_Type;
    if (!mapped.ClientName && rawRow.Client_Name) mapped.ClientName = rawRow.Client_Name;
    if (!mapped.OppositeParty && rawRow.Opposite_Party) mapped.OppositeParty = rawRow.Opposite_Party;
    if (!mapped.nextHearing && rawRow.Next_Hearing_Date) mapped.nextHearing = rawRow.Next_Hearing_Date;
    if (!mapped.previousHearing && rawRow.Previous_Hearing_Date) mapped.previousHearing = rawRow.Previous_Hearing_Date;
    if (!mapped.stage_name && rawRow.Stage) mapped.stage_name = rawRow.Stage;
    if (!mapped.total_fees && rawRow.Fee_Total) mapped.total_fees = rawRow.Fee_Total;
    if (!mapped.fee_paid && rawRow.Fee_Paid) mapped.fee_paid = rawRow.Fee_Paid;
    if (!mapped.CaseNotes && rawRow.Notes) mapped.CaseNotes = rawRow.Notes;

    // Validate required fields
    if (!mapped.CaseTitle || mapped.CaseTitle.trim() === "") {
      analyzed.push({
        rowIndex: i + 1,
        action: "ERROR",
        statusReason: "Missing Case Title",
        mappedData: mapped,
        selected: false,
      });
      continue;
    }

    // Normalize Dates
    if (mapped.nextHearing) {
      const normalized = normalizeDateToYYYYMMDD(mapped.nextHearing);
      if (!normalized && mapped.nextHearing.trim() !== "") {
        analyzed.push({
          rowIndex: i + 1,
          action: "ERROR",
          statusReason: `Invalid Next Hearing Date format: "${mapped.nextHearing}". Use DD-MM-YYYY.`,
          mappedData: mapped,
          selected: false,
        });
        continue;
      }
      mapped.nextHearing = normalized;
    }

    if (mapped.previousHearing) {
      const normalized = normalizeDateToYYYYMMDD(mapped.previousHearing);
      mapped.previousHearing = normalized;
    }

    // Find existing case
    let existing: any = null;
    const rawId = mapped.App_Case_ID ? parseInt(String(mapped.App_Case_ID), 10) : null;
    if (rawId && idMap.has(rawId)) {
      existing = idMap.get(rawId);
    } else if (mapped.CNRNumber && cnrMap.has(mapped.CNRNumber.trim().toUpperCase())) {
      existing = cnrMap.get(mapped.CNRNumber.trim().toUpperCase());
    } else if (mapped.case_number && caseNumMap.has(mapped.case_number.trim().toUpperCase())) {
      existing = caseNumMap.get(mapped.case_number.trim().toUpperCase());
    }

    if (!existing) {
      analyzed.push({
        rowIndex: i + 1,
        action: "NEW",
        statusReason: "New case to be created",
        mappedData: mapped,
        selected: true,
      });
    } else {
      // Compare fields to detect diffs
      const diffs: AnalyzedCaseItem["diffs"] = [];

      const checkField = (key: string, label: string, oldVal: any, newVal: any) => {
        const oStr = (oldVal ?? "").toString().trim();
        const nStr = (newVal ?? "").toString().trim();
        if (nStr !== "" && oStr !== nStr) {
          diffs.push({ field: key, label, oldValue: oldVal || "None", newValue: newVal });
        }
      };

      checkField("CaseTitle", "Title", existing.CaseTitle, mapped.CaseTitle);
      checkField("nextHearing", "Next Hearing", existing.nextHearing, mapped.nextHearing);
      checkField("previousHearing", "Previous Hearing", existing.previousHearing, mapped.previousHearing);
      checkField("stage_name", "Stage", existing.stage_name, mapped.stage_name);
      checkField("court_name", "Court", existing.court_name, mapped.court_name);
      checkField("ClientName", "Client", existing.ClientName, mapped.ClientName);
      checkField("OppositeParty", "Opposite Party", existing.OppositeParty, mapped.OppositeParty);
      checkField("total_fees", "Total Fee", existing.total_fees, mapped.total_fees);
      checkField("fee_paid", "Fee Paid", existing.fee_paid, mapped.fee_paid);

      if (diffs.length > 0) {
        analyzed.push({
          rowIndex: i + 1,
          action: "UPDATE",
          statusReason: `${diffs.length} field(s) will be updated`,
          mappedData: mapped,
          existingCase: existing,
          diffs,
          selected: true,
        });
      } else {
        analyzed.push({
          rowIndex: i + 1,
          action: "UNCHANGED",
          statusReason: "Identical to existing database record",
          mappedData: mapped,
          existingCase: existing,
          selected: false,
        });
      }
    }
  }

  return analyzed;
}

/**
 * Executes the bulk upsert inside a single SQLite transaction
 */
export async function executeBulkUpsert(
  analyzedItems: AnalyzedCaseItem[],
  userId?: number | null,
  onProgress?: (current: number, total: number) => void
): Promise<BulkUpsertResult> {
  const db = await getDb();
  const selectedItems = analyzedItems.filter((item) => item.selected && item.action !== "ERROR");

  let insertedCount = 0;
  let updatedCount = 0;
  let unchangedCount = analyzedItems.filter((i) => i.action === "UNCHANGED").length;
  const errors: Array<{ rowIndex: number; error: string }> = [];

  const total = selectedItems.length;

  await db.withTransactionAsync(async () => {
    for (let i = 0; i < selectedItems.length; i++) {
      const item = selectedItems[i];
      const data = item.mappedData;

      try {
        if (item.action === "NEW") {
          // Resolve Court ID
          let courtId: number | null = null;
          if (data.court_name && data.court_name.trim() !== "") {
            const courtRes = await db.getFirstAsync<{ id: number }>(
              "SELECT id FROM Courts WHERE LOWER(name) = LOWER(?) AND (user_id IS NULL OR user_id = ?)",
              [data.court_name.trim(), userId ?? null]
            );
            if (courtRes) {
              courtId = courtRes.id;
            } else {
              const insertCourt = await db.runAsync(
                "INSERT INTO Courts (name, user_id) VALUES (?, ?)",
                [data.court_name.trim(), userId ?? null]
              );
              courtId = insertCourt.lastInsertRowId;
            }
          }

          // Insert new case
          const insertRes = await db.runAsync(
            `INSERT INTO Cases (
              CaseTitle, ClientName, OppositeParty, CNRNumber, case_number,
              court_id, court_name, case_type, nextHearing, previousHearing,
              stage_name, total_fees, fee_paid, CaseNotes, user_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              data.CaseTitle,
              data.ClientName || null,
              data.OppositeParty || null,
              data.CNRNumber || null,
              data.case_number || null,
              courtId,
              data.court_name || null,
              data.case_type || null,
              data.nextHearing || null,
              data.previousHearing || null,
              data.stage_name || null,
              parseFloat(data.total_fees) || 0,
              parseFloat(data.fee_paid) || 0,
              data.CaseNotes || null,
              userId ?? null,
            ]
          );

          const newCaseId = insertRes.lastInsertRowId;

          // Auto-insert initial timeline entry if hearing date exists
          if (data.nextHearing) {
            await db.runAsync(
              `INSERT INTO CaseTimeline (case_id, hearing_date, notes, event_type)
               VALUES (?, ?, ?, 'hearing_proceeding')`,
              [newCaseId, data.nextHearing, data.CaseNotes || "Initial case hearing scheduled via bulk import."]
            );
          }

          insertedCount++;
        } else if (item.action === "UPDATE" && item.existingCase) {
          const caseId = item.existingCase.id;

          // Build dynamic update query
          const updateFields: string[] = [];
          const updateParams: any[] = [];

          if (data.CaseTitle) {
            updateFields.push("CaseTitle = ?");
            updateParams.push(data.CaseTitle);
          }
          if (data.CNRNumber) {
            updateFields.push("CNRNumber = ?");
            updateParams.push(data.CNRNumber);
          }
          if (data.case_number) {
            updateFields.push("case_number = ?");
            updateParams.push(data.case_number);
          }
          if (data.court_name) {
            updateFields.push("court_name = ?");
            updateParams.push(data.court_name);
          }
          if (data.case_type) {
            updateFields.push("case_type = ?");
            updateParams.push(data.case_type);
          }
          if (data.ClientName) {
            updateFields.push("ClientName = ?");
            updateParams.push(data.ClientName);
          }
          if (data.OppositeParty) {
            updateFields.push("OppositeParty = ?");
            updateParams.push(data.OppositeParty);
          }
          if (data.nextHearing) {
            updateFields.push("nextHearing = ?");
            updateParams.push(data.nextHearing);
          }
          if (data.previousHearing) {
            updateFields.push("previousHearing = ?");
            updateParams.push(data.previousHearing);
          }
          if (data.stage_name) {
            updateFields.push("stage_name = ?");
            updateParams.push(data.stage_name);
          }
          if (data.total_fees !== undefined && data.total_fees !== "") {
            updateFields.push("total_fees = ?");
            updateParams.push(parseFloat(data.total_fees) || 0);
          }
          if (data.fee_paid !== undefined && data.fee_paid !== "") {
            updateFields.push("fee_paid = ?");
            updateParams.push(parseFloat(data.fee_paid) || 0);
          }
          if (data.CaseNotes) {
            updateFields.push("CaseNotes = ?");
            updateParams.push(data.CaseNotes);
          }

          if (updateFields.length > 0) {
            updateFields.push("updated_at = (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))");
            updateParams.push(caseId);

            await db.runAsync(
              `UPDATE Cases SET ${updateFields.join(", ")} WHERE id = ?`,
              updateParams
            );

            // If next hearing date was changed, auto-record in Timeline
            if (
              data.nextHearing &&
              data.nextHearing !== item.existingCase.nextHearing
            ) {
              const proceedNote = data.stage_name
                ? `Adjourned to ${formatDate(data.nextHearing)} for ${data.stage_name}. (Bulk updated)`
                : `Next hearing updated to ${formatDate(data.nextHearing)} via bulk import.`;

              await db.runAsync(
                `INSERT INTO CaseTimeline (case_id, hearing_date, notes, event_type)
                 VALUES (?, ?, ?, 'hearing_proceeding')`,
                [caseId, data.nextHearing, proceedNote]
              );
            }

            updatedCount++;
          }
        }
      } catch (rowError: any) {
        console.error(`Error processing row ${item.rowIndex}:`, rowError);
        errors.push({ rowIndex: item.rowIndex, error: rowError.message || "Failed to process row" });
      }

      if (onProgress) {
        onProgress(i + 1, total);
      }
    }
  });

  return {
    insertedCount,
    updatedCount,
    unchangedCount,
    errorCount: errors.length + analyzedItems.filter((i) => i.action === "ERROR").length,
    errors,
  };
}
