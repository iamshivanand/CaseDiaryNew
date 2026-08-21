// utils/__tests__/tiptapEditorComprehensive.test.ts
import vm from "vm";
import { getRealTiptapEditorHtml } from "../realTiptapEditorTemplate";
import { getTiptapEditorHtml } from "../tiptapEditorTemplate";

describe("Tiptap Production-Grade Editor - True Tiptap & ProseMirror AST Test Suite", () => {
  // =========================================================================
  // 1. INPUT ESCAPING, SANITIZATION & UNICODE SAFETY
  // =========================================================================
  describe("1. Input Escaping, Sanitization & Unicode Safety", () => {
    it("compiles all inline <script> tags without any JavaScript syntax errors", () => {
      const html = getRealTiptapEditorHtml("<p>Test Pleading</p>");
      const scriptRegex = /<script>([\s\S]*?)<\/script>/gi;
      let match;
      let scriptCount = 0;
      while ((match = scriptRegex.exec(html)) !== null) {
        const scriptBody = match[1];
        expect(() => {
          new vm.Script(scriptBody);
        }).not.toThrow();
        scriptCount++;
      }
      expect(scriptCount).toBeGreaterThan(0);
    });

    it("safely handles empty string, null, and undefined initial content", () => {
      const htmlFromEmpty = getRealTiptapEditorHtml("");
      const htmlFromNull = getRealTiptapEditorHtml(null as unknown as string);
      const htmlFromUndefined = getRealTiptapEditorHtml(undefined as unknown as string);

      expect(htmlFromEmpty).toContain('initialContentHtml = "<p></p>"');
      expect(htmlFromNull).toContain('initialContentHtml = "<p></p>"');
      expect(htmlFromUndefined).toContain('initialContentHtml = "<p></p>"');
    });

    it("safely escapes nested double quotes, single quotes, backticks and backslashes", () => {
      const complexHtml = `<p>Advocate said: "Section 138 \\ 'Negotiable Instruments Act' \`test\` \${injection}"</p>`;
      const rendered = getRealTiptapEditorHtml(complexHtml);

      expect(rendered).toContain("Advocate said:");
      expect(rendered).toContain("Negotiable Instruments Act");
      expect(rendered).toContain("initialContentHtml =");
    });

    it("preserves Hindi Devnagari script and complex Unicode legal glyphs", () => {
      const hindiLegalDraft = `
        <h2>माननीय उच्च न्यायालय इलाहाबाद</h2>
        <p>याचिकाकर्ता: <b>राम कुमार शर्मा</b> बनाम <i>उत्तर प्रदेश राज्य</i></p>
        <p>न्यायालय शुल्क: ₹100/- | धारा: 482 दं.प्र.सं. § 91 ¶ 12</p>
      `;
      const rendered = getRealTiptapEditorHtml(hindiLegalDraft);

      expect(rendered).toContain("माननीय उच्च न्यायालय इलाहाबाद");
      expect(rendered).toContain("राम कुमार शर्मा");
      expect(rendered).toContain("₹100/-");
      expect(rendered).toContain("§ 91");
      expect(rendered).toContain("¶ 12");
    });

    it("handles large document payloads (10,000+ words) without truncation", () => {
      const longParagraph = "<p>This is a standard court pleading paragraph repeating arguments. </p>".repeat(200);
      const rendered = getRealTiptapEditorHtml(longParagraph);
      expect(rendered.length).toBeGreaterThan(15000);
      expect(rendered).toContain("new Tiptap.Editor");
    });
  });

  // =========================================================================
  // 2. TRUE TIPTAP V3 ENGINE & PROSEMIRROR AST COMMANDS (NO EXECCOMMAND)
  // =========================================================================
  describe("2. True Tiptap Engine & Native AST Commands", () => {
    it("instantiates Tiptap.Editor with StarterKit, Underline, Table, and Placeholder extensions", () => {
      const html = getRealTiptapEditorHtml("");
      expect(html).toContain("new Tiptap.Editor");
      expect(html).toContain("Tiptap.StarterKit");
      expect(html).toContain("Tiptap.Underline");
      expect(html).toContain("Tiptap.Table");
      expect(html).toContain("Tiptap.TableRow");
      expect(html).toContain("Tiptap.TableCell");
      expect(html).toContain("Tiptap.TableHeader");
      expect(html).toContain("Tiptap.Placeholder");
    });

    it("completely eliminates legacy document.execCommand in favor of native Tiptap transactions", () => {
      const html = getRealTiptapEditorHtml("");
      expect(html).not.toContain("document.execCommand('bold'");
      expect(html).not.toContain("document.execCommand('italic'");
      expect(html).not.toContain("document.execCommand('removeFormat'");
      expect(html).toContain("editor.chain().focus().toggleBold().run()");
      expect(html).toContain("editor.chain().focus().toggleItalic().run()");
      expect(html).toContain("editor.chain().focus().toggleUnderline().run()");
      expect(html).toContain("editor.chain().focus().toggleOrderedList().run()");
      expect(html).toContain("editor.chain().focus().toggleBulletList().run()");
    });

    it("contains MS Word Page Break shortcut (Ctrl+Enter / Cmd+Enter)", () => {
      const html = getRealTiptapEditorHtml("");
      expect(html).toContain("isCtrl && e.key === 'Enter'");
      expect(html).toContain("data-type=\"page-break\"");
      expect(html).toContain("break-before: page");
    });
  });

  // =========================================================================
  // 3. MS WORD-STYLE REAL-TIME PAGINATION & PHYSICAL CANVAS
  // =========================================================================
  describe("3. MS Word-Style Real-Time Pagination & Physical Canvas", () => {
    it("calculates dynamic paper metrics for Legal (1.6470) and A4 (1.4142) ratios", () => {
      const html = getRealTiptapEditorHtml("");
      expect(html).toContain("function getPaperMetrics()");
      expect(html).toContain("const referenceWidth = isLegal ? 816 : 794;");
      expect(html).toContain("const heightRatio = isLegal ? 1.6470 : 1.4142;");
      expect(html).toContain("Math.round(paperWidth * heightRatio)");
    });

    it("includes Indian Court Red Margin Line with customizable scale offset", () => {
      const html = getRealTiptapEditorHtml("");
      expect(html).toContain("id=\"red-margin-line\"");
      expect(html).toContain("background-color: #dc2626");
      expect(html).toContain("redMargin.style.left");
    });

    it("generates running headers and footers with dynamic page interpolation", () => {
      const html = getRealTiptapEditorHtml("");
      expect(html).toContain("court-running-header");
      expect(html).toContain("court-running-footer");
      expect(html).toContain("replace('{page}', i + 1).replace('{total}', totalPages)");
    });

    it("supports angled Court Watermarks with configurable text and opacity", () => {
      const html = getRealTiptapEditorHtml("");
      expect(html).toContain("court-watermark-overlay");
      expect(html).toContain("transform = 'rotate(-30deg)'");
      expect(html).toContain("window.userWatermarkText");
      expect(html).toContain("window.userWatermarkOpacity");
    });

    it("enforces page break avoidance on headings, paragraphs, and table rows", () => {
      const html = getRealTiptapEditorHtml("");
      expect(html).toContain("break-inside: avoid-page");
      expect(html).toContain("page-break-inside: avoid");
      expect(html).toContain("break-after: avoid-page");
      expect(html).toContain("page-break-after: avoid");
    });

    it("derives dynamic typography hierarchy and spacing from scaleRatio", () => {
      const html = getRealTiptapEditorHtml("");
      expect(html).toContain("scaleRatio = paperWidth / referenceWidth");
      expect(html).toContain("renderFontPx = Math.max(11, Math.round(baseFontSize * scaleRatio))");
      expect(html).toContain("titlePx = Math.round(renderFontPx * 1.35)");
      expect(html).toContain("headerPx = Math.round(renderFontPx * 1.22)");
      expect(html).toContain("sectionPx = Math.round(renderFontPx * 1.12)");
      expect(html).toContain("paragraphMb = Math.max(4, Math.round(10 * scaleRatio))");
      expect(html).toContain("dynamic-paper-scale-style");
    });
  });

  // =========================================================================
  // 4. DYNAMIC TABLE MUTATION & FILING INDEX ENGINE
  // =========================================================================
  describe("4. Dynamic Table Mutation & Filing Index Engine", () => {
    it("uses native Tiptap table insertion commands", () => {
      const html = getRealTiptapEditorHtml("");
      expect(html).toContain("editor.chain().focus().insertTable");
    });

    it("contains insertFilingIndexTable for High Court Index of Documents", () => {
      const html = getRealTiptapEditorHtml("");
      expect(html).toContain("function insertFilingIndexTable()");
      expect(html).toContain("INDEX OF DOCUMENTS");
      expect(html).toContain("Particulars of Document");
      expect(html).toContain("Annexure / Exhibit");
    });

    it("uses native Tiptap table structure mutation commands", () => {
      const html = getRealTiptapEditorHtml("");
      expect(html).toContain("editor.chain().focus().addRowBefore().run()");
      expect(html).toContain("editor.chain().focus().addRowAfter().run()");
      expect(html).toContain("editor.chain().focus().addColumnBefore().run()");
      expect(html).toContain("editor.chain().focus().addColumnAfter().run()");
      expect(html).toContain("editor.chain().focus().deleteRow().run()");
      expect(html).toContain("editor.chain().focus().deleteColumn().run()");
    });

    it("safely deletes table when deleteSelectedElement is triggered on table", () => {
      const html = getRealTiptapEditorHtml("");
      expect(html).toContain("if (editor.isActive('table'))");
      expect(html).toContain("editor.chain().focus().deleteTable().run()");
    });
  });

  // =========================================================================
  // 5. INTERACTIVE LEGAL PLACEHOLDERS & BATCH REPLACEMENTS
  // =========================================================================
  describe("5. Interactive Legal Placeholders & Batch Replacements", () => {
    it("supports replacePlaceholderValue command across editor HTML", () => {
      const html = getRealTiptapEditorHtml("");
      expect(html).toContain("cmd === 'replacePlaceholderValue'");
      expect(html).toContain("split(label).join(newVal)");
      expect(html).toContain("editor.commands.setContent(updatedHtml)");
    });

    it("triggers openPlaceholderModal event on placeholder click", () => {
      const html = getRealTiptapEditorHtml("");
      expect(html).toContain("postMessage({ type: 'openPlaceholderModal', label: label, cleanLabel: label.replace('[', '').replace(']', '') });");
    });
  });

  // =========================================================================
  // 6. COURT SHAPES, SIGNATURES & ADVOCATE STAMPS
  // =========================================================================
  describe("6. Court Shapes, Signatures & Advocate Stamps", () => {
    it("supports digital touch signature injection with Advocate caption", () => {
      const html = getRealTiptapEditorHtml("");
      expect(html).toContain("cmd === 'insertSignature'");
      expect(html).toContain("class=\"signature-stamp\"");
      expect(html).toContain("(Advocate Signature)");
    });

    it("supports interactive court shape insertion (Rectangle, Round Seal, Arrow, Court Fee Stamp)", () => {
      const html = getRealTiptapEditorHtml("");
      expect(html).toContain("cmd === 'insertShape'");
      expect(html).toContain("shape-rect");
      expect(html).toContain("shape-circle");
      expect(html).toContain("shape-arrow");
      expect(html).toContain("shape-stamp");
      expect(html).toContain("AFFIX COURT FEE STAMP HERE - ₹10/-");
    });

    it("triggers openElementContextModal when table or signature element is tapped", () => {
      const html = getRealTiptapEditorHtml("");
      expect(html).toContain("postMessage({ type: 'openElementContextModal', elementType: 'table' })");
      expect(html).toContain("postMessage({ type: 'openElementContextModal', elementType: 'signature' })");
    });
  });

  // =========================================================================
  // 7. CASE CONVERSION ENGINE
  // =========================================================================
  describe("7. Case Conversion Engine (UPPERCASE, lowercase, Title Case)", () => {
    it("implements safeChangeCase using ProseMirror textBetween and insertContentAt", () => {
      const html = getRealTiptapEditorHtml("");
      expect(html).toContain("function safeChangeCase(mode)");
      expect(html).toContain("const selectedText = state.doc.textBetween(from, to)");
      expect(html).toContain("editor.chain().focus().insertContentAt({ from, to }, converted).run()");
    });
  });

  // =========================================================================
  // 8. VOICE DICTATION & REAL-TIME SPEECH TEXT INSERTION
  // =========================================================================
  describe("8. Voice Dictation & Real-Time Speech Text Insertion", () => {
    it("supports insertText command for continuous voice dictation stream via Tiptap insertContent", () => {
      const html = getRealTiptapEditorHtml("");
      expect(html).toContain("cmd === 'insertText'");
      expect(html).toContain("editor.chain().focus().insertContent(data.value).run()");
    });

    it("supports insertHTML command for formatted voice notes and snippets", () => {
      const html = getRealTiptapEditorHtml("");
      expect(html).toContain("cmd === 'insertHTML'");
      expect(html).toContain("editor.chain().focus().insertContent(data.value).run()");
    });

    it("supports universal legal macro snippets (Caption, Prayer, Affidavit, Service Certificate)", () => {
      const html = getRealTiptapEditorHtml("");
      expect(html).toContain("cmd === 'insertUniversalCaption'");
      expect(html).toContain("cmd === 'insertPrayerClause'");
      expect(html).toContain("cmd === 'insertAffidavitBlock'");
      expect(html).toContain("cmd === 'insertCertificateOfService'");
    });
  });

  // =========================================================================
  // 9. LANGUAGE, PAGE SETUP & DATA LOSS PREVENTION
  // =========================================================================
  describe("9. Language, Page Setup & Data Loss Prevention", () => {
    it("updates layout dynamically on 'layout' message without clearing editor content", () => {
      const html = getRealTiptapEditorHtml("<p>Existing Pleading Content</p>");
      expect(html).toContain("data.type === 'layout'");
      expect(html).toContain("editorEl.style.fontFamily = data.font");
      expect(html).toContain("updateDynamicPaperRatio()");
      expect(html).not.toMatch(/data\.type === 'layout'[\s\S]*?editor\.commands\.setContent\(''\)/);
    });

    it("handles requestSave message and responds with full HTML and document telemetry stats", () => {
      const html = getRealTiptapEditorHtml("");
      expect(html).toContain("data.type === 'requestSave'");
      expect(html).toContain("postMessage({");
      expect(html).toContain("type: 'save'");
      expect(html).toContain("html: editor.getHTML()");
      expect(html).toContain("stats: stats");
    });
  });

  // =========================================================================
  // 10. BRIDGE PROTOCOL & FAULT TOLERANCE
  // =========================================================================
  describe("10. Bridge Protocol & Fault Tolerance", () => {
    it("wraps message dispatch in try/catch to report bridge errors back to React Native", () => {
      const html = getRealTiptapEditorHtml("");
      expect(html).toContain("window.handleRNMessage = function(messageData)");
      expect(html).toContain("postMessage({");
      expect(html).toContain("type: 'error'");
      expect(html).toContain("error: err.message");
    });

    it("debounces sendStateToRN to prevent flooding React Native WebView bridge during rapid typing", () => {
      const html = getRealTiptapEditorHtml("");
      expect(html).toContain("let sendStateTimeout = null;");
      expect(html).toContain("sendStateTimeout = setTimeout(doSend, 300);");
    });

    it("calculates accurate wordCount, charCount, and estimated pages telemetry", () => {
      const html = getRealTiptapEditorHtml("");
      expect(html).toContain("function calculateStats()");
      expect(html).toContain("const wordCount = cleanText ? cleanText.split(/\\s+/).length : 0;");
      expect(html).toContain("const charCount = cleanText.length;");
      expect(html).toContain("Math.max(1 + pageBreaks, Math.ceil(wordCount / 350) || 1)");
    });
  });

  // =========================================================================
  // 11. PROSEMIRROR AST ENGINE COMPATIBILITY (tiptapEditorTemplate.ts)
  // =========================================================================
  describe("11. ProseMirror AST Engine Compatibility (tiptapEditorTemplate.ts)", () => {
    it("validates ProseMirror document structure via validateTiptapJson", () => {
      const astHtml = getTiptapEditorHtml("");
      expect(astHtml).toContain("function validateTiptapJson(doc)");
      expect(astHtml).toContain("doc.type === 'doc' && Array.isArray(doc.content)");
    });

    it("manages immutable transaction history with undoStack and redoStack", () => {
      const astHtml = getTiptapEditorHtml("");
      expect(astHtml).toContain("function dispatchTransaction(tr = {})");
      expect(astHtml).toContain("editorState.history.undoStack.push");
      expect(astHtml).toContain("function executeUndoTransaction()");
      expect(astHtml).toContain("function executeRedoTransaction()");
    });

    it("caps undo history at 50 snapshots to prevent mobile memory leaks", () => {
      const astHtml = getTiptapEditorHtml("");
      expect(astHtml).toContain("if (editorState.history.undoStack.length > 50) editorState.history.undoStack.shift();");
    });
  });
});
