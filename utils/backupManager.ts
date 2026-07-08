import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as SQLite from 'expo-sqlite';
import { getDb, resetDbInstance, __TEST_ONLY_resetDbInstance } from '../DataBase/connection';
import { Alert, Platform, DevSettings } from 'react-native';
import { getCurrentUserId } from './commonFunctions';
import { reScheduleAllNotifications } from './notificationScheduler';

/**
 * Copies the local SQLite database file to a temporary location and opens the
 * native share sheet. This allows the user to save the backup directly to their
 * Google Drive, iCloud, local files, or send it via email/messages.
 */
export const exportDatabaseBackup = async (): Promise<void> => {
  const dbUri = FileSystem.documentDirectory + 'SQLite/CaseDiary.db';
  try {
    const fileInfo = await FileSystem.getInfoAsync(dbUri);
    if (!fileInfo.exists) {
      throw new Error("Database file does not exist yet. Please add a case first.");
    }
    
    const timestamp = new Date().toISOString().slice(0, 10);
    const backupName = `CaseDiary_Backup_${timestamp}.db`;
    const tempBackupUri = FileSystem.cacheDirectory + backupName;
    
    // Copy database file to temporary cache directory for sharing
    await FileSystem.copyAsync({
      from: dbUri,
      to: tempBackupUri
    });
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(tempBackupUri, {
        mimeType: 'application/x-sqlite3',
        dialogTitle: 'Save Backup File (e.g. to Google Drive)',
        UTI: 'public.database',
      });
    } else {
      throw new Error("Sharing options are not available on this device.");
    }
  } catch (error) {
    console.error("Database backup failed:", error);
    throw error;
  }
};

/**
 * Restores a standard SQLite database file picked by the user and reloads the application.
 */
export const importDatabaseBackup = async (): Promise<void> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/x-sqlite3', 'application/octet-stream'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    const selectedFileUri = result.assets[0].uri;
    const dbDir = FileSystem.documentDirectory + 'SQLite/';
    const dbPath = dbDir + 'CaseDiary.db';

    const dirInfo = await FileSystem.getInfoAsync(dbDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
    }

    // Reset active SQLite connection instance
    await __TEST_ONLY_resetDbInstance();

    // Overwrite active database file
    await FileSystem.copyAsync({
      from: selectedFileUri,
      to: dbPath,
    });

    Alert.alert(
      "Restore Successful",
      "Your database has been restored successfully. The app will reload now to apply changes.",
      [
        {
          text: "OK",
          onPress: () => {
            if (Platform.OS !== 'web') {
              DevSettings.reload();
            }
          }
        }
      ]
    );
  } catch (error: any) {
    console.error("Database restore failed:", error);
    Alert.alert("Restore Error", error.message || "Failed to restore database backup.");
  }
};

/**
 * Zero-dependency RFC 4180 compliant CSV parser.
 */
export const parseCSV = (text: string): string[][] => {
  const result: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let entry = "";
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        entry += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(entry.trim());
      entry = "";
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
      }
      row.push(entry.trim());
      result.push(row);
      row = [];
      entry = "";
    } else {
      entry += char;
    }
  }
  if (entry || row.length > 0) {
    row.push(entry.trim());
    result.push(row);
  }
  return result.filter(r => r.length > 0 && r.some(cell => cell !== ""));
};

export interface DuplicateCasePair {
  case1: any;
  case2: any;
}

/**
 * Scans the database for potential duplicate cases:
 * Matches on CNRNumber OR (case_number AND court_name)
 */
