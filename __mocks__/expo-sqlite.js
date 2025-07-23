let mockDatabases = {};

const mockSQLiteAPI = {
  openDatabaseAsync: jest.fn(async (name, options) => {
    const currentDbName = name;

    if (!mockDatabases[currentDbName] || (options && options.useNewConnection)) {
      mockDatabases[currentDbName] = { tables: {}, foreignKeysEnabled: false };
    }

    const dbOperations = {
      _name: currentDbName,
      execAsync: jest.fn(async (source) => {
        if (!mockDatabases[currentDbName]) { console.error(`Mock DB [${currentDbName}] not found in execAsync!`); return []; }
        const commands = source.split(';').filter(cmd => cmd.trim() !== '');
        const results = [];
        for (const cmd of commands) {
          if (cmd.toUpperCase().startsWith("CREATE TABLE IF NOT EXISTS")) {
            const tableNameMatch = cmd.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
            if (tableNameMatch && tableNameMatch[1]) {
              const tableName = tableNameMatch[1];
              if (!mockDatabases[currentDbName].tables[tableName]) {
                mockDatabases[currentDbName].tables[tableName] = [];
              }
            }
          } else if (cmd.toUpperCase().startsWith("CREATE TRIGGER") || cmd.toUpperCase().startsWith("CREATE INDEX")) {
          } else if (cmd.toUpperCase().startsWith("PRAGMA FOREIGN_KEYS = ON")) {
            mockDatabases[currentDbName].foreignKeysEnabled = true;
          }
           results.push({ rowsAffected: 0, insertId: undefined, rows: [] });
        }
        return results;
      }),
      getFirstAsync: jest.fn(async (sql, params = []) => {
        if (!mockDatabases[currentDbName]) return null;
        const tableName = extractTableName(sql, "SELECT");
        if (!tableName || !mockDatabases[currentDbName].tables[tableName]) {
            if (sql.toUpperCase().includes("COUNT(*)")) return { "COUNT(*)": 0 };
            return null;
        }

        let tableData = mockDatabases[currentDbName].tables[tableName];
        let filtered = [...tableData];
        const whereMatch = sql.match(/WHERE\s+(.*)/i);
        let paramIndex = 0;

        if (whereMatch && whereMatch[1]) {
            const conditionsStrFull = whereMatch[1].split(/ORDER BY|GROUP BY|LIMIT/)[0].trim();
            const conditions = conditionsStrFull.split(/\s+AND\s+/i);
            conditions.forEach(condString => {
                const cond = condString.trim();
                const extractColumnName = (conditionFragment) => {
                    const match = conditionFragment.match(/(?:(\w+)\.)?(\w+)/);
                    return match ? match[2] : conditionFragment;
                };

                if (cond.includes("= ?")) {
                    const rawColName = cond.split(" = ?")[0].trim();
                    const colName = extractColumnName(rawColName);
                    if (paramIndex < params.length) {
                        filtered = filtered.filter(row => String(row[colName]) === String(params[paramIndex]));
                        paramIndex++;
                    }
                }
            });
        }

        const resultRow = filtered[0] || null;
        return resultRow ? JSON.parse(JSON.stringify(resultRow)) : null;
      }),
      getAllAsync: jest.fn(async (sql, params = []) => {
        if (!mockDatabases[currentDbName]) { return []; }
        const tableName = extractTableName(sql, "SELECT");
         if (!tableName || !mockDatabases[currentDbName].tables[tableName]) {
            return [];
        }
        let tableData = mockDatabases[currentDbName].tables[tableName];
        let filtered = [...tableData];
        const whereMatch = sql.match(/WHERE\s+(.*)/i);
        let paramIndex = 0;

        if (whereMatch && whereMatch[1]) {
            const conditionsStrFull = whereMatch[1].split(/ORDER BY|GROUP BY|LIMIT/)[0].trim();
            if (conditionsStrFull.toUpperCase() === "USER_ID IS NULL OR USER_ID = ?") {
                if (params.length > paramIndex) {
                    const userIdParam = params[paramIndex];
                    filtered = tableData.filter(row => {
                        return row.user_id === null || row.user_id === undefined || String(row.user_id) === String(userIdParam);
                    });
                    paramIndex++;
                } else {
                    filtered = tableData.filter(row => (row.user_id === null || row.user_id === undefined));
                }
            } else {
                const conditions = conditionsStrFull.split(/\s+AND\s+/i);
                conditions.forEach(condString => {
                    const cond = condString.trim();
                    const extractColumnName = (conditionFragment) => {
                        const match = conditionFragment.match(/(?:(\w+)\.)?(\w+)/);
                        return match ? match[2] : conditionFragment;
                    };

                    if (cond.includes("= ?")) {
                        const rawColName = cond.split(" = ?")[0].trim();
                        const colName = extractColumnName(rawColName);
                        if (paramIndex < params.length) {
                            filtered = filtered.filter(row => String(row[colName]) === String(params[paramIndex]));
                            paramIndex++;
                        }
                    }
                });
            }
        }
        return filtered.map(row => JSON.parse(JSON.stringify(row)));
      }),
      runAsync: jest.fn(async (sql, params = []) => {
        if (!mockDatabases[currentDbName]) {
            return { changes: 0, lastInsertRowId: undefined };
        }
        const insertTableName = extractTableName(sql, "INSERT INTO");
        const updateTableName = extractTableName(sql, "UPDATE");
        const deleteTableName = extractTableName(sql, "DELETE FROM");
        const currentOperationTableName = insertTableName || updateTableName || deleteTableName;

        if (!currentOperationTableName) {
            return { changes: 0, lastInsertRowId: undefined };
        }
        if (!mockDatabases[currentDbName].tables[currentOperationTableName]) {
            if (insertTableName) mockDatabases[currentDbName].tables[currentOperationTableName] = [];
            else return { changes: 0, lastInsertRowId: undefined };
        }

        let changes = 0;
        let lastInsertRowId = undefined;
        const table = mockDatabases[currentDbName].tables[currentOperationTableName];

        if (insertTableName) {
            const maxId = table.length > 0 ? Math.max(0, ...table.map(r => r.id || 0)) : 0;
            lastInsertRowId = maxId + 1;

            const newRowData = { id: lastInsertRowId };
            const columnsMatch = sql.match(/INSERT INTO \w+ ?\((.*?)\)/i);
            let columnsInSql = [];
            if (columnsMatch && columnsMatch[1]) {
                columnsInSql = columnsMatch[1].split(',').map(c => c.trim().replace(/["`]/g, ''));
            }

            const valuesClauseMatch = sql.match(/VALUES\s*\((.*?)\)/i);
            if (columnsInSql.length > 0 && valuesClauseMatch && valuesClauseMatch[1]) {
                const valuesInSqlString = valuesClauseMatch[1].split(',').map(v => v.trim());
                let paramIndex = 0;
                columnsInSql.forEach((colName, colIdx) => {
                    if (colIdx < valuesInSqlString.length) {
                        const valueToken = valuesInSqlString[colIdx];
                        if (valueToken === '?') {
                            if (paramIndex < params.length) {
                                newRowData[colName] = params[paramIndex++];
                            }
                        }
                    }
                });
            }
            table.push(newRowData);
            changes = 1;
        } else if (updateTableName) {
            const setClauseMatch = sql.match(/SET\s+(.*?)\s+(WHERE|$)/i);
            if (setClauseMatch && setClauseMatch[1]) {
                const setAssignmentsText = setClauseMatch[1].split(',').map(s => s.trim());
                const setColumns = setAssignmentsText.map(s => s.split('=')[0].trim());
                let whereParamStartIndex = setColumns.length;
                let affectedRows = 0;
                mockDatabases[currentDbName].tables[currentOperationTableName] = table.map(row => {
                    let matchesWhere = true;
                    const whereClauseMatch = sql.match(/WHERE\s+(.*)/i);
                    if (whereClauseMatch && whereClauseMatch[1].trim() !== "") {
                        if (whereClauseMatch[1].includes("id = ?") && row.id !== params[whereParamStartIndex]) {
                            matchesWhere = false;
                        }
                    }
                    if (matchesWhere) {
                        let updatedRow = { ...row };
                        setColumns.forEach((colName, index) => {
                            updatedRow[colName] = params[index];
                        });
                        if (JSON.stringify(row) !== JSON.stringify(updatedRow)) {
                            affectedRows++;
                        }
                        return updatedRow;
                    }
                    return row;
                });
                changes = affectedRows;
            }
        } else if (deleteTableName) {
           const initialLength = table.length;
           const rowsToKeep = table.filter(row => {
               const whereMatch = sql.match(/WHERE\s+(.*)/i);
               if (whereMatch && whereMatch[1]) {
                   const conditionsStr = whereMatch[1].trim().toUpperCase();
                   if (conditionsStr === "ID = ?") {
                        if (params.length >= 1) {
                            return row.id !== params[0];
                        }
                   }
               }
               return true;
           });
           mockDatabases[currentDbName].tables[currentOperationTableName] = rowsToKeep;
           changes = initialLength - rowsToKeep.length;
        }
        return { changes, lastInsertRowId };
      }),
      closeAsync: jest.fn(async () => {}),
      deleteAsync: jest.fn(async () => {
        delete mockDatabases[currentDbName];
      }),
    };
    return dbOperations;
  }),
};

const extractTableName = (sql, operation) => {
  let regex;
  if (operation.toUpperCase() === "INSERT INTO" || operation.toUpperCase() === "UPDATE" || operation.toUpperCase() === "DELETE FROM") {
    regex = new RegExp(`${operation}\\s+("?\`?\\w+\`?"?\\.)?("?\`?\\w+\`?"?)`, "i");
  } else if (operation.toUpperCase() === "SELECT") {
    const fromMatch = sql.match(/FROM\s+("?\`?\w+\`?"?\.)?("?\`?\w+\`?"?)/i);
    if (fromMatch) {
      return (fromMatch[2] || fromMatch[1])?.replace(/["\`]/g, '');
    }
    regex = /(?:FROM|JOIN)\s+("?\`?\w+\`?"?\.)?("?\`?\w+\`?"?)/i;
  } else {
    regex = new RegExp(`${operation}\\s+("?\`?\\w+\`?"?\\.)?("?\`?\\w+\`?"?)`, "i");
  }
  const match = sql.match(regex);
  return match ? (match[2] || match[1])?.replace(/["\`]/g, '') : null;
};


mockSQLiteAPI.__resetAllMockDatabases = () => {
  mockDatabases = {};
};
mockSQLiteAPI.__getMockDbData = (dbName, tableName) => {
    if (!mockDatabases[dbName] || !mockDatabases[dbName].tables[tableName]) return [];
    return JSON.parse(JSON.stringify(mockDatabases[dbName].tables[tableName]));
};

module.exports = mockSQLiteAPI;
