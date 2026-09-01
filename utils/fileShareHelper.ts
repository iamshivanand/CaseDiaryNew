import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

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
    if (!sourceUri) return "";

    let normalizedSource = sourceUri;
    if (
      !normalizedSource.startsWith("file://") &&
      !normalizedSource.startsWith("content://")
    ) {
      normalizedSource = `file://${normalizedSource}`;
    }

    const cleanFileName = sanitizeFileName(desiredFileName, ".pdf");
    const baseCacheDir =
      FileSystem.cacheDirectory ||
      FileSystem.documentDirectory ||
      "file:///cache/";
    const exportDir = `${baseCacheDir.endsWith("/") ? baseCacheDir : `${baseCacheDir}/`}Advocase_Exports/`;
    const targetUri = `${exportDir}${cleanFileName}`;

    // If source file is already at the target destination, verify and return directly
    if (normalizedSource === targetUri) {
      const selfInfo = await FileSystem.getInfoAsync(targetUri);
      if (selfInfo.exists) {
        return targetUri;
      }
    }

    // Ensure source exists before attempting to copy
    const srcInfo = await FileSystem.getInfoAsync(normalizedSource);
    if (!srcInfo.exists) {
      console.warn("createNamedPdfFile: Source file does not exist:", normalizedSource);
      return normalizedSource;
    }

    // Ensure export directory exists
    const dirInfo = await FileSystem.getInfoAsync(exportDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(exportDir, { intermediates: true });
    }

    // Safely delete existing target ONLY if it is distinct from source
    if (targetUri !== normalizedSource) {
      const fileInfo = await FileSystem.getInfoAsync(targetUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(targetUri, { idempotent: true });
      }

      await FileSystem.copyAsync({
        from: normalizedSource,
        to: targetUri,
      });
    }

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
  try {
    if (!sourceUri) {
      Alert.alert("Share Unavailable", "No PDF document found to share.");
      return "";
    }

    let normalizedUri = sourceUri;
    if (
      !normalizedUri.startsWith("file://") &&
      !normalizedUri.startsWith("content://")
    ) {
      normalizedUri = `file://${normalizedUri}`;
    }

    const namedUri = await createNamedPdfFile(normalizedUri, desiredFileName);
    const fileInfo = await FileSystem.getInfoAsync(namedUri);

    if (!fileInfo.exists || (fileInfo.size !== undefined && fileInfo.size === 0)) {
      console.error("shareNamedPdf: Target file does not exist or is empty:", namedUri);
      Alert.alert(
        "Share Error",
        "The PDF document could not be prepared for sharing."
      );
      return namedUri;
    }

    const cleanTitle = sanitizeFileName(desiredFileName, "").replace(/\.pdf$/i, "");

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(namedUri, {
        mimeType: "application/pdf",
        dialogTitle: dialogTitle || cleanTitle,
        UTI: "com.adobe.pdf",
      });
    } else {
      Alert.alert("Share Unavailable", "Sharing is not available on this device.");
    }

    return namedUri;
  } catch (error: any) {
    console.error("Error in shareNamedPdf:", error);
    Alert.alert(
      "Share Error",
      `Failed to open sharing dialog: ${error?.message || "Unknown error"}`
    );
    return sourceUri;
  }
};