export const findDuplicatesInDatabase = async (): Promise<DuplicateCasePair[]> => {
  const db = await getDb();
  
  // Find cases with duplicate CNRNumbers
  const cnrQuery = `
    SELECT c1.*, ps1.name as policeStationName, d1.name as districtName
    FROM Cases c1
    LEFT JOIN PoliceStations ps1 ON c1.police_station_id = ps1.id
    LEFT JOIN Districts d1 ON ps1.district_id = d1.id
    WHERE c1.CNRNumber IS NOT NULL AND c1.CNRNumber != '' AND c1.CNRNumber != 'N/A'
      AND c1.CNRNumber IN (
        SELECT CNRNumber FROM Cases 
        WHERE CNRNumber IS NOT NULL AND CNRNumber != '' AND CNRNumber != 'N/A'
        GROUP BY CNRNumber HAVING COUNT(*) > 1
      )
    ORDER BY c1.CNRNumber ASC, c1.id ASC
  `;
  
  // Find cases with duplicate case_number + court_name combinations
  const numCourtQuery = `
    SELECT c1.*, ps1.name as policeStationName, d1.name as districtName
    FROM Cases c1
    LEFT JOIN PoliceStations ps1 ON c1.police_station_id = ps1.id
    LEFT JOIN Districts d1 ON ps1.district_id = d1.id
    WHERE c1.case_number IS NOT NULL AND c1.case_number != '' AND c1.case_number != 'N/A'
      AND c1.court_name IS NOT NULL AND c1.court_name != '' AND c1.court_name != 'N/A'
      AND (c1.case_number || '|||' || c1.court_name) IN (
        SELECT case_number || '|||' || court_name FROM Cases 
        WHERE case_number IS NOT NULL AND case_number != '' AND case_number != 'N/A'
          AND court_name IS NOT NULL AND court_name != '' AND court_name != 'N/A'
        GROUP BY case_number, court_name HAVING COUNT(*) > 1
      )
    ORDER BY c1.case_number ASC, c1.court_name ASC, c1.id ASC
  `;

  try {
    const cnrCases = await db.getAllAsync<any>(cnrQuery);
    const numCourtCases = await db.getAllAsync<any>(numCourtQuery);

    const pairs: DuplicateCasePair[] = [];
    const processedIds = new Set<number>();

    const processGroup = (casesList: any[], keyFn: (c: any) => string) => {
      const groups: { [key: string]: any[] } = {};
      casesList.forEach(c => {
        const key = keyFn(c).toLowerCase().trim();
        if (!groups[key]) groups[key] = [];
        groups[key].push(c);
      });

      Object.values(groups).forEach(group => {
        if (group.length < 2) return;
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            const id1 = group[i].id;
            const id2 = group[j].id;
            const pairKey = `${Math.min(id1, id2)}-${Math.max(id1, id2)}`;
            if (!processedIds.has(id1) || !processedIds.has(id2)) {
              pairs.push({
                case1: group[i],
                case2: group[j]
              });
              processedIds.add(id1);
              processedIds.add(id2);
            }
          }
        }
      });
    };

    processGroup(cnrCases, c => c.CNRNumber);
    processGroup(numCourtCases, c => `${c.case_number}|||${c.court_name}`);

    return pairs;
  } catch (error) {
    console.error("Error finding duplicate cases in database:", error);
    return [];
  }
};

/**
 * Inserts parsed and mapped cases into the database inside a transaction.
 */
