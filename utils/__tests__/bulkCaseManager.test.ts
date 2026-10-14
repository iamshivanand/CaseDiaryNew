// utils/__tests__/bulkCaseManager.test.ts
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import {
  escapeCsvCell,
  parseCsvContent,
  generateCasesCSV,
  generateSampleTemplateCSV,
  shareCsvFile,
  analyzeImportRows,
  executeBulkUpsert,
} from "../bulkCaseManager";
import * as db from "../../DataBase";

jest.mock("expo-file-system", () => ({
  cacheDirectory: "file:///mock-cache/",
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn().mockResolvedValue(""),
  EncodingType: {
    UTF8: "utf8",
  },
}));

jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../DataBase", () => {
  const mockDb = {
    getAllAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    runAsync: jest.fn(),
    withTransactionAsync: jest.fn(async (cb: () => Promise<void>) => await cb()),
  };
  return {
    getDb: jest.fn(async () => mockDb),
  };
});

describe("bulkCaseManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("escapeCsvCell", () => {
    it("should return empty string for null or undefined", () => {
      expect(escapeCsvCell(null)).toBe("");
      expect(escapeCsvCell(undefined)).toBe("");
    });

    it("should return simple strings unchanged", () => {
      expect(escapeCsvCell("Ramesh vs State")).toBe("Ramesh vs State");
    });

    it("should wrap strings with commas, quotes or newlines in quotes", () => {
      expect(escapeCsvCell('State "A", Delhi')).toBe('"State ""A"", Delhi"');
      expect(escapeCsvCell("Line1\nLine2")).toBe('"Line1\nLine2"');
    });
  });

  describe("parseCsvContent", () => {
    it("should parse simple CSV rows", () => {
      const csv = "Name,Age\nJohn,30\nJane,25";
      const rows = parseCsvContent(csv);
      expect(rows).toEqual([
        ["Name", "Age"],
        ["John", "30"],
        ["Jane", "25"],
      ]);
    });

    it("should handle quoted cells with commas and escaped quotes", () => {
      const csv = 'Title,Remarks\n"State vs ""John"", Doe","Bail granted, urgent"';
      const rows = parseCsvContent(csv);
      expect(rows).toEqual([
        ["Title", "Remarks"],
        ['State vs "John", Doe', "Bail granted, urgent"],
      ]);
    });
  });

  describe("generateCasesCSV and generateSampleTemplateCSV", () => {
    it("should generate CSV with UTF-8 BOM and headers", () => {
      const cases = [
        {
          id: 1,
          CNRNumber: "DLHC010012342026",
          CaseTitle: "Ramesh vs Suresh",
          case_number: "CS 101/2026",
          case_type: "Civil",
          court_name: "Court 1",
          ClientName: "Ramesh",
          OppositeParty: "Suresh",
          nextHearing: "2026-09-25",
          stage_name: "Arguments",
          total_fees: 50000,
          fee_paid: 25000,
        },
      ];

      const csv = generateCasesCSV(cases);
      expect(csv.startsWith("\uFEFF")).toBe(true);
      expect(csv).toContain("App_Case_ID,CNR_Number,Case_Title");
      expect(csv).toContain("DLHC010012342026");
      expect(csv).toContain("Ramesh vs Suresh");
    });

    it("should generate a valid sample template CSV", () => {
      const template = generateSampleTemplateCSV();
      expect(template.startsWith("\uFEFF")).toBe(true);
      expect(template).toContain("App_Case_ID,CNR_Number,Case_Title");
      expect(template).toContain("Final Arguments");
    });
  });

  describe("shareCsvFile", () => {
    it("should write file to cache and call sharing", async () => {
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);

      const result = await shareCsvFile("col1,col2\nval1,val2", "cases.csv");
      expect(result).toBe(true);
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        expect.stringContaining("cases.csv"),
        "col1,col2\nval1,val2",
        expect.any(Object)
      );
      expect(Sharing.shareAsync).toHaveBeenCalled();
    });
  });

  describe("analyzeImportRows", () => {
    it("should classify new cases, updates, and errors correctly", async () => {
      const mockDatabase = await db.getDb();
      (mockDatabase.getAllAsync as jest.Mock).mockResolvedValue([
        {
          id: 10,
          CNRNumber: "DLHC010012342026",
          CaseTitle: "Old Title",
          nextHearing: "2026-08-20",
          stage_name: "Pleadings",
        },
      ]);

      const rows = [
        // 1. Existing case with update
        {
          App_Case_ID: "10",
          Case_Title: "Updated Title",
          Next_Hearing_Date: "25-09-2026",
          Stage: "Arguments",
        },
        // 2. Brand new case
        {
          CNR_Number: "NEWCNR123456",
          Case_Title: "Brand New Case vs State",
          Next_Hearing_Date: "30-09-2026",
        },
        // 3. Error case (missing title)
        {
          Next_Hearing_Date: "30-09-2026",
        },
      ];

      const analyzed = await analyzeImportRows(rows, {}, 1);

      expect(analyzed).toHaveLength(3);
      expect(analyzed[0].action).toBe("UPDATE");
      expect(analyzed[0].diffs).toHaveLength(3); // Title, nextHearing, stage
      expect(analyzed[1].action).toBe("NEW");
      expect(analyzed[2].action).toBe("ERROR");
      expect(analyzed[2].statusReason).toBe("Missing Case Title");
    });
  });

  describe("executeBulkUpsert", () => {
    it("should execute inserts and updates atomically and insert timeline entries", async () => {
      const mockDatabase = await db.getDb();
      (mockDatabase.getFirstAsync as jest.Mock).mockResolvedValue({ id: 5 }); // Court
      (mockDatabase.runAsync as jest.Mock).mockResolvedValue({ lastInsertRowId: 101 });

      const analyzedItems: any[] = [
        {
          rowIndex: 1,
          action: "NEW",
          selected: true,
          mappedData: {
            CaseTitle: "New Case",
            nextHearing: "2026-09-25",
            court_name: "Court 1",
          },
        },
        {
          rowIndex: 2,
          action: "UPDATE",
          selected: true,
          existingCase: { id: 10, nextHearing: "2026-08-20" },
          mappedData: {
            CaseTitle: "Updated Case",
            nextHearing: "2026-09-30",
            stage_name: "Final Arguments",
          },
        },
      ];

      const result = await executeBulkUpsert(analyzedItems, 1);

      expect(result.insertedCount).toBe(1);
      expect(result.updatedCount).toBe(1);
      expect(result.errorCount).toBe(0);
      expect(mockDatabase.runAsync).toHaveBeenCalled();
    });
  });
});
