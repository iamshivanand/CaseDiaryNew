// utils/__tests__/legalNerService.test.ts
import { extractLegalEntities } from "../legalNerService";

describe("legalNerService", () => {
  it("should return empty arrays if input draft is empty", () => {
    const result = extractLegalEntities("");
    expect(result.actsAndSections).toEqual([]);
    expect(result.dates).toEqual([]);
    expect(result.amounts).toEqual([]);
  });

  it("should extract CNR Number and Case Number correctly", () => {
    const text = "IN THE HIGH COURT OF JUDICATURE AT BOMBAY\nCNR: MHAU010012342026\nBail Application No. 402/2026";
    const result = extractLegalEntities(text);
    expect(result.cnrNumber).toBe("MHAU010012342026");
    expect(result.caseNumber).toBe("Bail Application No. 402/2026");
    expect(result.courtName).toBe("IN THE HIGH COURT OF JUDICATURE AT BOMBAY");
  });

  it("should extract Petitioner and Respondent from VERSUS clause", () => {
    const text = "State of Maharashtra VERSUS John Doe\nIN THE HIGH COURT";
    const result = extractLegalEntities(text);
    expect(result.petitioner).toBe("State of Maharashtra");
    expect(result.respondent).toBe("John Doe");
  });

  it("should extract Acts, Sections, Dates, and Amounts", () => {
    const text = `
      Filing Date: 15-08-2026
      Under Section 420 IPC and Section 138 NI Act
      Total Cheque Amount: Rs. 50,000/-
    `;
    const result = extractLegalEntities(text);
    expect(result.actsAndSections).toContain("Section 420 IPC");
    expect(result.actsAndSections).toContain("Section 138 NI Act");
    expect(result.dates).toContain("15-08-2026");
    expect(result.amounts).toContain("Rs. 50,000/-");
  });
});