export const bulkInsertCases = async (
  cases: any[],
  userId?: number | null,
  onProgress?: (current: number, total: number) => void
): Promise<number> => {
  const db = await getDb();
  let insertCount = 0;
  const total = cases.length;

  // Run in a single transaction
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < total; i++) {
      const c = cases[i];
      const uniqueId = c.uniqueId || `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      let policeStationId: number | null = null;
      if (c.policeStationName && c.policeStationName.trim() !== "") {
        const psName = c.policeStationName.trim();
        // Check if police station exists, or create it
        const ps = await db.getFirstAsync<{ id: number }>(
          "SELECT id FROM PoliceStations WHERE LOWER(name) = LOWER(?)",
          [psName]
        );
        if (ps) {
          policeStationId = ps.id;
        } else {
          const res = await db.runAsync(
            "INSERT OR IGNORE INTO PoliceStations (name, user_id) VALUES (?, ?)",
            [psName, userId ?? null]
          );
          policeStationId = res.lastInsertRowId;
        }
      }

      await db.runAsync(
        `INSERT INTO Cases (
          uniqueId, user_id, CaseTitle, ClientName, OnBehalfOf, CNRNumber,
          case_number, case_year, court_name, case_type_name, dateFiled,
          NextDate, PreviousDate, StatuteOfLimitations, crime_number, crime_year,
          police_station_id, Undersection, FirstParty, OppositeParty, Accussed,
          ClientContactNumber, JudgeName, OpposingCounsel, CaseStatus, Priority,
          CaseDescription, CaseNotes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uniqueId,
          userId ?? null,
          c.CaseTitle || (c.FirstParty && c.OppositeParty ? `${c.FirstParty} vs. ${c.OppositeParty}` : "Untitled Case"),
          c.ClientName || null,
          c.OnBehalfOf || null,
          c.CNRNumber || null,
          c.case_number || null,
          c.case_year ? parseInt(c.case_year.toString(), 10) : null,
          c.court_name || null,
          c.case_type_name || null,
          c.dateFiled || null,
          c.NextDate || null,
          c.PreviousDate || null,
          c.StatuteOfLimitations || null,
          c.crime_number || null,
          c.crime_year ? parseInt(c.crime_year.toString(), 10) : null,
          policeStationId,
          c.Undersection || null,
          c.FirstParty || null,
          c.OppositeParty || null,
          c.Accussed || null,
          c.ClientContactNumber || null,
          c.JudgeName || null,
          c.OpposingCounsel || null,
          c.CaseStatus || "Open",
          c.Priority || "Medium",
          c.CaseDescription || null,
          c.CaseNotes || null,
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );

      insertCount++;
      if (onProgress) {
        onProgress(insertCount, total);
      }
    }
  });

  return insertCount;
};

export interface BackupPreviewData {
  caseCount: number;
  timelineCount: number;
  previewCases: any[];
}

/**
 * Copies the picked .db backup to a temporary file, opens it, verifies the schema,
 * and fetches statistics and preview rows. Supports optional password for SQLCipher decryption.
 */
export const previewDatabaseBackup = async (fileUri: string, password?: string): Promise<BackupPreviewData> => {
  const tempDbPath = FileSystem.documentDirectory + 'SQLite/temp_import_preview.db';
  
  // Clean up any existing temp files first
  await FileSystem.deleteAsync(tempDbPath, { idempotent: true });
  await FileSystem.deleteAsync(tempDbPath + '-journal', { idempotent: true });
  await FileSystem.deleteAsync(tempDbPath + '-wal', { idempotent: true });
  await FileSystem.deleteAsync(tempDbPath + '-shm', { idempotent: true });

  // Copy the selected file to the temp database location
  await FileSystem.copyAsync({
    from: fileUri,
    to: tempDbPath
  });

  let tempDb: SQLite.SQLiteDatabase | null = null;
  try {
    tempDb = await SQLite.openDatabaseAsync('temp_import_preview.db');
    
    if (password) {
      await tempDb.execAsync(`PRAGMA key = '${password.replace(/'/g, "''")}';`);
    }

    // Verify if database can be read (throws if encrypted or invalid format)
    await tempDb.getFirstAsync("SELECT count(*) FROM sqlite_master;");

    // Check if table 'Cases' exists using sqlite_master
    const casesTableExists = await tempDb.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='Cases';"
    );
    
    if (!casesTableExists || casesTableExists.count === 0) {
      throw new Error("Invalid backup file: 'Cases' table not found.");
    }

    // Get Case count
    const caseCountRes = await tempDb.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM Cases;"
    );
    const caseCount = caseCountRes?.count ?? 0;

    // Get Timeline count (if table exists)
    let timelineCount = 0;
    const timelineTableExists = await tempDb.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='CaseTimeline';"
    );
    if (timelineTableExists && timelineTableExists.count > 0) {
      const timelineCountRes = await tempDb.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM CaseTimeline;"
      );
      timelineCount = timelineCountRes?.count ?? 0;
    }

    // Get preview cases (limit to 5)
    const previewCases = await tempDb.getAllAsync<any>(
      "SELECT id, CaseTitle, ClientName, NextDate, case_number, court_name FROM Cases LIMIT 5;"
    );

    return {
      caseCount,
      timelineCount,
      previewCases
    };
  } catch (error: any) {
    console.error("Error previewing database backup:", error);
    const msg = error.message || "";
    if (msg.includes("file is not a database") || msg.includes("malformed") || msg.includes("encrypted")) {
      if (!password) {
        throw new Error("DATABASE_ENCRYPTED");
      } else {
        throw new Error("INVALID_PASSWORD");
      }
    }
    throw new Error(error.message || "Failed to parse the backup database file.");
  } finally {
    if (tempDb) {
      try {
        await tempDb.closeAsync();
      } catch (err) {
        console.warn("Failed to close tempDb:", err);
      }
    }
  }
};

