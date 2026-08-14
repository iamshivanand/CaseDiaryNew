import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import {
  sanitizeFileName,
  createNamedPdfFile,
  shareNamedPdf,
} from "../fileShareHelper";

describe("fileShareHelper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("sanitizeFileName", () => {
    it("should replace invalid filesystem characters with underscores", () => {
      const raw = 'Case: "State / Union * ? < > | Test"';
      const clean = sanitizeFileName(raw);
      expect(clean).toBe("Case_State_Union_Test.pdf");
      expect(clean).not.toMatch(/[:*?"<>|\/\\]/);
    });

    it("should collapse multiple spaces and underscores", () => {
      const raw = "Daily   Cause___List   2026";
      const clean = sanitizeFileName(raw);
      expect(clean).toBe("Daily_Cause_List_2026.pdf");
    });

    it("should handle custom extensions", () => {
      const clean = sanitizeFileName("my_document", ".docx");
      expect(clean).toBe("my_document.docx");
    });

    it("should not double-append extension if already present", () => {
      const clean = sanitizeFileName("Cause_List_Today.pdf", ".pdf");
      expect(clean).toBe("Cause_List_Today.pdf");
    });

    it("should truncate overly long filenames while preserving extension", () => {
      const veryLong = "A".repeat(150);
      const clean = sanitizeFileName(veryLong, ".pdf");
      expect(clean.length).toBeLessThanOrEqual(84);
      expect(clean.endsWith(".pdf")).toBe(true);
      expect(clean.startsWith("A".repeat(80))).toBe(true);
    });

    it("should return timestamped fallback name for empty or whitespace-only inputs", () => {
      expect(sanitizeFileName("")).toMatch(/^Document_\d+\.pdf$/);
      expect(sanitizeFileName("   ")).toMatch(/^Document_\d+\.pdf$/);
      expect(sanitizeFileName(":::???***")).toMatch(/^Document_\d+\.pdf$/);
    });
  });

  describe("createNamedPdfFile", () => {
    it("should create export directory and copy file with sanitized filename", async () => {
      const mockSourceUri = "file:///temp/123-abc.pdf";
      const desiredName = "Daily Cause List: 14 Aug 2026";

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
      });
      (FileSystem.makeDirectoryAsync as jest.Mock).mockResolvedValue(undefined);
      (FileSystem.copyAsync as jest.Mock).mockResolvedValue(undefined);

      const result = await createNamedPdfFile(mockSourceUri, desiredName);

      expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledWith(
        expect.stringContaining("Advocase_Exports/"),
        { intermediates: true }
      );
      expect(FileSystem.copyAsync).toHaveBeenCalledWith({
        from: mockSourceUri,
        to: expect.stringContaining("Daily_Cause_List_14_Aug_2026.pdf"),
      });
      expect(result).toContain("Daily_Cause_List_14_Aug_2026.pdf");
    });

    it("should fallback to sourceUri if copying throws an error", async () => {
      const mockSourceUri = "file:///temp/fallback.pdf";
      (FileSystem.getInfoAsync as jest.Mock).mockRejectedValue(
        new Error("Disk error")
      );

      const result = await createNamedPdfFile(mockSourceUri, "My_Doc");
      expect(result).toBe(mockSourceUri);
    });
  });

  describe("shareNamedPdf", () => {
    it("should share the named file when sharing is available", async () => {
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
      (FileSystem.copyAsync as jest.Mock).mockResolvedValue(undefined);

      const mockUri = "file:///temp/abc.pdf";
      await shareNamedPdf(mockUri, "State vs John", "Share Case Summary");

      expect(Sharing.shareAsync).toHaveBeenCalledWith(
        expect.stringContaining("State_vs_John.pdf"),
        expect.objectContaining({
          mimeType: "application/pdf",
          dialogTitle: "Share Case Summary",
          UTI: "com.adobe.pdf",
        })
      );
    });

    it("should not crash if Sharing is unavailable", async () => {
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);

      const mockUri = "file:///temp/abc.pdf";
      await expect(shareNamedPdf(mockUri, "Doc")).resolves.not.toThrow();
      expect(Sharing.shareAsync).not.toHaveBeenCalled();
    });
  });
});
