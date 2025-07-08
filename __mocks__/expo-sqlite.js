// __mocks__/expo-sqlite.js

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
        console.log(`[[[Mock getFirstAsync ENTERED for ${currentDbName} - SQL: ${sql}]]]`);
        if (!mockDatabases[currentDbName]) return null;
        const tableName = extractTableName(sql, "SELECT");
        if (!tableName || !mockDatabases[currentDbName].tables[tableName]) {
            if (sql.toUpperCase().includes("COUNT(*)")) return { "COUNT(*)": 0 };
            return null;
        }

        let tableData = mockDatabases[currentDbName].tables[tableName];

        // --- Integrated filtering logic from applyBasicWhere ---
        let filtered = [...tableData]; // Start with a shallow copy
        const whereMatch = sql.match(/WHERE\s+(.*)/i);
        let paramIndex = 0;

        if (whereMatch && whereMatch[1]) {
            const conditionsStrFull = whereMatch[1].split(/ORDER BY|GROUP BY|LIMIT/)[0].trim();

            if (conditionsStrFull.toUpperCase() === "USER_ID IS NULL OR USER_ID = ?") {
                // console.log(`getFirstAsync direct: Matched specific OR case for user_id. Params: ${JSON.stringify(params)}, current paramIndex: ${paramIndex}`);
                if (params.length > paramIndex) {
                    const userIdParam = params[paramIndex];
                    filtered = tableData.filter(row => {
                        const isNull = row.user_id === null || row.user_id === undefined;
                        const userIdMatch = String(row.user_id) === String(userIdParam);
                        return isNull || userIdMatch;
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

                    if (cond.toUpperCase().endsWith("IS NULL")) {
                        const rawColName = cond.substring(0, cond.length - "IS NULL".length).trim();
                        const colName = extractColumnName(rawColName);
                        filtered = filtered.filter(row => row[colName] === null || row[colName] === undefined);
                    } else if (cond.toUpperCase().endsWith("IS NOT NULL")) {
                        const rawColName = cond.substring(0, cond.length - "IS NOT NULL".length).trim();
                        const colName = extractColumnName(rawColName);
                        filtered = filtered.filter(row => row[colName] !== null && row[colName] !== undefined);
                    } else if (cond.includes("= ?")) {
                        const rawColName = cond.split(" = ?")[0].trim();
                        const colName = extractColumnName(rawColName);
                        if (paramIndex < params.length) {
                            filtered = filtered.filter(row => String(row[colName]) === String(params[paramIndex]));
                            paramIndex++;
                        } else {
                             console.warn(`Mock DB getFirstAsync: Not enough params for condition: ${cond}. ParamIndex: ${paramIndex}, Params: ${JSON.stringify(params)}`);
                             filtered = [];
                        }
                    } else if (cond.includes("LIKE ?")) {
                         const rawColName = cond.split(" LIKE ?")[0].trim();
                         const colName = extractColumnName(rawColName);
                         if (paramIndex < params.length) {
                            const searchPattern = String(params[paramIndex]);
                            let regexPattern = searchPattern.replace(/%/g, '.*');
                            if (searchPattern.startsWith('%') && searchPattern.endsWith('%') && searchPattern.length > 1) {
                                regexPattern = searchPattern.substring(1, searchPattern.length -1);
                            } else if (searchPattern.startsWith('%') && searchPattern.length > 0) {
                                regexPattern = searchPattern.substring(1) + '$';
                            } else if (searchPattern.endsWith('%') && searchPattern.length > 0) {
                                regexPattern = '^' + searchPattern.substring(0, searchPattern.length-1);
                            } else {
                                regexPattern = '^' + regexPattern + '$';
                            }
                            try {
                                const regex = new RegExp(regexPattern, 'i');
                                filtered = filtered.filter(row => regex.test(String(row[colName])));
                            } catch (e) { console.warn("Mock LIKE regex error", e, "Pattern:", regexPattern); }
                            paramIndex++;
                         } else {
                            console.warn(`Mock DB getFirstAsync: Not enough params for LIKE condition: ${cond}. ParamIndex: ${paramIndex}, Params: ${JSON.stringify(params)}`);
                            filtered = [];
                         }
                    } else if (cond.includes("OR")) {
                         console.warn(`Mock DB getFirstAsync: Generic OR condition processing after AND split might be incomplete: ${cond}`);
                         const orParts = cond.split(/\s+OR\s+/i).map(p => p.replace(/[()]/g, "").trim());
                         const originalCurrentFiltered = [...filtered];
                         let orCombinedResults = [];
                         let orMatchedOnce = false;
                         for(const orPart of orParts) {
                            let tempPartFiltered = [...originalCurrentFiltered];
                            if (orPart.toUpperCase().endsWith("IS NULL")) {
                                const rawColName = orPart.substring(0, orPart.length - "IS NULL".length).trim();
                                const colName = extractColumnName(rawColName);
                                tempPartFiltered = tempPartFiltered.filter(row => row[colName] === null || row[colName] === undefined);
                            } else if (orPart.includes("= ?")) {
                                const rawColName = orPart.split(" = ?")[0].trim();
                                const colName = extractColumnName(rawColName);
                                 if (paramIndex < params.length) {
                                    tempPartFiltered = tempPartFiltered.filter(row => String(row[colName]) === String(params[paramIndex]));
                                } else { tempPartFiltered = []; }
                            } else {
                                console.warn(`Mock DB getFirstAsync: Unsupported OR part: ${orPart}`);
                                tempPartFiltered = [];
                            }
                            orCombinedResults.push(...tempPartFiltered);
                            if(tempPartFiltered.length > 0) orMatchedOnce = true;
                         }
                         if(orMatchedOnce && orParts.some(p => p.includes("= ?"))) paramIndex++;
                         filtered = orCombinedResults.filter((v, i, a) => a.findIndex(t => JSON.stringify(t) === JSON.stringify(v)) === i);
                    } else {
                        console.warn(`Mock DB getFirstAsync: Unknown condition type: ${cond}`);
                    }
                });
            }
        }
        // --- End of integrated filtering logic ---

        const resultRow = filtered[0] || null;
        const deepCopiedResult = resultRow ? JSON.parse(JSON.stringify(resultRow)) : null;

        if (sql.toUpperCase().includes("COUNT(*)")) {
            return { "COUNT(*)": filtered.length };
        }
        return deepCopiedResult;
      }),
      getAllAsync: jest.fn(async (sql, params = []) => {
        console.log(`[[[Mock getAllAsync ENTERED for ${currentDbName} - SQL: ${sql}]]]`);
        if (!mockDatabases[currentDbName]) { console.error(`Mock DB [${currentDbName}] not found in getAllAsync!`); return []; }
        const tableName = extractTableName(sql, "SELECT");
         if (!tableName || !mockDatabases[currentDbName].tables[tableName]) {
            console.warn(`Mock DB [${currentDbName}] getAllAsync: No table found or no data for table ${tableName} for SQL: ${sql}`);
            return [];
        }
        let tableData = mockDatabases[currentDbName].tables[tableName];
        // console.log(`Mock DB [${currentDbName}] getAllAsync: Table ${tableName} data BEFORE filter for SQL "${sql}" PARAMS ${JSON.stringify(params)}:`, JSON.stringify(tableData));

        // --- Integrated filtering logic from applyBasicWhere ---
        let filtered = [...tableData]; // Start with a shallow copy
        const whereMatch = sql.match(/WHERE\s+(.*)/i);
        let paramIndex = 0;

        if (whereMatch && whereMatch[1]) {
            const conditionsStrFull = whereMatch[1].split(/ORDER BY|GROUP BY|LIMIT/)[0].trim();

            if (conditionsStrFull.toUpperCase() === "USER_ID IS NULL OR USER_ID = ?") {
                // console.log(`getAllAsync direct: Matched specific OR case for user_id. Params: ${JSON.stringify(params)}, current paramIndex: ${paramIndex}`);
                if (params.length > paramIndex) {
                    const userIdParam = params[paramIndex];
                    filtered = tableData.filter(row => {
                        const isNull = row.user_id === null || row.user_id === undefined;
                        const userIdMatch = String(row.user_id) === String(userIdParam);
                        return isNull || userIdMatch;
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

                    if (cond.toUpperCase().endsWith("IS NULL")) {
                        const rawColName = cond.substring(0, cond.length - "IS NULL".length).trim();
                        const colName = extractColumnName(rawColName);
                        filtered = filtered.filter(row => row[colName] === null || row[colName] === undefined);
                    } else if (cond.toUpperCase().endsWith("IS NOT NULL")) {
                        const rawColName = cond.substring(0, cond.length - "IS NOT NULL".length).trim();
                        const colName = extractColumnName(rawColName);
                        filtered = filtered.filter(row => row[colName] !== null && row[colName] !== undefined);
                    } else if (cond.includes("= ?")) {
                        const rawColName = cond.split(" = ?")[0].trim();
                        const colName = extractColumnName(rawColName);
                        if (paramIndex < params.length) {
                            filtered = filtered.filter(row => String(row[colName]) === String(params[paramIndex]));
                            paramIndex++;
                        } else {
                             console.warn(`Mock DB getAllAsync: Not enough params for condition: ${cond}. ParamIndex: ${paramIndex}, Params: ${JSON.stringify(params)}`);
                             filtered = [];
                        }
                    } else if (cond.includes("LIKE ?")) {
                         const rawColName = cond.split(" LIKE ?")[0].trim();
                         const colName = extractColumnName(rawColName);
                         if (paramIndex < params.length) {
                            const searchPattern = String(params[paramIndex]);
                            let regexPattern = searchPattern.replace(/%/g, '.*');
                            if (searchPattern.startsWith('%') && searchPattern.endsWith('%') && searchPattern.length > 1) {
                                regexPattern = searchPattern.substring(1, searchPattern.length -1);
                            } else if (searchPattern.startsWith('%') && searchPattern.length > 0) {
                                regexPattern = searchPattern.substring(1) + '$';
                            } else if (searchPattern.endsWith('%') && searchPattern.length > 0) {
                                regexPattern = '^' + searchPattern.substring(0, searchPattern.length-1);
                            } else {
                                regexPattern = '^' + regexPattern + '$';
                            }
                            try {
                                const regex = new RegExp(regexPattern, 'i');
                                filtered = filtered.filter(row => regex.test(String(row[colName])));
                            } catch (e) { console.warn("Mock LIKE regex error", e, "Pattern:", regexPattern); }
                            paramIndex++;
                         } else {
                            console.warn(`Mock DB getAllAsync: Not enough params for LIKE condition: ${cond}. ParamIndex: ${paramIndex}, Params: ${JSON.stringify(params)}`);
                            filtered = [];
                         }
                    } else if (cond.includes("OR")) {
                         console.warn(`Mock DB getAllAsync: Generic OR condition processing after AND split might be incomplete: ${cond}`);
                         const orParts = cond.split(/\s+OR\s+/i).map(p => p.replace(/[()]/g, "").trim());
                         const originalCurrentFiltered = [...filtered];
                         let orCombinedResults = [];
                         let orMatchedOnce = false;
                         for(const orPart of orParts) {
                            let tempPartFiltered = [...originalCurrentFiltered];
                            if (orPart.toUpperCase().endsWith("IS NULL")) {
                                const rawColName = orPart.substring(0, orPart.length - "IS NULL".length).trim();
                                const colName = extractColumnName(rawColName);
                                tempPartFiltered = tempPartFiltered.filter(row => row[colName] === null || row[colName] === undefined);
                            } else if (orPart.includes("= ?")) {
                                const rawColName = orPart.split(" = ?")[0].trim();
                                const colName = extractColumnName(rawColName);
                                 if (paramIndex < params.length) {
                                    tempPartFiltered = tempPartFiltered.filter(row => String(row[colName]) === String(params[paramIndex]));
                                } else { tempPartFiltered = []; }
                            } else {
                                console.warn(`Mock DB getAllAsync: Unsupported OR part: ${orPart}`);
                                tempPartFiltered = [];
                            }
                            orCombinedResults.push(...tempPartFiltered);
                            if(tempPartFiltered.length > 0) orMatchedOnce = true;
                         }
                         if(orMatchedOnce && orParts.some(p => p.includes("= ?"))) paramIndex++;
                         filtered = orCombinedResults.filter((v, i, a) => a.findIndex(t => JSON.stringify(t) === JSON.stringify(v)) === i);
                    } else {
                        console.warn(`Mock DB getAllAsync: Unknown condition type: ${cond}`);
                    }
                });
            }
        }
        // --- End of integrated filtering logic ---

        // console.log(`Mock DB [${currentDbName}] getAllAsync: Table ${tableName} data AFTER filter for SQL "${sql}":`, JSON.stringify(filtered));
        return filtered.map(row => JSON.parse(JSON.stringify(row))); // Always return a deep copy
      }),
      runAsync: jest.fn(async (sql, params = []) => {
        console.log(`Mock DB [${currentDbName}] runAsync: SQL: ${sql} Params: ${JSON.stringify(params)}`);
        if (!mockDatabases[currentDbName]) {
            console.error(`Mock DB [${currentDbName}]: database not initialized for runAsync. SQL: ${sql}`);
            return { changes: 0, lastInsertRowId: undefined };
        }
        const insertTableName = extractTableName(sql, "INSERT INTO");
        const updateTableName = extractTableName(sql, "UPDATE");
        const deleteTableName = extractTableName(sql, "DELETE FROM");
        const currentOperationTableName = insertTableName || updateTableName || deleteTableName;

        if (!currentOperationTableName) {
            console.warn(`Mock DB [${currentDbName}]: Could not determine table for DML: ${sql}`);
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
                            } else {
                                newRowData[colName] = undefined;
                            }
                        } else if (valueToken.toUpperCase() === 'NULL') {
                            newRowData[colName] = null;
                        } else {
                            if (!isNaN(parseFloat(valueToken)) && isFinite(valueToken)) newRowData[colName] = parseFloat(valueToken);
                            else if ((valueToken.startsWith("'") && valueToken.endsWith("'")) || (valueToken.startsWith('"') && valueToken.endsWith('"'))) newRowData[colName] = valueToken.slice(1, -1);
                            else newRowData[colName] = valueToken;
                        }
                    }
                });
            } else if (columnsInSql.length === 0 && params.length > 0) {
                 console.warn(`Mock DB [${currentDbName}]: INSERT without explicit columns list for ${currentOperationTableName}. This is fragile. SQL: ${sql}`);
            } else if (columnsInSql.length > 0 && (!valuesClauseMatch || columnsInSql.length !== valuesClauseMatch[1].split(',').length)) {
                 console.warn(`Mock DB [${currentDbName}]: Column count in INSERT doesn't match VALUES count for ${currentOperationTableName}. SQL: ${sql}`);
            }

            if (!newRowData.hasOwnProperty('created_at') && columnsInSql.includes('created_at')) newRowData.created_at = new Date().toISOString();
            if (!newRowData.hasOwnProperty('updated_at') && columnsInSql.includes('updated_at')) newRowData.updated_at = new Date().toISOString();

            table.push(newRowData);
            console.log(`Mock DB [${currentDbName}] runAsync INSERT into ${currentOperationTableName}: Added row:`, JSON.stringify(newRowData));
            console.log(`Mock DB [${currentDbName}] runAsync INSERT into ${currentOperationTableName}: Table ${currentOperationTableName} state now:`, JSON.stringify(table));
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
                        } else if (whereClauseMatch[1].includes("uniqueId = ?") && row.uniqueId !== params[whereParamStartIndex]) {
                            matchesWhere = false;
                        }
                    }
                    if (matchesWhere) {
                        let updatedRow = { ...row };
                        setColumns.forEach((colName, index) => {
                            updatedRow[colName] = params[index];
                        });
                        if(updatedRow.hasOwnProperty('updated_at')) updatedRow.updated_at = new Date().toISOString();
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
                   const conditionsStr = whereMatch[1].trim().toUpperCase(); // Standardize for comparison
                   // Specific pattern for: DELETE FROM CaseTypes WHERE id = ? AND user_id = ?
                   if (conditionsStr === "ID = ? AND USER_ID = ?") {
                       if (params.length >= 2) {
                           // Keep if it's NOT (this specific ID AND this specific user_id)
                           return !(row.id === params[0] && row.user_id === params[1]);
                       }
                   }
                   // Specific pattern for: DELETE FROM CaseDocuments WHERE id = ?
                   else if (conditionsStr === "ID = ?") {
                        if (params.length >= 1) {
                            return row.id !== params[0]; // Keep if ID does not match
                        }
                   }
                   // Specific pattern for: DELETE FROM Cases WHERE id = ? AND user_id = ?
                   // (This is the same as CaseTypes, but explicit for clarity)
                   else if (conditionsStr === "ID = ? AND USER_ID = ?") { // Already covered, but good to be explicit
                        if (params.length >= 2) {
                            return !(row.id === params[0] && row.user_id === params[1]);
                        }
                   }
                   // Fallback for unhandled specific WHERE, log and keep
                   else {
                        console.warn(`Mock DB runAsync DELETE: Unhandled WHERE clause structure: "${conditionsStr}" in SQL: ${sql}. Row will be kept.`);
                        return true;
                   }
               }
               // If no WHERE clause, or unhandled, keep the row (safer than deleting everything)
               // Although SQL standard without WHERE means delete all, for mock safety, we'll be conservative.
               console.warn(`Mock DB runAsync DELETE: No WHERE clause or unhandled structure in SQL: ${sql}. No rows deleted by default.`);
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
      onTransactionAsync: jest.fn(async (asyncFunc, readOnly) => {
        const mockTx = {
          executeSqlAsync: jest.fn(async (sql, params) => {
            const upperSql = sql.toUpperCase();
            if (upperSql.startsWith('SELECT')) {
                const firstRow = await dbOperations.getFirstAsync(sql, params);
                if (upperSql.includes("COUNT(*)") || (firstRow && !sql.match(/LIMIT\s+(0|([2-9]\d*)|([1-9]\d{1,}))$/i))) {
                     return { rows: firstRow ? [firstRow] : [], rowsAffected: 0, insertId: undefined };
                }
                const allRows = await dbOperations.getAllAsync(sql, params);
                return { rows: allRows, rowsAffected: 0, insertId: undefined };
            } else if (upperSql.startsWith('INSERT') || upperSql.startsWith('UPDATE') || upperSql.startsWith('DELETE')) {
              const result = await dbOperations.runAsync(sql, params);
              return { rows: [], rowsAffected: result.changes, insertId: result.lastInsertRowId };
            } else {
              const ddlResults = await dbOperations.execAsync(sql);
              return ddlResults[0] || { rows: [], rowsAffected: 0, insertId: undefined };
            }
          }),
        };
        try {
          const result = await asyncFunc(mockTx);
          return result;
        } catch (error) {
          throw error;
        }
      }),
    };
    return dbOperations;
  }),
};