/**
 * Resets active DB connection, replaces current CaseDiary.db with the preview DB,
 * and recreates the connection and schedules notifications. Supports optional password decryption.
 */
export const replaceDatabaseBackup = async (password?: string): Promise<void> => {
  const dbDir = FileSystem.documentDirectory + 'SQLite/';
  const dbPath = dbDir + 'CaseDiary.db';
  const tempDbPath = dbDir + 'temp_import_preview.db';

  // 1. Reset active SQLite connection instance
  await resetDbInstance();

  // 2. Delete current database files to avoid WAL locks or corruption
  await FileSystem.deleteAsync(dbPath, { idempotent: true });
  await FileSystem.deleteAsync(dbPath + '-journal', { idempotent: true });
  await FileSystem.deleteAsync(dbPath + '-wal', { idempotent: true });
  await FileSystem.deleteAsync(dbPath + '-shm', { idempotent: true });

  const fileExists = await FileSystem.getInfoAsync(tempDbPath);
  if (!fileExists.exists) {
    throw new Error("Temporary preview database file not found.");
  }

  if (password) {
    // If encrypted, decrypt on-the-fly via SQLCipher export to CaseDiary.db
    let tempDb = await SQLite.openDatabaseAsync('temp_import_preview.db');
    try {
      await tempDb.execAsync(`PRAGMA key = '${password.replace(/'/g, "''")}';`);
      
      // Attach target database and export data unencrypted
      await tempDb.execAsync(`
        ATTACH DATABASE '${dbPath}' AS active_db KEY '';
        SELECT sqlcipher_export('active_db');
        DETACH DATABASE active_db;
      `);
    } finally {
      await tempDb.closeAsync();
    }
  } else {
    // If not encrypted, just copy file over
    await FileSystem.copyAsync({
      from: tempDbPath,
      to: dbPath,
    });
  }

  // Clean up temp DB
  await FileSystem.deleteAsync(tempDbPath, { idempotent: true });
  await FileSystem.deleteAsync(tempDbPath + '-journal', { idempotent: true });
  await FileSystem.deleteAsync(tempDbPath + '-wal', { idempotent: true });
  await FileSystem.deleteAsync(tempDbPath + '-shm', { idempotent: true });

  // 3. Re-open and verify the connection, then reschedule notifications
  try {
    await getDb();
    await reScheduleAllNotifications();
  } catch (err) {
    console.error("Error re-initializing database after restore:", err);
  }
};

/**
 * Merges cases, timeline hearings, and documents from temp_import_preview.db into CaseDiary.db,
 * skipping duplicate cases matching uniqueId or CNRNumber. Supports optional decryption password.
 */
