// utils/ocrService.ts
import * as FileSystem from "expo-file-system";

export interface OcrResult {
  text: string;
  confidence?: number;
  blocks?: string[];
}

/**
 * Clean and format raw OCR text for court document insertion
 */
export const formatOcrTextForDocument = (rawText: string): string => {
  if (!rawText) return "";

  // 1. Normalize line endings
  let text = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 2. Fix broken hyphenated words across lines (e.g. "Petiti-\noner" -> "Petitioner")
  text = text.replace(/(\w+)-\n(\w+)/g, "$1$2");

  // 3. Replace single newlines within paragraphs with spaces while keeping double newlines as paragraph splits
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\n/g, " ").replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 0);

  return paragraphs.join("\n\n");
};

/**
 * Extract raw text from an array of scanned document image URIs
 */
export const extractTextFromImages = async (
  imageUris: string[]
): Promise<string> => {
  if (!imageUris || !Array.isArray(imageUris) || imageUris.length === 0) {
    return "";
  }

  const extractedParagraphs: string[] = [];

  for (const rawUri of imageUris) {
    if (!rawUri || typeof rawUri !== "string") continue;

    try {
      // Normalize URI format for Android native compatibility
      let cleanUri = rawUri;
      if (
        !cleanUri.startsWith("file://") &&
        !cleanUri.startsWith("content://") &&
        !cleanUri.startsWith("ph://")
      ) {
        cleanUri = "file://" + cleanUri;
      }

      // Verify file exists if file:// scheme
      if (cleanUri.startsWith("file://")) {
        const fileInfo = await FileSystem.getInfoAsync(cleanUri);
        if (!fileInfo.exists) {
          console.warn(`OCR file not found: ${cleanUri}`);
          continue;
        }
      }

      let pageText = "";
      try {
        // Dynamic import / check for @react-native-ml-kit/text-recognition
        const MlkitTextRecognition = require("@react-native-ml-kit/text-recognition");
        if (
          MlkitTextRecognition &&
          (MlkitTextRecognition.default || MlkitTextRecognition.recognize)
        ) {
          const recognizer = MlkitTextRecognition.default || MlkitTextRecognition;
          const result = await recognizer.recognize(cleanUri);
          pageText = result?.text || "";
        }
      } catch (e) {
        console.warn("Native ML Kit text recognition error:", e);
        pageText = "";
      }

      if (pageText && pageText.trim().length > 0) {
        const formatted = formatOcrTextForDocument(pageText);
        if (formatted) {
          extractedParagraphs.push(formatted);
        }
      }
    } catch (err) {
      console.error("Error processing OCR for image:", rawUri, err);
    }
  }

  return extractedParagraphs.join("\n\n---\n\n");
};