const extractTableName = (sql, operation) => {
  let regex;
  // Prioritize operation for INSERT/UPDATE/DELETE to avoid catching table names in subqueries or complex SELECTs
  if (operation.toUpperCase() === "INSERT INTO" || operation.toUpperCase() === "UPDATE" || operation.toUpperCase() === "DELETE FROM") {
    regex = new RegExp(`${operation}\\s+("?\`?\\w+\`?"?\\.)?("?\`?\\w+\`?"?)`, "i");
  } else if (operation.toUpperCase() === "SELECT") {
    // For SELECT, find the first table after FROM, ignoring potential JOINs for simplicity in this basic extractor
    // This will pick the first table in a FROM clause, e.g., FROM TableA or FROM Cases c
    const fromMatch = sql.match(/FROM\s+("?\`?\w+\`?"?\.)?("?\`?\w+\`?"?)/i);
    if (fromMatch) {
      return (fromMatch[2] || fromMatch[1])?.replace(/["\`]/g, '');
    }
    // Fallback if FROM is not immediately helpful (e.g. complex JOINs starting first)
    // This is less precise and might need refinement for very complex queries.
    regex = /(?:FROM|JOIN)\s+("?\`?\w+\`?"?\.)?("?\`?\w+\`?"?)/i;
  } else { // Default or other operations
    regex = new RegExp(`${operation}\\s+("?\`?\\w+\`?"?\\.)?("?\`?\w+\`?"?)`, "i");
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
mockSQLiteAPI.__printMockDb = (dbName) => {
    // console.log(`Mock DB [${dbName}] state:`, JSON.stringify(mockDatabases[dbName], null, 2));
};

module.exports = mockSQLiteAPI;