export const mergeDatabaseBackup = async (password?: string): Promise<{ insertedCount: number }> => {
  const tempDbPath = FileSystem.documentDirectory + 'SQLite/temp_import_preview.db';
  const fileExists = await FileSystem.getInfoAsync(tempDbPath);
  if (!fileExists.exists) {
    throw new Error("Temporary preview database file not found.");
  }

  const db = await getDb();
  const userId = await getCurrentUserId();
  let insertedCount = 0;

  let tempDb: SQLite.SQLiteDatabase | null = null;
  try {
    tempDb = await SQLite.openDatabaseAsync('temp_import_preview.db');
    
    if (password) {
      await tempDb.execAsync(`PRAGMA key = '${password.replace(/'/g, "''")}';`);
    }

    // Verify if database can be read
    await tempDb.getFirstAsync("SELECT count(*) FROM sqlite_master;");

    // Check if police station table exists in temp DB to fetch station names
    const hasPoliceStation = await tempDb.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='PoliceStations';"
    );

    let casesQuery = "SELECT * FROM Cases;";
    if (hasPoliceStation && hasPoliceStation.count > 0) {
      casesQuery = `
        SELECT c.*, ps.name as policeStationName 
        FROM Cases c 
        LEFT JOIN PoliceStations ps ON c.police_station_id = ps.id;
      `;
    }

    const backupCases = await tempDb.getAllAsync<any>(casesQuery);

    // Run merge inside a transaction on the active database
    await db.withTransactionAsync(async () => {
      for (const c of backupCases) {
        let exists = false;
        
        if (c.uniqueId) {
          const match = await db.getFirstAsync<{ id: number }>(
            "SELECT id FROM Cases WHERE uniqueId = ?",
            [c.uniqueId]
          );
          if (match) exists = true;
        }

        if (!exists && c.CNRNumber && c.CNRNumber.trim() !== "" && c.CNRNumber.trim() !== "N/A") {
          const match = await db.getFirstAsync<{ id: number }>(
            "SELECT id FROM Cases WHERE CNRNumber = ?",
            [c.CNRNumber.trim()]
          );
          if (match) exists = true;
        }

        // If case already exists, we skip it to prevent duplicates
        if (exists) {
          continue;
        }

        // Resolve or create Police Station in active database
        let policeStationId: number | null = null;
        if (c.policeStationName && c.policeStationName.trim() !== "") {
          const psName = c.policeStationName.trim();
          const ps = await db.getFirstAsync<{ id: number }>(
            "SELECT id FROM PoliceStations WHERE LOWER(name) = LOWER(?)",
            [psName]
          );
          if (ps) {
            policeStationId = ps.id;
          } else {
            const res = await db.runAsync(
              "INSERT OR IGNORE INTO PoliceStations (name, user_id) VALUES (?, ?)",
              [psName, userId]
            );
            policeStationId = res.lastInsertRowId;
          }
        }

        // Resolve or create Court in active database
        let courtId: number | null = null;
        if (c.court_name && c.court_name.trim() !== "") {
          const courtName = c.court_name.trim();
          const courtObj = await db.getFirstAsync<{ id: number }>(
            "SELECT id FROM Courts WHERE LOWER(name) = LOWER(?)",
            [courtName]
          );
          if (courtObj) {
            courtId = courtObj.id;
          } else {
            const res = await db.runAsync(
              "INSERT OR IGNORE INTO Courts (name, user_id) VALUES (?, ?)",
              [courtName, userId]
            );
            courtId = res.lastInsertRowId;
          }
        }

        // Resolve or create Case Type in active database
        let caseTypeId: number | null = null;
        if (c.case_type_name && c.case_type_name.trim() !== "") {
          const ctName = c.case_type_name.trim();
          const ctObj = await db.getFirstAsync<{ id: number }>(
            "SELECT id FROM CaseTypes WHERE LOWER(name) = LOWER(?)",
            [ctName]
          );
          if (ctObj) {
            caseTypeId = ctObj.id;
          } else {
            const res = await db.runAsync(
              "INSERT OR IGNORE INTO CaseTypes (name, user_id) VALUES (?, ?)",
              [ctName, userId]
            );
            caseTypeId = res.lastInsertRowId;
          }
        }

        const uniqueId = c.uniqueId || `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Insert Case row into active database
        const insertRes = await db.runAsync(
          `INSERT INTO Cases (
            uniqueId, user_id, CaseTitle, ClientName, OnBehalfOf, CNRNumber,
            case_number, case_year, court_id, court_name, case_type_id, case_type_name,
            dateFiled, NextDate, PreviousDate, StatuteOfLimitations, crime_number, crime_year,
            police_station_id, Undersection, FirstParty, OppositeParty, Accussed,
            ClientContactNumber, JudgeName, OpposingCounsel, CaseStatus, Priority,
            CaseDescription, CaseNotes, created_at, updated_at, session_trial_number,
            OppositeAdvocate, OppAdvocateContactNumber
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uniqueId,
            userId,
            c.CaseTitle || "Untitled Case",
            c.ClientName || null,
            c.OnBehalfOf || null,
            c.CNRNumber || null,
            c.case_number || null,
            c.case_year ? parseInt(c.case_year.toString(), 10) : null,
            courtId,
            c.court_name || null,
            caseTypeId,
            c.case_type_name || null,
            c.dateFiled || null,
            c.NextDate || null,
            c.PreviousDate || null,
            c.StatuteOfLimitations || null,
            c.crime_number || null,
            c.crime_year ? parseInt(c.crime_year.toString(), 10) : null,
            policeStationId,
            c.Undersection || null,
            c.FirstParty || null,
            c.OppositeParty || null,
            c.Accussed || null,
            c.ClientContactNumber || null,
            c.JudgeName || null,
            c.OpposingCounsel || null,
            c.CaseStatus || "Open",
            c.Priority || "Medium",
            c.CaseDescription || null,
            c.CaseNotes || null,
            c.created_at || new Date().toISOString(),
            c.updated_at || new Date().toISOString(),
            c.session_trial_number || null,
            c.OppositeAdvocate || null,
            c.OppAdvocateContactNumber || null
          ]
        );

        const newCaseId = insertRes.lastInsertRowId;

        // Copy timeline events for this case
        const timelineTableExists = await tempDb.getFirstAsync<{ count: number }>(
          "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='CaseTimeline';"
        );
        if (timelineTableExists && timelineTableExists.count > 0) {
          const timelineEvents = await tempDb.getAllAsync<any>(
            "SELECT * FROM CaseTimeline WHERE case_id = ?",
            [c.id]
          );
          for (const event of timelineEvents) {
            await db.runAsync(
              `INSERT INTO CaseTimeline (case_id, notes, hearing_date, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?)`,
              [
                newCaseId,
                event.notes || "",
                event.hearing_date,
                event.created_at || new Date().toISOString(),
                event.updated_at || new Date().toISOString()
              ]
            );
          }
        }

        // Copy documents for this case
        const docsTableExists = await tempDb.getFirstAsync<{ count: number }>(
          "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='CaseDocuments';"
        );
        if (docsTableExists && docsTableExists.count > 0) {
          const documents = await tempDb.getAllAsync<any>(
            "SELECT * FROM CaseDocuments WHERE case_id = ?",
            [c.id]
          );
          for (const doc of documents) {
            await db.runAsync(
              `INSERT INTO CaseDocuments (
                case_id, stored_filename, original_display_name, file_type, file_size, created_at, user_id
              ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                newCaseId,
                doc.stored_filename,
                doc.original_display_name,
                doc.file_type || null,
                doc.file_size || null,
                doc.created_at || new Date().toISOString(),
                userId
              ]
            );
          }
        }

        insertedCount++;
      }
    });

    // Reschedule notifications for all active upcoming cases
    await reScheduleAllNotifications();

    return { insertedCount };
  } catch (error: any) {
    console.error("Error during database merge:", error);
    throw new Error(error.message || "Failed to merge backup database.");
  } finally {
    if (tempDb) {
      try {
        await tempDb.closeAsync();
      } catch (err) {
        console.warn("Failed to close tempDb:", err);
      }
    }
    // Delete temp DB
    await FileSystem.deleteAsync(tempDbPath, { idempotent: true });
    await FileSystem.deleteAsync(tempDbPath + '-journal', { idempotent: true });
    await FileSystem.deleteAsync(tempDbPath + '-wal', { idempotent: true });
    await FileSystem.deleteAsync(tempDbPath + '-shm', { idempotent: true });
  }
};

/**
 * Wipes temporary database preview files from file system.
 */
export const cleanupTempDatabaseBackup = async (): Promise<void> => {
  const tempDbPath = FileSystem.documentDirectory + 'SQLite/temp_import_preview.db';
  await FileSystem.deleteAsync(tempDbPath, { idempotent: true });
  await FileSystem.deleteAsync(tempDbPath + '-journal', { idempotent: true });
  await FileSystem.deleteAsync(tempDbPath + '-wal', { idempotent: true });
  await FileSystem.deleteAsync(tempDbPath + '-shm', { idempotent: true });
};
