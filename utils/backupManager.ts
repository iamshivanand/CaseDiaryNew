import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

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
