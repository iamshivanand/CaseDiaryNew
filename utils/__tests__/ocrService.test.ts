// utils/__tests__/ocrService.test.ts
import { formatOcrTextForDocument, extractTextFromImages } from "../ocrService";
import * as FileSystem from "expo-file-system";

jest.mock("expo-file-system", () => ({
  getInfoAsync: jest.fn(),
}));

describe("ocrService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("formatOcrTextForDocument", () => {
    it("should return empty string for null or empty input", () => {
      expect(formatOcrTextForDocument("")).toBe("");
    });

    it("should normalize line endings and rejoin hyphenated line breaks", () => {
      const rawText = "IN THE HIGH COURT OF JUDICATURE AT BOMBAY\r\nPetiti-\noner vs Respon-\ndent\n\nPARAGRAPH TWO";
      const formatted = formatOcrTextForDocument(rawText);
      expect(formatted).toContain("Petitioner vs Respondent");
      expect(formatted).toContain("PARAGRAPH TWO");
    });
  });

  describe("extractTextFromImages", () => {
    it("should return empty string if no image URIs provided", async () => {
      const result = await extractTextFromImages([]);
      expect(result).toBe("");
    });

    it("should skip files that do not exist", async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
      const result = await extractTextFromImages(["file:///test/image.jpg"]);
      expect(result).toBe("");
    });
  });
});
