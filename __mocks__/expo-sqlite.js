const mockDb = {
  transaction: jest.fn().mockImplementation((callback) => {
    const tx = {
      executeSql: jest.fn((sql, args, successCallback, errorCallback) => {
        if (successCallback) {
          successCallback(tx, { rows: { _array: [] } });
        }
      }),
    };
    callback(tx);
  }),
  runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
  getFirstAsync: jest.fn().mockResolvedValue(null),
  getAllAsync: jest.fn().mockResolvedValue([]),
  closeAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  execAsync: jest.fn().mockResolvedValue([]),
  onTransactionAsync: jest.fn(async (asyncFunc) => {
    const mockTx = {
      executeSqlAsync: jest.fn().mockResolvedValue({ rows: [], rowsAffected: 0 }),
    };
    try {
      return await asyncFunc(mockTx);
    } catch (error) {
      throw error;
    }
  }),
};

const mockStatic = {
  openDatabaseAsync: jest.fn(async () => mockDb),
  deleteDatabaseAsync: jest.fn(async () => {}),
};

module.exports = {
  ...mockStatic,
  __resetAllMockDatabases: jest.fn(),
  __getMockDbData: () => [],
};
