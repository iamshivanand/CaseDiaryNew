import * as SQLite from "expo-sqlite";

import { __TEST_ONLY_resetDbInstance } from "../connection";
import * as dbFunctions from "../index";
import { getDb, addCase, updateCase, getFinancialSummary } from "../index";

const mockSQLite = SQLite as any;

beforeEach(async () => {
  __TEST_ONLY_resetDbInstance();
  mockSQLite.__resetAllMockDatabases();
});

describe("Financial Totals & Fee Structure CRUD Tests", () => {
  const userId = 101;

  it("should return zeros for financial summary when no cases exist", async () => {
    const summary = await getFinancialSummary(userId);
    expect(summary).toEqual({
      totalCollected: 0,
      totalRemaining: 0,
      totalAgreed: 0,
    });
  });

  it("should correctly calculate financial summary after adding multiple cases with fees", async () => {
    // Case 1: Total Agreed 50,000, Paid 20,000 -> Remaining 30,000
    await addCase({
      uniqueId: "fin-case-1",
      user_id: userId,
      CaseTitle: "Civil Suit A",
      total_fee: 50000,
      fee_paid: 20000,
    });

    // Case 2: Total Agreed 30,000, Paid 30,000 -> Remaining 0
    await addCase({
      uniqueId: "fin-case-2",
      user_id: userId,
      CaseTitle: "Criminal Appeal B",
      total_fee: 30000,
      fee_paid: 30000,
    });

    // Case 3: Total Agreed 20,000, Paid 5,000 -> Remaining 15,000
    await addCase({
      uniqueId: "fin-case-3",
      user_id: userId,
      CaseTitle: "Bail Application C",
      total_fee: 20000,
      fee_paid: 5000,
    });

    const summary = await getFinancialSummary(userId);
    expect(summary.totalAgreed).toBe(100000);
    expect(summary.totalCollected).toBe(55000);
    expect(summary.totalRemaining).toBe(45000);
  });

  it("should dynamically update financial summary when fee payments are recorded (fee_paid update)", async () => {
    const caseId = await addCase({
      uniqueId: "fin-case-4",
      user_id: userId,
      CaseTitle: "Retainer Case D",
      total_fee: 100000,
      fee_paid: 25000,
    });

    let summary = await getFinancialSummary(userId);
    expect(summary.totalAgreed).toBe(100000);
    expect(summary.totalCollected).toBe(25000);
    expect(summary.totalRemaining).toBe(75000);

    // Record an additional payment of 50,000
    if (caseId) {
      await updateCase(caseId, { fee_paid: 75000 });
    }

    summary = await getFinancialSummary(userId);
    expect(summary.totalAgreed).toBe(100000);
    expect(summary.totalCollected).toBe(75000);
    expect(summary.totalRemaining).toBe(25000);
  });

  it("should handle clearing full fee balance on a case", async () => {
    const caseId = await addCase({
      uniqueId: "fin-case-5",
      user_id: userId,
      CaseTitle: "Arbitration E",
      total_fee: 60000,
      fee_paid: 10000,
    });

    // Pay full remaining balance
    if (caseId) {
      await updateCase(caseId, { fee_paid: 60000 });
    }

    const summary = await getFinancialSummary(userId);
    expect(summary.totalCollected).toBe(60000);
    expect(summary.totalRemaining).toBe(0);
  });

  it("should handle total_fee updates when fee structure is renegotiated or revised", async () => {
    const caseId = await addCase({
      uniqueId: "fin-case-6",
      user_id: userId,
      CaseTitle: "High Court Writ F",
      total_fee: 40000,
      fee_paid: 15000,
    });

    // Fee structure updated to 70,000 total
    if (caseId) {
      await updateCase(caseId, { total_fee: 70000 });
    }

    const summary = await getFinancialSummary(userId);
    expect(summary.totalAgreed).toBe(70000);
    expect(summary.totalCollected).toBe(15000);
    expect(summary.totalRemaining).toBe(55000);
  });
});
