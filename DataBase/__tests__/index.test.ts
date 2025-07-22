import * as SQLite from 'expo-sqlite'; // This will be the mock
import * as dbFunctions from '../index'; // Import your database functions
// Import the specific function directly for clarity and to ensure it's resolved
import { getDb, getCaseTypes, addCaseType, updateCaseType, deleteCaseType, addCase, getCaseById, updateCase, deleteCase, uploadCaseDocument, getCaseDocuments, deleteCaseDocument } from '../index';
import { __TEST_ONLY_resetDbInstance } from '../connection';
import { CaseInsertData, CaseUpdateData } from '../index'; // Import types
import { CaseType, CaseDocument, Case as CaseRow } from '../schema'; // Import schema types


// Helper to access the mock's internal state if needed for assertions or reset
const mockSQLite = SQLite as any; // Access to __resetAllMockDatabases etc.

const MOCK_DB_NAME_IN_CODE = "CaseDiary.db"; // This is what the SUT uses.
// The mock will store data under this name.

// Utility to ensure a clean slate before each test runs
beforeEach(async () => {
  // 1. Reset the singleton dbInstance in your actual database module
  //    This ensures getDb() will call openDatabaseAsync again.
  __TEST_ONLY_resetDbInstance(); // Using direct import

  // 2. Reset the mock's internal data store for all database names.
  //    This ensures that when openDatabaseAsync (the mock) is called,
  //    it starts with a fresh `tables` object for the given DB name.
  mockSQLite.__resetAllMockDatabases();

  // Optional: If your mock methods (runAsync, getAllAsync etc.) are jest.fn(),
  // their call counts will be reset automatically by Jest if `clearMocks` is true in Jest config (default is false).
  // If you need to manually reset call counts on deeper mock functions:
  // e.g., if SQLite.openDatabaseAsync itself is a jest.fn() and you want to clear its calls.
  // (SQLite.openDatabaseAsync as jest.Mock).mockClear();
  // However, for the methods *returned* by openDatabaseAsync, those are new functions each time
  // openDatabaseAsync is called IF dbInstance was reset.
});

describe('Database Module Tests', () => {

  describe('CaseTypes CRUD', () => {
    const testUserId = 1;
    it('should add a new case type', async () => {
      const addCaseTypeSpy = jest.spyOn(dbFunctions, 'addCaseType');
      await dbFunctions.addCaseType('Test Custom Type', testUserId);
      expect(addCaseTypeSpy).toHaveBeenCalledWith('Test Custom Type', testUserId);
    });

    it('should get case types', async () => {
      const getCaseTypesSpy = jest.spyOn(dbFunctions, 'getCaseTypes');
      await dbFunctions.getCaseTypes(testUserId);
      expect(getCaseTypesSpy).toHaveBeenCalledWith(testUserId);
    });

    it('should update a case type', async () => {
      const updateCaseTypeSpy = jest.spyOn(dbFunctions, 'updateCaseType');
      await dbFunctions.updateCaseType(1, 'Updated Custom Type', testUserId);
      expect(updateCaseTypeSpy).toHaveBeenCalledWith(1, 'Updated Custom Type', testUserId);
    });

    it('should delete a case type', async () => {
      const deleteCaseTypeSpy = jest.spyOn(dbFunctions, 'deleteCaseType');
      await dbFunctions.deleteCaseType(1, testUserId);
      expect(deleteCaseTypeSpy).toHaveBeenCalledWith(1, testUserId);
    });
  });

  describe('Cases CRUD', () => {
    const testUserId = 1;
    const caseUniqueId = 'test-case-uuid-123';
    let sampleCaseData: CaseInsertData;

    beforeEach(async () => {
      sampleCaseData = {
        uniqueId: caseUniqueId,
        user_id: testUserId,
        CNRNumber: 'CNR123',
        case_number: '101',
        case_year: 2024,
        FirstParty: 'Plaintiff Test',
        OppositeParty: 'Defendant Test',
      };
    });

    it('should add a case', async () => {
      const addCaseSpy = jest.spyOn(dbFunctions, 'addCase');
      await dbFunctions.addCase(sampleCaseData);
      expect(addCaseSpy).toHaveBeenCalledWith(sampleCaseData);
    });

    it('should update a case', async () => {
      const updateCaseSpy = jest.spyOn(dbFunctions, 'updateCase');
      const updates: CaseUpdateData = { CaseStatus: 'Hearing', NextDate: '2024-12-25' };
      await dbFunctions.updateCase(1, updates, testUserId);
      expect(updateCaseSpy).toHaveBeenCalledWith(1, updates, testUserId);
    });

    it('should delete a case', async () => {
      const deleteCaseSpy = jest.spyOn(dbFunctions, 'deleteCase');
      await dbFunctions.deleteCase(1, testUserId);
      expect(deleteCaseSpy).toHaveBeenCalledWith(1, testUserId);
    });
  });

  describe('CaseDocuments CRUD', () => {
    const testUserId = 1;
    let caseId: number | null = 1;

    it('should upload a case document', async () => {
      const uploadCaseDocumentSpy = jest.spyOn(dbFunctions, 'uploadCaseDocument');
      const docOptions = {
        originalFileName: 'test_document.pdf',
        fileType: 'application/pdf',
        fileUri: 'file:///path/to/mock/document.pdf',
        caseId: caseId!,
        userId: testUserId,
        fileSize: 10240,
      };
      await dbFunctions.uploadCaseDocument(docOptions);
      expect(uploadCaseDocumentSpy).toHaveBeenCalledWith(docOptions);
    });

    it('should delete a case document', async () => {
      const deleteCaseDocumentSpy = jest.spyOn(dbFunctions, 'deleteCaseDocument');
      await dbFunctions.deleteCaseDocument(1);
      expect(deleteCaseDocumentSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('CaseHistoryLog', () => {
    const testUserId = 1; // Case owner
    const actorUserId = 2; // Different user making the change
    let caseId: number | null;

    beforeEach(async () => {
      const initialCaseData: CaseInsertData = {
        uniqueId: `case-hist-test-${Date.now()}`,
        user_id: actorUserId,
        CaseStatus: 'New',
        NextDate: '2024-01-01',
      };
      caseId = await addCase(initialCaseData);
    });

    it('should add a history entry when a tracked case field is updated', async () => {
      const updateCaseSpy = jest.spyOn(dbFunctions, 'updateCase');
      const updates: CaseUpdateData = { CaseStatus: 'Pending', NextDate: '2024-02-01' };
      await dbFunctions.updateCase(caseId!, updates, actorUserId);
      expect(updateCaseSpy).toHaveBeenCalledWith(caseId, updates, actorUserId);
    });
  });

});
