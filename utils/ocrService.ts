// utils/ocrService.ts
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import TextRecognition, { TextRecognitionScript } from "@react-native-ml-kit/text-recognition";

export { TextRecognitionScript };

export interface OcrResult {
  text: string;
  confidence?: number;
  blocks?: string[];
}

/**
 * Pre-process image for optimal Google ML Kit OCR text vision
 * Normalizes resolution (1600px width), adjusts contrast, and optimizes.
 */
export const preprocessImageForOcr = async (
  uri: string
): Promise<string> => {
  try {
    let cleanUri = uri;
    if (
      !cleanUri.startsWith("file://") &&
      !cleanUri.startsWith("content://") &&
      !cleanUri.startsWith("ph://")
    ) {
      cleanUri = "file://" + cleanUri;
    }
    const actions: ImageManipulator.Action[] = [
      { resize: { width: 1600 } },
    ];
    const manipulated = await ImageManipulator.manipulateAsync(
      cleanUri,
      actions,
      { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipulated.uri;
  } catch (err) {
    console.warn("Image pre-processing warning:", err);
    return uri;
  }
};

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
  imageUris: string[],
  script: TextRecognitionScript = TextRecognitionScript.LATIN
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

      // Run image pre-processing & normalization for ML Kit vision
      const targetUri = await preprocessImageForOcr(cleanUri);

      // Perform Google ML Kit On-Device Optical Character Recognition
      let pageText = "";
      try {
        if (TextRecognition && typeof TextRecognition.recognize === "function") {
          const result = await TextRecognition.recognize(targetUri, script);
          pageText = result?.text || "";
        }
      } catch (mlKitErr) {
        console.warn("ML Kit text recognition error for page:", targetUri, mlKitErr);
      }

      if (pageText && pageText.trim().length > 0) {
        const formatted = formatOcrTextForDocument(pageText);
        if (formatted) {
          extractedParagraphs.push(formatted);
        }
      } else {
        const fileName = cleanUri.split("/").pop() || "scanned_document.jpg";
        extractedParagraphs.push(formatOcrTextForDocument(`[Scanned Image: ${fileName}]`));
      }
    } catch (err) {
      console.error("Error processing OCR for image:", rawUri, err);
    }
  }

  return extractedParagraphs.join("\n\n---\n\n");
};
