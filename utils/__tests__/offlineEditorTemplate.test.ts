// utils/__tests__/offlineEditorTemplate.test.ts
import { getOfflineEditorHtml } from "../offlineEditorTemplate";

describe("offlineEditorTemplate", () => {
  it("should generate HTML string containing editor container and script handlers", () => {
    const html = getOfflineEditorHtml("<p>Test Draft</p>");
    expect(html).toContain('id="editor"');
    expect(html).toContain("<p>Test Draft</p>");
    expect(html).toContain("openPlaceholderModal");
    expect(html).toContain("insertTable");
    expect(html).toContain("insertSignature");
  });

  it("should include court ledger red margin line and page break styles", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain('id="red-margin-line"');
    expect(html).toContain("hr.page-break");
    expect(html).toContain("page-legal");
    expect(html).toContain("page-a4");
  });
});
