import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AVAILABLE_CAUSE_LIST_FIELDS,
  AVAILABLE_SORT_OPTIONS,
  DEFAULT_SELECTED_FIELD_IDS,
  DEFAULT_SORT_CONFIG,
  CAUSE_LIST_STORAGE_KEY,
  CAUSE_LIST_SORT_KEY,
  getCauseListSelectedFields,
  saveCauseListSelectedFields,
  getCauseListSortConfig,
  saveCauseListSortConfig,
  sortCasesForCauseList,
} from "../causeListConfig";

describe("causeListConfig", () => {
  let mockStore: { [key: string]: string } = {};

  beforeEach(() => {
    mockStore = {};
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      return Promise.resolve(mockStore[key] || null);
    });
    (AsyncStorage.setItem as jest.Mock).mockImplementation(
      (key: string, value: string) => {
        mockStore[key] = value;
        return Promise.resolve();
      }
    );
    (AsyncStorage.clear as jest.Mock).mockImplementation(() => {
      mockStore = {};
      return Promise.resolve();
    });
  });

  it("should have all required field definitions with labels and getValue functions", () => {
    expect(AVAILABLE_CAUSE_LIST_FIELDS.length).toBeGreaterThan(5);

    const testCase = {
      CaseTitle: "State vs John",
      case_number: "123",
      case_year: 2024,
      ClientName: "Alice",
      court_name: "High Court",
      JudgeName: "Justice Sharma",
      case_stage: "Evidence",
      Undersection: "Sec 302",
      CaseStatus: "Pending",
      OppositeParty: "Bob",
      OppositeAdvocate: "Adv. Verma",
      PreviousDate: "2024-05-10T00:00:00.000Z",
      CNRNumber: "DLHC010023452024",
    };

    const titleField = AVAILABLE_CAUSE_LIST_FIELDS.find((f) => f.id === "CaseTitle");
    expect(titleField?.getValue(testCase)).toBe("State vs John");

    const numberField = AVAILABLE_CAUSE_LIST_FIELDS.find((f) => f.id === "case_number");
    expect(numberField?.getValue(testCase)).toBe("123/2024");

    const clientField = AVAILABLE_CAUSE_LIST_FIELDS.find((f) => f.id === "ClientName");
    expect(clientField?.getValue(testCase)).toBe("Alice");
  });

  it("should return default field IDs when storage is empty", async () => {
    const fields = await getCauseListSelectedFields();
    expect(fields).toEqual(DEFAULT_SELECTED_FIELD_IDS);
    expect(fields).toContain("CaseTitle");
    expect(fields).toContain("case_number");
    expect(fields).toContain("ClientName");
    expect(fields).toContain("court_name");
  });

  it("should save and retrieve custom field selections", async () => {
    const customFields = ["CaseTitle", "CNRNumber", "JudgeName"];
    await saveCauseListSelectedFields(customFields);

    const stored = await getCauseListSelectedFields();
    expect(stored).toEqual(customFields);
    expect(mockStore[CAUSE_LIST_STORAGE_KEY]).toEqual(JSON.stringify(customFields));
  });

  it("should filter out invalid field IDs from corrupted storage", async () => {
    mockStore[CAUSE_LIST_STORAGE_KEY] = JSON.stringify([
      "CaseTitle",
      "invalid_column_xyz",
      "ClientName",
    ]);

    const stored = await getCauseListSelectedFields();
    expect(stored).toEqual(["CaseTitle", "ClientName"]);
  });

  it("should fallback to defaults if storage has empty array", async () => {
    mockStore[CAUSE_LIST_STORAGE_KEY] = JSON.stringify([]);

    const stored = await getCauseListSelectedFields();
    expect(stored).toEqual(DEFAULT_SELECTED_FIELD_IDS);
  });

  it("should handle sort config storage and retrieval", async () => {
    const defaultSort = await getCauseListSortConfig();
    expect(defaultSort).toEqual(DEFAULT_SORT_CONFIG);

    const customSort = { field: "court_name", direction: "desc" as const };
    await saveCauseListSortConfig(customSort);

    const retrieved = await getCauseListSortConfig();
    expect(retrieved).toEqual(customSort);
    expect(mockStore[CAUSE_LIST_SORT_KEY]).toEqual(JSON.stringify(customSort));
  });

  it("should sort cases correctly in ascending and descending order", () => {
    const testCases = [
      { id: 1, CaseTitle: "Zebra vs State", court_name: "Supreme Court", case_number: "20" },
      { id: 2, CaseTitle: "Alpha vs State", court_name: "District Court", case_number: "5" },
      { id: 3, CaseTitle: "Beta vs State", court_name: "High Court", case_number: "100" },
    ];

    // Default order (no change)
    const defaultSorted = sortCasesForCauseList(testCases, "default", "asc");
    expect(defaultSorted.map((c) => c.id)).toEqual([1, 2, 3]);

    // Sort by CaseTitle ASC
    const titleAsc = sortCasesForCauseList(testCases, "CaseTitle", "asc");
    expect(titleAsc.map((c) => c.CaseTitle)).toEqual([
      "Alpha vs State",
      "Beta vs State",
      "Zebra vs State",
    ]);

    // Sort by CaseTitle DESC
    const titleDesc = sortCasesForCauseList(testCases, "CaseTitle", "desc");
    expect(titleDesc.map((c) => c.CaseTitle)).toEqual([
      "Zebra vs State",
      "Beta vs State",
      "Alpha vs State",
    ]);

    // Sort by court_name ASC
    const courtAsc = sortCasesForCauseList(testCases, "court_name", "asc");
    expect(courtAsc.map((c) => c.court_name)).toEqual([
      "District Court",
      "High Court",
      "Supreme Court",
    ]);

    // Numeric sort by case_number ASC
    const numAsc = sortCasesForCauseList(testCases, "case_number", "asc");
    expect(numAsc.map((c) => c.case_number)).toEqual(["5", "20", "100"]);
  });
});
