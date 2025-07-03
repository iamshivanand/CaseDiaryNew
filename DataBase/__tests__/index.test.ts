import * as SQLite from 'expo-sqlite'; // This will be the mock
import * as dbFunctions from '../index'; // Import your database functions
// Import the specific function directly for clarity and to ensure it's resolved
import { __TEST_ONLY_resetDbInstance, getDb, getCaseTypes, addCaseType, updateCaseType, deleteCaseType, addCase, getCaseById, updateCase, deleteCase, uploadCaseDocument, getCaseDocuments, deleteCaseDocument } from '../index';
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
  describe('Schema Initialization and Seeding', () => {
    it('should initialize schema and seed initial data without errors', async () => {
      const database = await getDb(); // This will also trigger initializeSchema and seedInitialData
      expect(database).toBeDefined();
      // Check if seed data was inserted (example for CaseTypes)
      const caseTypes = await getCaseTypes();
      expect(caseTypes.length).toBeGreaterThan(0);
      const civilType = caseTypes.find(ct => ct.name === 'Civil');
      expect(civilType).toBeDefined();

      const districts = await dbFunctions.getDistricts(); // Use dbFunctions alias or specific import
      expect(districts.length).toBeGreaterThan(0);
      const bareilly = districts.find(d => d.name === 'Bareilly');
      expect(bareilly).toBeDefined();
      expect(bareilly?.state).toEqual('Uttar Pradesh');
    });
  });

  describe('CaseTypes CRUD', () => {
    const testUserId = 1;
    it('should add and get a new case type', async () => {
      await getDb(); // Ensure DB is initialized first
      const newTypeName = 'Test Custom Type';
      const newTypeId = await addCaseType(newTypeName, testUserId);
      expect(newTypeId).toBeGreaterThan(0);

      const caseTypesResult = await getCaseTypes(testUserId);
      const foundType = caseTypesResult.find(ct => ct.id === newTypeId);
      expect(foundType).toBeDefined();
      expect(foundType?.name).toEqual(newTypeName);
      expect(foundType?.user_id).toEqual(testUserId);
    });

    it('should get global and user-specific case types', async () => {
      await getDb();
      await addCaseType('UserSpecificType1', testUserId);
      await addCaseType('UserSpecificType2', testUserId + 1); // Another user

      const user1Types = await getCaseTypes(testUserId);
      const globalCivilType = user1Types.find(ct => ct.name === 'Civil' && ct.user_id === null);
      const userSpecificType = user1Types.find(ct => ct.name === 'UserSpecificType1' && ct.user_id === testUserId);

      expect(globalCivilType).toBeDefined();
      expect(userSpecificType).toBeDefined();
      expect(user1Types.find(ct => ct.name === 'UserSpecificType2')).toBeUndefined(); // Should not see other user's type
    });
     it('should update a user-specific case type', async () => {
      await getDb();
      const originalName = "OriginalUserType";
      const updatedName = "UpdatedUserType";
      const typeId = await addCaseType(originalName, testUserId);
      expect(typeId).not.toBeNull();

      const updateSuccess = await updateCaseType(typeId!, updatedName, testUserId);
      expect(updateSuccess).toBe(true);

      const caseTypesResult = await getCaseTypes(testUserId);
      const updatedType = caseTypesResult.find(ct => ct.id === typeId);
      expect(updatedType?.name).toEqual(updatedName);
    });

    it('should delete a user-specific case type', async () => {
      await getDb();
      const typeName = "ToDeleteUserType";
      const typeId = await addCaseType(typeName, testUserId);
      expect(typeId).not.toBeNull();

      const deleteSuccess = await deleteCaseType(typeId!, testUserId);
      expect(deleteSuccess).toBe(true);

      const caseTypesResult = await getCaseTypes(testUserId);
      expect(caseTypesResult.find(ct => ct.id === typeId)).toBeUndefined();
    });

    it('should not allow deleting a global case type by a user', async () => {
        await getDb();
        const globalTypes = await getCaseTypes();
        const civilType = globalTypes.find(ct => ct.name === "Civil" && ct.user_id === null);
        expect(civilType).toBeDefined();

        const deleteAttempt = await deleteCaseType(civilType!.id, testUserId);
        expect(deleteAttempt).toBe(false);
    });
  });

  describe('Cases CRUD', () => {
    const testUserId = 1;
    const caseUniqueId = 'test-case-uuid-123';
    let sampleCaseData: CaseInsertData;

    beforeEach(async () => {
      await getDb(); // Ensure DB init for each test in this suite too
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

    it('should add and get a case by ID', async () => {
      const caseId = await addCase(sampleCaseData);
      expect(caseId).toBeGreaterThan(0);

      const fetchedCase = await getCaseById(caseId!, testUserId);
      expect(fetchedCase).toBeDefined();
      expect(fetchedCase?.id).toEqual(caseId);
      expect(fetchedCase?.CNRNumber).toEqual('CNR123');
      expect(fetchedCase?.user_id).toEqual(testUserId);
    });

    it('should update a case', async () => {
      const caseId = await addCase(sampleCaseData);
      expect(caseId).not.toBeNull();

      const updates: CaseUpdateData = { CaseStatus: 'Hearing', NextDate: '2024-12-25' };
      const updateSuccess = await updateCase(caseId!, updates, testUserId);
      expect(updateSuccess).toBe(true);

      const updatedCase = await getCaseById(caseId!, testUserId);
      expect(updatedCase?.CaseStatus).toEqual('Hearing');
      expect(updatedCase?.NextDate).toEqual('2024-12-25');
    });

     it('should delete a case', async () => {
      const caseId = await addCase(sampleCaseData);
      expect(caseId).not.toBeNull();

      const deleteSuccess = await deleteCase(caseId!, testUserId);
      expect(deleteSuccess).toBe(true);

      const fetchedCase = await getCaseById(caseId!, testUserId);
      expect(fetchedCase).toBeNull();
    });
  });

  describe('CaseDocuments CRUD', () => {
    const testUserId = 1;
    let caseId: number | null;

    beforeEach(async () => {
      await getDb();
      caseId = await addCase({
        uniqueId: `case-doc-test-${Date.now()}`,
        user_id: testUserId,
        FirstParty: 'Doc Owner',
      });
      expect(caseId).not.toBeNull();
    });

    it('should upload and get case documents', async () => {
      const docOptions = {
        originalFileName: 'test_document.pdf',
        fileType: 'application/pdf',
        fileUri: 'file:///path/to/mock/document.pdf',
        caseId: caseId!,
        userId: testUserId,
        fileSize: 10240,
      };
      const documentId = await uploadCaseDocument(docOptions);
      expect(documentId).toBeGreaterThan(0);

      const documents = await getCaseDocuments(caseId!);
      expect(documents.length).toBe(1);
      expect(documents[0].id).toEqual(documentId);
      expect(documents[0].original_display_name).toEqual('test_document.pdf');
      expect(documents[0].case_id).toEqual(caseId);
    });

    it('should delete a case document', async () => {
      const docOptions = {
        originalFileName: 'to_delete.txt',
        fileType: 'text/plain',
        fileUri: 'file:///path/to/mock/to_delete.txt',
        caseId: caseId!,
        userId: testUserId,
      };
      const documentId = await uploadCaseDocument(docOptions);
      expect(documentId).not.toBeNull();

      const deleteSuccess = await deleteCaseDocument(documentId!);
      expect(deleteSuccess).toBe(true);

      const documents = await getCaseDocuments(caseId!);
      expect(documents.find(d => d.id === documentId)).toBeUndefined();
    });
  });

  describe('CaseHistoryLog', () => {
    const testUserId = 1; // Case owner
    const actorUserId = 2; // Different user making the change
    let caseId: number | null;

    beforeEach(async () => {
      await getDb();
      const initialCaseData: CaseInsertData = {
        uniqueId: `case-hist-test-${Date.now()}`,
        user_id: testUserId,
        CaseStatus: 'New',
        NextDate: '2024-01-01',
      };
      caseId = await addCase(initialCaseData);
      expect(caseId).not.toBeNull();
    });

    it('should add a history entry when a tracked case field is updated', async () => {
      const updates: CaseUpdateData = { CaseStatus: 'Pending', NextDate: '2024-02-01' };
      await updateCase(caseId!, updates, actorUserId); // actorUserId performs the update

      const historyLogs = mockSQLite.__getMockDbData(MOCK_DB_NAME_IN_CODE, "CaseHistoryLog");

      const statusChangeEntry = historyLogs.find(log => log.case_id === caseId && log.field_changed === 'CaseStatus');
      expect(statusChangeEntry).toBeDefined();
      expect(statusChangeEntry.old_value).toEqual('New');
      expect(statusChangeEntry.new_value).toEqual('Pending');
      expect(statusChangeEntry.user_id).toEqual(actorUserId);

      const nextDateChangeEntry = historyLogs.find(log => log.case_id === caseId && log.field_changed === 'NextDate');
      expect(nextDateChangeEntry).toBeDefined();
      expect(nextDateChangeEntry.old_value).toEqual('2024-01-01');
      expect(nextDateChangeEntry.new_value).toEqual('2024-02-01');
      expect(nextDateChangeEntry.user_id).toEqual(actorUserId);
    });

    it('should not add a history entry if value is same', async () => {
      await getDb(); // ensure db is init
      const initialHistoryLogs = mockSQLite.__getMockDbData(MOCK_DB_NAME_IN_CODE, "CaseHistoryLog");
      const oldHistoryCount = initialHistoryLogs.filter(log => log.case_id === caseId).length;

      const updates: CaseUpdateData = { CaseStatus: 'New' }; // Same status as initial
      await updateCase(caseId!, updates, actorUserId);

      const currentHistoryLogs = mockSQLite.__getMockDbData(MOCK_DB_NAME_IN_CODE, "CaseHistoryLog");
      const newHistoryCount = currentHistoryLogs.filter(log => log.case_id === caseId).length;
      expect(newHistoryCount).toEqual(oldHistoryCount); // No new entries for this case
    });
  });

});
