let mockDatabases = {};

const extractTableName = (sql, operation) => {
  const cleanName = (s) => (s || "").replace(/["`]/g, "").replace(/`/g, "");

  if (operation.toUpperCase() === "SELECT") {
    // Match: FROM <optional-schema.><table-name>
    // table name can be unquoted, double-quoted, or backtick-quoted
    const fromMatch = sql.match(
      /FROM\s+(?:"?`?(\w+)`?"?\.)?"?`?(\w+)`?"?(?:\s|$)/i
    );
    if (fromMatch) {
      return cleanName(fromMatch[2] || fromMatch[1]);
    }
    return null;
  }

  // For INSERT INTO, UPDATE, DELETE FROM – use dynamic RegExp
  const opEscaped = operation.replace(/\s+/g, "\\s+");
  const regex = new RegExp(
    `${opEscaped}\\s+(?:"?\`?(\\w+)\`?"?\\.)?(?:"?\`?(\\w+)\`?"?)`,
    "i"
  );
  const match = sql.match(regex);
  return match ? cleanName(match[2] || match[1]) : null;
};

const getFirstSyncInternal = (
  currentDbName,
  sql,
  params = [],
  skipRun = false
) => {
  if (!mockDatabases[currentDbName]) return null;

  if (
    !skipRun &&
    (sql.toUpperCase().includes("INSERT INTO") ||
      sql.toUpperCase().includes("UPDATE") ||
      sql.toUpperCase().includes("DELETE FROM"))
  ) {
    const runResult = runSyncInternal(currentDbName, sql, params);
    if (sql.toUpperCase().includes("RETURNING")) {
      return { id: runResult.lastInsertRowId };
    }
  }

  const tableName = extractTableName(sql, "SELECT");
  if (!tableName || !mockDatabases[currentDbName].tables[tableName]) {
    if (sql.toUpperCase().includes("COUNT(*)")) return { "COUNT(*)": 0 };
    if (sql.toUpperCase().includes("SUM("))
      return { totalCollected: 0, totalRemaining: 0, totalAgreed: 0 };
    console.log(
      "TABLE NOT FOUND in getFirstSyncInternal. tableName:",
      tableName,
      "Available tables:",
      Object.keys(mockDatabases[currentDbName]?.tables || {})
    );
    return null;
  }

  const tableData = mockDatabases[currentDbName].tables[tableName];
  console.log(
    `QUERY FOR [${tableName}], DATA IN MOCK DB:`,
    tableData,
    "PARAMS:",
    params
  );
  let filtered = [...tableData];
  const whereMatch = sql.match(/WHERE\s+(.*)/i);
  let paramIndex = 0;

  if (whereMatch && whereMatch[1]) {
    const conditionsStrFull = whereMatch[1]
      .split(/ORDER BY|GROUP BY|LIMIT/)[0]
      .trim();
    const conditions = conditionsStrFull.split(/\s+AND\s+/i);
    conditions.forEach((condString) => {
      const cond = condString.trim();
      const extractColumnName = (conditionFragment) => {
        const match = conditionFragment.match(/(?:(\w+)\.)?(\w+)/);
        return match ? match[2] : conditionFragment;
      };

      if (cond.includes("= ?")) {
        const rawColName = cond.split(" = ?")[0].trim();
        const colName = extractColumnName(rawColName);
        if (paramIndex < params.length) {
          filtered = filtered.filter(
            (row) => String(row[colName]) === String(params[paramIndex])
          );
          paramIndex++;
        }
      } else if (cond.includes("=")) {
        const [rawColName, rawVal] = cond.split("=").map((s) => s.trim());
        const colName = extractColumnName(rawColName);
        const cleanVal = rawVal.replace(/['"]/g, "");
        filtered = filtered.filter(
          (row) => String(row[colName]) === cleanVal
        );
      }
    });
  }

  if (sql.toUpperCase().includes("COUNT(*)")) {
    return { count: filtered.length, "COUNT(*)": filtered.length };
  }

  if (sql.toUpperCase().includes("SUM(")) {
    console.log("=== SUM QUERY DEBUG ===");
    console.log("currentDbName:", currentDbName);
    console.log("tableName:", tableName);
    console.log("tableData:", tableData);
    console.log("filtered:", filtered);
    console.log("params:", params);
    let totalCollected = 0;
    let totalRemaining = 0;
    let totalAgreed = 0;
    filtered.forEach((row) => {
      const feePaid = parseFloat(row.fee_paid || 0);
      const totalFee = parseFloat(row.total_fee || 0);
      totalCollected += feePaid;
      totalAgreed += totalFee;
      if (totalFee > feePaid) {
        totalRemaining += totalFee - feePaid;
      }
    });
    console.log("CALCULATED SUM RESULT:", {
      totalCollected,
      totalRemaining,
      totalAgreed,
    });
    return { totalCollected, totalRemaining, totalAgreed };
  }

  const resultRow = filtered[0] || null;
  console.log(
    "GET FIRST SYNC RESULT ROW FOR SQL:",
    sql,
    "PARAMS:",
    params,
    "RESULT:",
    resultRow
  );
  return resultRow ? JSON.parse(JSON.stringify(resultRow)) : null;
};

const getAllSyncInternal = (
  currentDbName,
  sql,
  params = [],
  skipRun = false
) => {
  if (!mockDatabases[currentDbName]) {
    return [];
  }

  if (
    !skipRun &&
    (sql.toUpperCase().includes("INSERT INTO") ||
      sql.toUpperCase().includes("UPDATE") ||
      sql.toUpperCase().includes("DELETE FROM"))
  ) {
    const runResult = runSyncInternal(currentDbName, sql, params);
    if (sql.toUpperCase().includes("RETURNING")) {
      return [{ id: runResult.lastInsertRowId }];
    }
  }

  const tableName = extractTableName(sql, "SELECT");
  if (!tableName || !mockDatabases[currentDbName].tables[tableName]) {
    return [];
  }
  const tableData = mockDatabases[currentDbName].tables[tableName];
  let filtered = [...tableData];
  const whereMatch = sql.match(/WHERE\s+(.*)/i);
  let paramIndex = 0;

  if (whereMatch && whereMatch[1]) {
    const conditionsStrFull = whereMatch[1]
      .split(/ORDER BY|GROUP BY|LIMIT/)[0]
      .trim();
    if (conditionsStrFull.toUpperCase() === "USER_ID IS NULL OR USER_ID = ?") {
      if (params.length > paramIndex) {
        const userIdParam = params[paramIndex];
        filtered = tableData.filter((row) => {
          return (
            row.user_id === null ||
            row.user_id === undefined ||
            String(row.user_id) === String(userIdParam)
          );
        });
        paramIndex++;
      } else {
        filtered = tableData.filter(
          (row) => row.user_id === null || row.user_id === undefined
        );
      }
    } else {
      const conditions = conditionsStrFull.split(/\s+AND\s+/i);
      conditions.forEach((condString) => {
        const cond = condString.trim();
        const extractColumnName = (conditionFragment) => {
          const match = conditionFragment.match(/(?:(\w+)\.)?(\w+)/);
          return match ? match[2] : conditionFragment;
        };

        if (cond.includes("= ?")) {
          const rawColName = cond.split(" = ?")[0].trim();
          const colName = extractColumnName(rawColName);
          if (paramIndex < params.length) {
            filtered = filtered.filter(
              (row) => String(row[colName]) === String(params[paramIndex])
            );
            paramIndex++;
          }
        }
      });
    }
  }
  return filtered.map((row) => JSON.parse(JSON.stringify(row)));
};

const runSyncInternal = (currentDbName, sql, params = []) => {
  if (!mockDatabases[currentDbName]) {
    return { changes: 0, lastInsertRowId: undefined };
  }
  const insertTableName = extractTableName(sql, "INSERT INTO");
  const updateTableName = extractTableName(sql, "UPDATE");
  const deleteTableName = extractTableName(sql, "DELETE FROM");
  const currentOperationTableName =
    insertTableName || updateTableName || deleteTableName;

  if (!currentOperationTableName) {
    return { changes: 0, lastInsertRowId: undefined };
  }
  if (!mockDatabases[currentDbName].tables[currentOperationTableName]) {
    if (insertTableName)
      mockDatabases[currentDbName].tables[currentOperationTableName] = [];
    else return { changes: 0, lastInsertRowId: undefined };
  }

  let changes = 0;
  let lastInsertRowId = undefined;
  const table = mockDatabases[currentDbName].tables[currentOperationTableName];

  if (insertTableName) {
    console.log("MOCK INSERT SQL:", sql, "PARAMS:", params);
    const maxId =
      table.length > 0 ? Math.max(0, ...table.map((r) => r.id || 0)) : 0;
    lastInsertRowId = maxId + 1;

    const newRowData = { id: lastInsertRowId };
    const columnsMatch = sql.match(/INSERT INTO\s+["`]?\w+["`]?\s*\((.*?)\)/i);
    let columnsInSql = [];
    if (columnsMatch && columnsMatch[1]) {
      columnsInSql = columnsMatch[1]
        .split(",")
        .map((c) => c.trim().replace(/["`]/g, ""));
    }

    const valuesClauseMatch = sql.match(/VALUES\s*\((.*?)\)/i);
    if (columnsInSql.length > 0 && valuesClauseMatch && valuesClauseMatch[1]) {
      const parseSqlValues = (str) => {
        const tokens = [];
        let current = "";
        let inQuotes = false;
        let quoteChar = "";
        let parenDepth = 0;
        for (let i = 0; i < str.length; i++) {
          const ch = str[i];
          if ((ch === "'" || ch === '"') && !inQuotes) {
            inQuotes = true;
            quoteChar = ch;
            current += ch;
          } else if (ch === quoteChar && inQuotes) {
            inQuotes = false;
            quoteChar = "";
            current += ch;
          } else if (ch === "(" && !inQuotes) {
            parenDepth++;
            current += ch;
          } else if (ch === ")" && !inQuotes) {
            parenDepth--;
            current += ch;
          } else if (ch === "," && !inQuotes && parenDepth === 0) {
            tokens.push(current.trim());
            current = "";
          } else {
            current += ch;
          }
        }
        if (current.trim()) tokens.push(current.trim());
        return tokens;
      };
      const valuesInSqlString = parseSqlValues(valuesClauseMatch[1]);
      let paramIndex = 0;
      columnsInSql.forEach((colName, colIdx) => {
        if (colIdx < valuesInSqlString.length) {
          const valueToken = valuesInSqlString[colIdx];
          if (valueToken === "?") {
            if (paramIndex < params.length) {
              const val = params[paramIndex++];
              if (colName === "id" && (val === null || val === undefined)) {
                newRowData["id"] = lastInsertRowId;
              } else {
                newRowData[colName] = val;
              }
            }
          } else if (valueToken.toLowerCase() === "null") {
            if (colName === "id") {
              newRowData["id"] = lastInsertRowId;
            } else {
              newRowData[colName] = null;
            }
          } else {
            newRowData[colName] = valueToken.replace(/['"]/g, "");
          }
        }
      });
    }
    table.push(newRowData);
    console.log("MOCK INSERTED ROW DATA:", newRowData);
    changes = 1;
  } else if (updateTableName) {
    const setClauseMatch =
      sql.match(/SET\s+(.*?)\s+WHERE/i) || sql.match(/SET\s+(.*?)$/i);
    if (setClauseMatch && setClauseMatch[1]) {
      const setAssignmentsText = setClauseMatch[1]
        .split(",")
        .map((s) => s.trim());
      // Only count assignments that use ? as a placeholder (ignore literals like STRFTIME(...))
      const parameterizedAssignments = setAssignmentsText.filter((s) =>
        /=\s*\?/.test(s)
      );
      const literalAssignments = setAssignmentsText.filter(
        (s) => !/=\s*\?/.test(s) && /=/.test(s)
      );
      const paramCols = parameterizedAssignments.map((s) =>
        s.split("=")[0].trim().replace(/["`]/g, "")
      );
      const whereParamStartIndex = paramCols.length;
      let affectedRows = 0;
      mockDatabases[currentDbName].tables[currentOperationTableName] =
        table.map((row) => {
          let matchesWhere = true;
          const whereClauseMatch = sql.match(/WHERE\s+(.*)/i);
          if (whereClauseMatch && whereClauseMatch[1].trim() !== "") {
            const whereCond = whereClauseMatch[1].trim();
            if (/\bid\s*=\s*\?/i.test(whereCond)) {
              matchesWhere =
                String(row.id) === String(params[whereParamStartIndex]);
            } else if (/\bis_read\s*=\s*0/i.test(whereCond)) {
              matchesWhere = row.is_read === 0 || row.is_read === "0";
            }
          }
          if (matchesWhere) {
            const updatedRow = { ...row };
            paramCols.forEach((colName, index) => {
              updatedRow[colName] = params[index];
            });
            literalAssignments.forEach((assignStr) => {
              const [col, val] = assignStr.split("=").map((s) => s.trim());
              const cleanCol = col.replace(/["`]/g, "");
              const cleanVal = val.replace(/['"]/g, "");
              updatedRow[cleanCol] = isNaN(Number(cleanVal))
                ? cleanVal
                : Number(cleanVal);
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
    const whereMatch = sql.match(/WHERE\s+(.*)/i);
    let rowsToKeep = [];
    if (whereMatch && whereMatch[1]) {
      const conditionsStr = whereMatch[1].trim().toUpperCase();
      if (conditionsStr === "ID = ?") {
        if (params.length >= 1) {
          rowsToKeep = table.filter((row) => row.id !== params[0]);
        }
      } else if (conditionsStr.includes("<")) {
        rowsToKeep = [...table];
      }
    } else {
      rowsToKeep = [];
    }
    mockDatabases[currentDbName].tables[currentOperationTableName] = rowsToKeep;
    changes = initialLength - rowsToKeep.length;
  }
  return { changes, lastInsertRowId };
};

const mockSQLiteAPI = {
  openDatabaseAsync: jest.fn(async (name, options) => {
    const currentDbName = name;

    if (!mockDatabases[currentDbName]) {
      mockDatabases[currentDbName] = { tables: {}, foreignKeysEnabled: false };
    }

    const dbOperations = {
      _name: currentDbName,
      execAsync: jest.fn(async (source) => {
        if (!mockDatabases[currentDbName]) {
          console.error(`Mock DB [${currentDbName}] not found in execAsync!`);
          return [];
        }
        const commands = source.split(";").filter((cmd) => cmd.trim() !== "");
        const results = [];
        for (const cmd of commands) {
          const cmdNorm = cmd.trim().toUpperCase();
          if (cmdNorm.startsWith("CREATE TABLE IF NOT EXISTS")) {
            const tableNameMatch = cmd.match(
              /CREATE TABLE IF NOT EXISTS\s+(\w+)/i
            );
            if (tableNameMatch && tableNameMatch[1]) {
              const tableName = tableNameMatch[1];
              if (!mockDatabases[currentDbName].tables[tableName]) {
                mockDatabases[currentDbName].tables[tableName] = [];
                console.log(
                  `MOCK: Created table [${tableName}] in [${currentDbName}]`
                );
              }
            }
          } else if (
            cmdNorm.startsWith("CREATE TRIGGER") ||
            cmdNorm.startsWith("CREATE INDEX") ||
            cmdNorm.startsWith("ALTER TABLE")
          ) {
            // Silently ignored
          } else if (
            cmdNorm.startsWith("PRAGMA FOREIGN_KEYS = ON") ||
            cmdNorm.includes("PRAGMA FOREIGN_KEYS=ON")
          ) {
            mockDatabases[currentDbName].foreignKeysEnabled = true;
          }
          results.push({ rowsAffected: 0, insertId: undefined, rows: [] });
        }
        return results;
      }),
      getFirstAsync: jest.fn(async (sql, params = []) => {
        return getFirstSyncInternal(currentDbName, sql, params);
      }),
      getAllAsync: jest.fn(async (sql, params = []) => {
        return getAllSyncInternal(currentDbName, sql, params);
      }),
      runAsync: jest.fn(async (sql, params = []) => {
        return runSyncInternal(currentDbName, sql, params);
      }),
      prepareAsync: jest.fn(async (sql) => {
        const prepObj = dbOperations.prepareSync(sql);
        return {
          ...prepObj,
          executeAsync: jest.fn(async (params = []) =>
            prepObj.executeSync(params)
          ),
          executeForRawResultAsync: jest.fn(async (params = []) =>
            prepObj.executeForRawResultSync(params)
          ),
          finalizeAsync: jest.fn(async () => {}),
        };
      }),
      prepareSync: jest.fn((sql) => {
        return {
          executeSync: jest.fn((params = []) => {
            console.log("PREPARE EXECUTE SQL:", sql, "PARAMS:", params);
            const runResult = runSyncInternal(currentDbName, sql, params);
            return {
              changes: runResult.changes,
              lastInsertRowId: runResult.lastInsertRowId,
              getAllSync: () => {
                if (sql.toUpperCase().includes("RETURNING")) {
                  return [{ id: runResult.lastInsertRowId }];
                }
                return getAllSyncInternal(currentDbName, sql, params, true);
              },
              getFirstSync: () => {
                if (sql.toUpperCase().includes("RETURNING")) {
                  return { id: runResult.lastInsertRowId };
                }
                return getFirstSyncInternal(currentDbName, sql, params, true);
              },
            };
          }),
          executeForRawResultSync: jest.fn((params = []) => {
            const rows = getAllSyncInternal(currentDbName, sql, params);
            const rawRows = rows.map((row) => Object.values(row));
            return {
              getAllSync: () => rawRows,
            };
          }),
          finalizeSync: jest.fn(() => {}),
        };
      }),
      closeAsync: jest.fn(async () => {}),
      withTransactionAsync: jest.fn(async (callback) => {
        return callback();
      }),
      deleteAsync: jest.fn(async () => {
        delete mockDatabases[currentDbName];
      }),
    };
    return dbOperations;
  }),
};

mockSQLiteAPI.__resetAllMockDatabases = () => {
  mockDatabases = {};
};
mockSQLiteAPI.__getMockDbData = (dbName, tableName) => {
  if (!mockDatabases[dbName] || !mockDatabases[dbName].tables[tableName])
    return [];
  return JSON.parse(JSON.stringify(mockDatabases[dbName].tables[tableName]));
};

module.exports = mockSQLiteAPI;
