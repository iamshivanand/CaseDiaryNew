// utils/__tests__/realTiptapEditorTemplate.test.ts
import { getRealTiptapEditorHtml } from "../realTiptapEditorTemplate";

describe("Real Tiptap Editor Template Scaffold (True Tiptap v3 & ProseMirror AST)", () => {
  it("generates a valid HTML5 document string with embedded Tiptap v3 bundle", () => {
    const html = getRealTiptapEditorHtml("");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html>");
    expect(html).toContain("</html>");
    expect(html).toContain("new Tiptap.Editor");
  });

  it("includes mobile-optimized viewport meta tag", () => {
    const html = getRealTiptapEditorHtml("");
    expect(html).toContain("maximum-scale=1.0");
    expect(html).toContain("user-scalable=no");
  });

  it("renders initial content safely inside Tiptap editor", () => {
    const html = getRealTiptapEditorHtml("<p>Legal Tiptap Draft</p>");
    expect(html).toContain("<p>Legal Tiptap Draft</p>");
  });

  it("contains Tiptap ProseMirror AST state synchronization bridge for React Native", () => {
    const html = getRealTiptapEditorHtml("");
    expect(html).toContain("editor.isActive('bold')");
    expect(html).toContain("editor.isActive('italic')");
    expect(html).toContain("editor.isActive('underline')");
    expect(html).toContain("engine: 'tiptap-v3-prosemirror-ast'");
  });

  it("supports native Tiptap commands via window.handleRNMessage without legacy formatting execCommands", () => {
    const html = getRealTiptapEditorHtml("");
    expect(html).toContain("editor.chain().focus().toggleBold().run()");
    expect(html).toContain("editor.chain().focus().toggleItalic().run()");
    expect(html).toContain("editor.chain().focus().toggleUnderline().run()");
    expect(html).toContain("editor.chain().focus().insertTable");
    expect(html).toContain("editor.chain().focus().addRowBefore");
    expect(html).toContain("editor.chain().focus().deleteRow");
    // Verifies legacy execCommands are eliminated from formatting logic
    expect(html).not.toContain("document.execCommand('bold'");
    expect(html).not.toContain("document.execCommand('italic'");
    expect(html).not.toContain("document.execCommand('removeFormat'");
  });

  it("dynamically computes scaleRatio and applies proportional typography scaling across mobile screens", () => {
    const html = getRealTiptapEditorHtml("");
    expect(html).toContain("const scaleRatio = paperWidth / referenceWidth;");
    expect(html).toContain("renderFontPx = Math.max(11, Math.round(baseFontSize * scaleRatio))");
    expect(html).toContain("dynamic-paper-scale-style");
    expect(html).toContain("window.addEventListener('resize'");
    expect(html).toContain("window.addEventListener('orientationchange'");
  });

  it("supports setFontSize and setLineHeight commands", () => {
    const html = getRealTiptapEditorHtml("");
    expect(html).toContain("cmd === 'setFontSize'");
    expect(html).toContain("cmd === 'setLineHeight'");
  });
});
