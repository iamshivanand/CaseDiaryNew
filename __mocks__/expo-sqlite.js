// __mocks__/expo-sqlite.js

// In-memory store for our mock database
let mockDatabases = {}; // Store multiple named databases

const mockSQLiteAPI = {
  openDatabaseAsync: jest.fn(async (name, options) => { // options can be { useNewConnection: true }
    // console.log(`Mock DB: Opening database "${name}"`);
    if (!mockDatabases[name] || (options && options.useNewConnection)) { // useNewConnection is part of new API
      mockDatabases[name] = { tables: {}, foreignKeysEnabled: false };
    }

    const currentDbName = name; // Closure to capture the db name for methods

    // This object simulates the SQLiteDatabase class instance from expo-sqlite/next
    const dbOperations = {
      _name: currentDbName,
      execAsync: jest.fn(async (source) => {
        const commands = source.split(';').filter(cmd => cmd.trim() !== '');
        const results = [];
        for (const cmd of commands) {
          // console.log(`Mock DB [${currentDbName}] execAsync: ${cmd}`);
          if (cmd.toUpperCase().startsWith("CREATE TABLE IF NOT EXISTS")) {
            const tableNameMatch = cmd.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
            if (tableNameMatch && tableNameMatch[1]) {
              const tableName = tableNameMatch[1];
              if (!mockDatabases[currentDbName].tables[tableName]) {
                mockDatabases[currentDbName].tables[tableName] = [];
              }
            }
          } else if (cmd.toUpperCase().startsWith("CREATE TRIGGER") || cmd.toUpperCase().startsWith("CREATE INDEX")) {
            // console.log(`Mock DB [${currentDbName}]: Ignoring DDL for simplicity: ${cmd}`);
          } else if (cmd.toUpperCase().startsWith("PRAGMA FOREIGN_KEYS = ON")) {
            // console.log(`Mock DB [${currentDbName}]: Foreign keys pragma received`);
            mockDatabases[currentDbName].foreignKeysEnabled = true;
          }
           results.push({ rowsAffected: 0, insertId: undefined, rows: [] });
        }
        return results;
      }),
      getFirstAsync: jest.fn(async (sql, params = []) => {
        // console.log(`Mock DB [${currentDbName}] getFirstAsync: SQL: ${sql} Params: ${JSON.stringify(params)}`);
        if (!mockDatabases[currentDbName]) return null; // DB not opened via mock
        const tableName = extractTableName(sql, "SELECT");
        if (!tableName || !mockDatabases[currentDbName].tables[tableName]) {
            if (sql.toUpperCase().includes("COUNT(*)")) return { "COUNT(*)": 0 };
            return null;
        }

        let tableData = mockDatabases[currentDbName].tables[tableName];
        const filteredData = applyBasicWhere(tableData, sql, params);

        if (sql.toUpperCase().includes("COUNT(*)")) {
            return { "COUNT(*)": filteredData.length };
        }
        return filteredData[0] || null;
      }),
      getAllAsync: jest.fn(async (sql, params = []) => {
        // console.log(`Mock DB [${currentDbName}] getAllAsync: SQL: ${sql} Params: ${JSON.stringify(params)}`);
        if (!mockDatabases[currentDbName]) return [];
        const tableName = extractTableName(sql, "SELECT");
         if (!tableName || !mockDatabases[currentDbName].tables[tableName]) {
            return [];
        }
        let tableData = mockDatabases[currentDbName].tables[tableName];
        const filteredData = applyBasicWhere(tableData, sql, params);
        return filteredData;
      }),
      runAsync: jest.fn(async (sql, params = []) => {
        // console.log(`Mock DB [${currentDbName}] runAsync: SQL: ${sql} Params: ${JSON.stringify(params)}`);
        if (!mockDatabases[currentDbName]) {
            console.warn(`Mock DB [${currentDbName}]: database not initialized in mockDatabases for runAsync.`);
            return { changes: 0, lastInsertRowId: undefined };
        }
        const insertTableName = extractTableName(sql, "INSERT INTO");
        const updateTableName = extractTableName(sql, "UPDATE");
        const deleteTableName = extractTableName(sql, "DELETE FROM");
        const tableName = insertTableName || updateTableName || deleteTableName;

        if (!tableName) {
            console.warn(`Mock DB [${currentDbName}]: Could not determine table for DML: ${sql}`);
            return { changes: 0, lastInsertRowId: undefined };
        }
        if (!mockDatabases[currentDbName].tables[tableName]) {
            if (insertTableName) mockDatabases[currentDbName].tables[tableName] = [];
            else return { changes: 0, lastInsertRowId: undefined };
        }

        let changes = 0;
        let lastInsertRowId = undefined;
        const table = mockDatabases[currentDbName].tables[tableName];

        if (insertTableName) {
          lastInsertRowId = (table.reduce((maxId, row) => Math.max(row.id || 0, maxId), 0)) + 1;

          const columnsMatch = sql.match(/\((.*?)\)/);
          let columns = [];
          if (columnsMatch && columnsMatch[1] && !sql.match(/VALUES\s*\(\s*\)/i)) { // ensure not empty values ()
            columns = columnsMatch[1].split(',').map(c => c.trim());
          } else {
            // Best guess based on number of params if columns not specified
            // This is fragile; always specify columns in INSERT for robust tests.
            // For now, if columns are empty, assume direct mapping based on existing table structure if possible.
          }

          const newRow = { id: lastInsertRowId };
          if (columns.length === params.length) {
            columns.forEach((col, index) => {
              newRow[col] = params[index];
            });
          } else if (params.length > 0 && columns.length === 0) { // INSERT INTO table VALUES (?, ? ...)
            // This part is hard to mock without knowing table schema column order.
            // console.warn(`Mock DB [${currentDbName}]: INSERT without explicit columns is hard to mock accurately.`);
            // Simplistic: assign params to keys like 'col1', 'col2' or rely on object spread if params is an object (not typical for SQL)
            // For this mock, let's assume params are in order of some known schema if columns are not explicit.
            // This path should ideally not be hit if test SQL is well-formed.
          }


          // Auto-fill created_at/updated_at if they are part of the table's typical schema (and not provided)
          // This is a guess; real triggers/defaults handle this.
          if (columns.length > 0) { // Only if we parsed columns
            if (columns.includes('created_at') && !newRow.hasOwnProperty('created_at')) newRow.created_at = new Date().toISOString();
            if (columns.includes('updated_at') && !newRow.hasOwnProperty('updated_at')) newRow.updated_at = new Date().toISOString();
          }


          table.push(newRow);
          changes = 1;
        } else if (updateTableName) {
          const whereClauseMatch = sql.match(/WHERE\s+(.*)/i);
          const setClauseMatch = sql.match(/SET\s+(.*?)\s+WHERE/i); // Ensure WHERE is present for SET parsing

          if (setClauseMatch && setClauseMatch[1]) {
            const setAssignments = setClauseMatch[1].split(',').map(s => s.trim().split('=')[0].trim());
            let whereParamIndex = setAssignments.length; // Params for WHERE clause start after SET params

            table.forEach((row) => {
              let matchesWhere = false;
              if (whereClauseMatch && whereClauseMatch[1].includes("id = ?")) {
                matchesWhere = row.id === params[whereParamIndex];
              } else if (whereClauseMatch && whereClauseMatch[1].includes("uniqueId = ?")) {
                 matchesWhere = row.uniqueId === params[whereParamIndex];
              } else if (!whereClauseMatch) {
                matchesWhere = true;
              }
              // Add more WHERE conditions as needed for tests

              if (matchesWhere) {
                let paramIndexForSet = 0;
                setAssignments.forEach(colName => {
                    if (paramIndexForSet < whereParamIndex) {
                        row[colName] = params[paramIndexForSet++];
                    }
                });
                if(row.hasOwnProperty('updated_at')) row.updated_at = new Date().toISOString();
                changes++;
              }
            });
          }
        } else if (deleteTableName) {
           const initialLength = table.length;
           mockDatabases[currentDbName].tables[tableName] = table.filter(row => {
               if (sql.includes("WHERE id = ?")) return row.id !== params[0];
               if (sql.includes("WHERE case_id = ?")) return row.case_id !== params[0];
               // Add more specific WHERE for delete if needed
               return false; // Default to not deleting if WHERE is not specific enough for mock
           });
           changes = initialLength - mockDatabases[currentDbName].tables[tableName].length;
        }
        return { changes, lastInsertRowId };
      }),
      closeAsync: jest.fn(async () => { /* console.log(`Mock DB [${currentDbName}]: closeAsync`); */ }),
      deleteAsync: jest.fn(async () => {
        // console.log(`Mock DB [${currentDbName}]: deleteAsync`);
        delete mockDatabases[currentDbName];
      }),
      onTransactionAsync: jest.fn(async (asyncFunc, readOnly) => {
        // console.log(`Mock DB [${currentDbName}]: onTransactionAsync (readOnly: ${readOnly})`);
        const mockTx = {
          executeSqlAsync: jest.fn(async (sql, params) => {
            // console.log(`Mock Tx for [${currentDbName}] SQL: ${sql}, Params: ${JSON.stringify(params)}`);
            const upperSql = sql.toUpperCase();
            if (upperSql.startsWith('SELECT')) {
              if (upperSql.includes("COUNT(*)") || (await dbOperations.getFirstAsync(sql, params) !== null && !upperSql.match(/LIMIT\s+(0|([1-9]\d*))$/i) ) ) { // Heuristic for getFirst
                const row = await dbOperations.getFirstAsync(sql, params);
                return { rows: row ? [row] : [], rowsAffected: 0, insertId: undefined };
              } else {
                const rows = await dbOperations.getAllAsync(sql, params);
                return { rows, rowsAffected: 0, insertId: undefined };
              }
            } else if (upperSql.startsWith('INSERT') || upperSql.startsWith('UPDATE') || upperSql.startsWith('DELETE')) {
              const result = await dbOperations.runAsync(sql, params);
              return { rows: [], rowsAffected: result.changes, insertId: result.lastInsertRowId };
            } else {
              const ddlResults = await dbOperations.execAsync(sql); // Array of results
              // Return the structure for the first command, or a generic one.
              return ddlResults[0] || { rows: [], rowsAffected: 0, insertId: undefined };
            }
          }),
        };
        try {
          const result = await asyncFunc(mockTx);
          return result;
        } catch (error) {
          // console.error(`Mock DB [${currentDbName}]: Error in transaction, would rollback here.`, error);
          throw error;
        }
      }),
    };
    return dbOperations;
  }),
};

