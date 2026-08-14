import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

/**
 * Sanitizes a filename to be safe across Android, iOS, Windows, and Linux filesystems.
 * Strips special characters, controls length, and ensures the correct file extension.
 */
export const sanitizeFileName = (
  rawName: string,
  extension: string = ".pdf"
): string => {
  if (!rawName || typeof rawName !== "string" || !rawName.trim()) {
    return `Document_${Date.now()}${extension.startsWith(".") ? extension : `.${extension}`}`;
  }

  const ext = extension.startsWith(".") ? extension : `.${extension}`;

  // Remove any existing extension from rawName if present
  let baseName = rawName.trim();
  if (baseName.toLowerCase().endsWith(ext.toLowerCase())) {
    baseName = baseName.slice(0, -ext.length);
  }

  // Replace illegal filesystem characters (\ / : * ? " < > | \n \r \t) with underscore
  let cleaned = baseName
    .replace(/[\\/:*?"<>|\x00-\x1F\x7F]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[\._\s]+|[\._\s]+$/g, "");

  // Fallback if empty after sanitization
  if (!cleaned) {
    cleaned = `Document_${Date.now()}`;
  }

  // Restrict base name length to 80 characters to avoid path length limits
  if (cleaned.length > 80) {
    cleaned = cleaned.substring(0, 80).replace(/_+$/, "");
  }

  return `${cleaned}${ext}`;
};

/**
 * Copies a generated temporary file (such as from expo-print) to a structured,
 * clean named file in the cache directory so that recipient apps (WhatsApp, Drive, Gmail)
 * recognize and display the proper descriptive file name.
 */
export const createNamedPdfFile = async (
  sourceUri: string,
  desiredFileName: string
): Promise<string> => {
  try {
    const cleanFileName = sanitizeFileName(desiredFileName, ".pdf");
    const exportDir = `${FileSystem.cacheDirectory}Advocase_Exports/`;

    // Ensure export directory exists
    const dirInfo = await FileSystem.getInfoAsync(exportDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(exportDir, { intermediates: true });
    }

    const targetUri = `${exportDir}${cleanFileName}`;

    // Overwrite if existing
    const fileInfo = await FileSystem.getInfoAsync(targetUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(targetUri, { idempotent: true });
    }

    await FileSystem.copyAsync({
      from: sourceUri,
      to: targetUri,
    });

    return targetUri;
  } catch (error) {
    console.warn("Failed to create named PDF file, falling back to original URI:", error);
    return sourceUri;
  }
};

/**
 * Prepares a clean, named PDF file and opens the system share sheet.
 */
export const shareNamedPdf = async (
  sourceUri: string,
  desiredFileName: string,
  dialogTitle?: string
): Promise<string> => {
  const namedUri = await createNamedPdfFile(sourceUri, desiredFileName);
  const cleanTitle = sanitizeFileName(desiredFileName, "").replace(/\.pdf$/i, "");

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(namedUri, {
      mimeType: "application/pdf",
      dialogTitle: dialogTitle || cleanTitle,
      UTI: "com.adobe.pdf",
    });
  } else {
    console.warn("Sharing is not available on this platform.");
  }

  return namedUri;
};