const extractTableName = (sql, operation) => {
  // Adjusted to capture table name that might be quoted or have schema prefix (though unlikely for this app)
  const regex = new RegExp(`${operation}\\s+("?\`?\\w+\`?"?\\.)?("?\`?\\w+\`?"?)`, "i");
  const match = sql.match(regex);
  return match ? (match[2] || match[1])?.replace(/["\`]/g, '') : null; // Get table name, remove quotes
};

const applyBasicWhere = (data, sql, params) => {
    let filtered = [...data];
    const whereMatch = sql.match(/WHERE\s+(.*)/i);
    if (whereMatch && whereMatch[1]) {
        const conditionsStr = whereMatch[1].split(/ORDER BY|GROUP BY|LIMIT/)[0].trim();
        const conditions = conditionsStr.split(/\s+AND\s+/i);
        let paramIndex = 0;
        conditions.forEach(condString => {
            const cond = condString.trim();
            if (cond.toUpperCase().endsWith("IS NULL")) {
                const colName = cond.substring(0, cond.length - "IS NULL".length).trim();
                filtered = filtered.filter(row => row[colName] === null || row[colName] === undefined);
            } else if (cond.includes("= ?")) {
                const colName = cond.split(" = ?")[0].trim();
                if (paramIndex < params.length) {
                    filtered = filtered.filter(row => String(row[colName]) === String(params[paramIndex]));
                    paramIndex++;
                }
            } else if (cond.includes("LIKE ?")) {
                 const colName = cond.split(" LIKE ?")[0].trim();
                 if (paramIndex < params.length) {
                    const searchPattern = String(params[paramIndex]);
                    // Basic LIKE: %term%, term%, %term
                    let regexPattern = searchPattern.replace(/%/g, '.*');
                    if (searchPattern.startsWith('%') && searchPattern.endsWith('%')) {
                        regexPattern = searchPattern.substring(1, searchPattern.length -1); // contains
                    } else if (searchPattern.startsWith('%')) {
                        regexPattern = searchPattern.substring(1) + '$'; // ends with
                    } else if (searchPattern.endsWith('%')) {
                        regexPattern = '^' + searchPattern.substring(0, searchPattern.length-1); // starts with
                    } else {
                        regexPattern = '^' + searchPattern + '$'; // exact match if no %
                    }
                    try {
                        const regex = new RegExp(regexPattern, 'i');
                        filtered = filtered.filter(row => regex.test(String(row[colName])));
                    } catch (e) { console.warn("Mock LIKE regex error", e); }
                    paramIndex++;
                 }
            }
        });
    }
    return filtered;
};

mockSQLiteAPI.__resetAllMockDatabases = () => {
  mockDatabases = {};
};
mockSQLiteAPI.__getMockDbData = (dbName, tableName) => {
    if (!mockDatabases[dbName] || !mockDatabases[dbName].tables[tableName]) return [];
    return JSON.parse(JSON.stringify(mockDatabases[dbName].tables[tableName])); // Return a copy
};
mockSQLiteAPI.__printMockDb = (dbName) => {
    // console.log(`Mock DB [${dbName}] state:`, JSON.stringify(mockDatabases[dbName], null, 2));
};

module.exports = mockSQLiteAPI;
