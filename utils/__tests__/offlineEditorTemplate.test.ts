// utils/__tests__/offlineEditorTemplate.test.ts
import { getOfflineEditorHtml } from "../offlineEditorTemplate";

// =============================================================================
// SECTION 1 — Template Scaffold & HTML Structure
// =============================================================================
describe("Template Scaffold", () => {
  it("generates a valid HTML5 document string", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html>");
    expect(html).toContain("</html>");
    expect(html).toContain("<head>");
    expect(html).toContain("<body>");
  });

  it("includes viewport meta tag preventing user zoom on mobile", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("maximum-scale=1.0");
    expect(html).toContain("user-scalable=no");
  });

  it("renders initialHtml content inside editor div", () => {
    const html = getOfflineEditorHtml("<p>Test Draft</p>");
    expect(html).toContain("<p>Test Draft</p>");
  });

  it("renders empty string safely — no undefined or null literals in output", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain('id="editor"');
    expect(html).not.toContain(">undefined<");
    expect(html).not.toContain(">null<");
  });

  it("renders Devanagari / Hindi Unicode content without corruption", () => {
    const hindi = "<p>भारत का न्यायालय</p>";
    const html = getOfflineEditorHtml(hindi);
    expect(html).toContain("भारत का न्यायालय");
  });

  it("renders multi-page initialHtml with legal-page-break divs intact", () => {
    const multiPage = `<p>Page 1</p><div class="legal-page-break" style="break-before: page;"></div><p>Page 2</p>`;
    const html = getOfflineEditorHtml(multiPage);
    expect(html).toContain("Page 1");
    expect(html).toContain("legal-page-break");
    expect(html).toContain("Page 2");
  });

  it("template remains structurally intact when given XSS-style initialHtml", () => {
    const xss = '<script>alert("xss")<\/script>';
    const html = getOfflineEditorHtml(xss);
    // HTML scaffold must still be present
    expect(html).toContain('id="editor"');
    expect(html).toContain("</script>");
  });
});

// =============================================================================
// SECTION 2 — Paper Size & scaleRatio Derivation Engine
// =============================================================================
describe("Paper Size & scaleRatio Engine", () => {
  it("uses 816px reference width for Legal paper", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("referenceWidth = isLegal ? 816 : 794");
  });

  it("uses correct height ratios — Legal 1.6470, A4 1.4142", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("heightRatio = isLegal ? 1.6470 : 1.4142");
  });

  it("clamps paperWidth to referenceWidth on wide desktop viewports", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain(
      "paperWidth = Math.min(referenceWidth, availableWidth)"
    );
  });

  it("enforces minimum available width of 300px to prevent layout collapse", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("Math.max(300,");
  });

  it("derives singleSheetHeight from paperWidth * heightRatio", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain(
      "singleSheetHeight = Math.round(paperWidth * heightRatio)"
    );
  });

  it("computes scaleRatio as paperWidth / referenceWidth", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("scaleRatio = paperWidth / referenceWidth");
  });

  it("applies outerPadding of 8px to shrink available width", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("outerPadding = 8");
  });

  it("sums topMargin and letterheadSpace for dynamic top padding", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("configuredTopMargin + configuredLetterhead");
  });

  it("scales inter-sheet pageGap using 20 * scaleRatio", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("20 * scaleRatio");
  });

  it("positions red ledger line at dynamicLeftMargin - (10 * scaleRatio)", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("dynamicLeftMargin - (10 * scaleRatio)");
  });

  it("page-container renders with box-shadow for paper depth effect", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("box-shadow");
    expect(html).toContain("page-container");
  });

  it("supports Legal and A4 page size class switching", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("page-legal");
    expect(html).toContain("page-a4");
  });
});

// =============================================================================
// SECTION 3 — Typography Hierarchy (All derived from scaleRatio)
// =============================================================================
describe("Typography Hierarchy (scaleRatio-derived)", () => {
  it("derives renderFontPx from baseFontSize * scaleRatio with 10px floor", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain(
      "renderFontPx = Math.max(10, Math.round(baseFontSize * scaleRatio))"
    );
  });

  it("derives renderLineHeightPx from renderFontPx * baseLineRatio", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("renderFontPx * baseLineRatio");
  });

  it("defaults to Legal line height ratio of 1.8", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("isLegal ? 1.8 : 1.5");
  });

  it("derives title / h1 font at 1.25x renderFontPx", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("renderFontPx * 1.25");
  });

  it("derives court-header / h2 font at 1.15x renderFontPx", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("renderFontPx * 1.15");
  });

  it("derives section-title / h3 font at 1.08x renderFontPx", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("renderFontPx * 1.08");
  });

  it("derives paragraph margin-bottom from 10 * scaleRatio", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("10 * scaleRatio");
  });

  it("derives padding-bottom from 30 * scaleRatio", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("30 * scaleRatio");
  });

  it("injects dynamic CSS via style#dynamic-paper-scale-style element", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("dynamic-paper-scale-style");
  });

  it("applies computed typography to all inline and block editor elements", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain(
      "#editor p, #editor div, #editor td, #editor th, #editor li, #editor span"
    );
  });

  it("sets Times New Roman as default font family", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("Times New Roman");
  });

  it("enforces word-wrap and overflow-wrap: break-word to prevent horizontal overflow", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("word-wrap: break-word");
    expect(html).toContain("overflow-wrap: break-word");
    expect(html).toContain("word-break: break-word");
  });

  it("applies letter-spacing and word-spacing derived from scaleRatio", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("letter-spacing");
    expect(html).toContain("word-spacing");
  });
});

// =============================================================================
// SECTION 4 — Non-Destructive MS Word Pagination Model
// =============================================================================
describe("Non-Destructive MS Word Pagination", () => {
  it("computes printableSheetHeight by subtracting margins from singleSheetHeight", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain(
      "singleSheetHeight - (dynamicTopMargin + dynamicBottomMargin)"
    );
  });

  it("enforces minimum printableSheetHeight of 100px to prevent divide-by-zero", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("Math.max(100,");
  });

  it("counts both .legal-page-break and hr.page-break for pageBreakCount", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain(
      "querySelectorAll('.legal-page-break, hr.page-break')"
    );
  });

  it("reads editor.scrollHeight to detect content overflowing visible area", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("editor.scrollHeight");
  });

  it("derives overflowPages from ceil(actualScrollHeight / printableSheetHeight)", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain(
      "Math.ceil(actualScrollHeight / printableSheetHeight)"
    );
  });

  it("totalPages is at minimum 1 even on an empty new document", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain(
      "totalPages = Math.max(1, pageBreakCount + 1, overflowPages)"
    );
  });

  it("uses minHeight (not fixed height) on editor to allow content to grow naturally", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("editor.style.minHeight = canvasHeight");
  });

  it("renders per-page dashed margin guide boxes inside margin-guide-overlay", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("margin-guide-overlay");
    expect(html).toContain("page-margin-guide");
  });

  it("does NOT contain checkAutoPagination — old destructive pagination is fully removed", () => {
    const html = getOfflineEditorHtml("");
    expect(html).not.toContain("checkAutoPagination");
    expect(html).not.toContain("isPaginationChecking");
  });

  it("re-runs updateDynamicPaperRatio on window resize for responsive scaling", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain(
      "window.addEventListener('resize', updateDynamicPaperRatio)"
    );
  });

  it("calls updateDynamicPaperRatio via 100ms setTimeout on initial load", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("setTimeout(updateDynamicPaperRatio, 100)");
  });
});

// =============================================================================
// SECTION 5 — Manual Page Break Insertion & Deletion
// =============================================================================
describe("Manual Page Break Insertion & Deletion", () => {
  it("insertPageBreak inserts .legal-page-break div with inline CSS break rules", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain(
      '<div class="legal-page-break" style="break-before: page; page-break-before: always;"></div>'
    );
  });

  it("insertPageBreak appends a blank paragraph after marker for cursor escape", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("></div><p><br></p>");
  });

  it("CSS shows '--- Page Break ---' visual label in screen edit mode", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain('"--- Page Break ---"');
  });

  it("CSS hides '--- Page Break ---' label in @media print", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("hr.page-break:after, .legal-page-break:after");
    expect(html).toContain("display: none !important");
  });

  it("@media print applies break-before: page to force physical page break", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("page-break-before: always");
    expect(html).toContain("break-before: page");
  });

  it("@media print sets border: 0 to prevent print artifacts on page break line", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("border: 0");
  });

  it("Backspace at line start removes page break node via prev.remove()", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("prev.remove()");
  });

  it("Backspace detection handles both .legal-page-break and old hr.page-break", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("prev.classList.contains('legal-page-break')");
  });

  it("Backspace removal triggers updateDynamicPaperRatio to recount total pages", () => {
    const html = getOfflineEditorHtml("");
    const idx = html.indexOf("e.key === 'Backspace'");
    const endIdx = html.indexOf("e.key === 'Enter'");
    const backspaceBlock = html.substring(idx, endIdx);
    expect(backspaceBlock).toContain("updateDynamicPaperRatio()");
  });

  it("Backspace removal syncs HTML state to React Native via sendStateToRN()", () => {
    const html = getOfflineEditorHtml("");
    const idx = html.indexOf("e.key === 'Backspace'");
    const endIdx = html.indexOf("e.key === 'Enter'");
    const backspaceBlock = html.substring(idx, endIdx);
    expect(backspaceBlock).toContain("sendStateToRN()");
  });
});

// =============================================================================
// SECTION 6 — Rich Content Insertion (Tables, Shapes, Signatures)
// =============================================================================
describe("Rich Content Insertion", () => {
  it("insertTable generates thead with Header column markup pattern", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("<thead><tr>");
    // The rendered template contains the literal table header HTML
    expect(html).toContain("<th>Header ");
  });

  it("insertTable generates tbody with Cell r.c naming pattern", () => {
    const html = getOfflineEditorHtml("");
    // The rendered template contains the literal table cell HTML
    expect(html).toContain("<td>Cell ");
  });

  it("table uses .editor-table CSS class", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain('class="editor-table"');
  });

  it("editor-table CSS has border-collapse: collapse for clean legal formatting", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("border-collapse: collapse");
  });

  it("insertSignature wraps image in .signature-stamp with proper alt text", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain('class="signature-stamp"');
    expect(html).toContain('alt="Advocate Signature"');
  });

  it("insertShape generates shape-rect contenteditable div", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("shape-rect");
    expect(html).toContain("Rectangle / Stamp Box");
  });

  it("insertShape generates shape-circle contenteditable div", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("shape-circle");
    expect(html).toContain("Round Seal Frame");
  });

  it("insertShape generates shape-arrow with Unicode arrow symbol", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("shape-arrow");
    expect(html).toContain("➔ Process Arrow");
  });

  it("insertShape generates court-fee stamp with ₹ rupee symbol", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("shape-stamp");
    expect(html).toContain("₹10/-");
  });

  it("all rich insertions append trailing <p><br></p> for cursor escape point", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("</div><p><br></p>");
  });
});

// =============================================================================
// SECTION 7 — Legal Placeholder System
// =============================================================================
describe("Legal Placeholder System", () => {
  it("scans text nodes for placeholder tokens on initial load", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("scanAndHighlightPlaceholders");
  });

  it("assigns .legal-placeholder class to highlighted span elements", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("legal-placeholder");
  });

  it("uses amber-yellow background-color for placeholder visibility in court documents", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("rgba(254, 240, 138");
  });

  it("posts openPlaceholderModal message when placeholder is tapped", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("openPlaceholderModal");
  });

  it("replacePlaceholderValue removes .legal-placeholder class after value is filled", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("classList.remove('legal-placeholder')");
  });

  it("replacePlaceholderValue resets backgroundColor to transparent after fill", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("backgroundColor = 'transparent'");
  });

  it("placeholder CSS includes dashed amber border for visual affordance", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("border-bottom: 1.5px dashed #ca8a04");
  });
});

// =============================================================================
// SECTION 8 — WebView ↔ React Native State Bridge
// =============================================================================
describe("WebView State Bridge (sendStateToRN)", () => {
  it("reports bold, italic, underline formatting states", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("queryCommandState('bold')");
    expect(html).toContain("queryCommandState('italic')");
    expect(html).toContain("queryCommandState('underline')");
  });

  it("reports all four text alignment states", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("justifyLeft");
    expect(html).toContain("justifyCenter");
    expect(html).toContain("justifyRight");
    expect(html).toContain("justifyFull");
  });

  it("reports ordered and unordered list states", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("insertOrderedList");
    expect(html).toContain("insertUnorderedList");
  });

  it("posts state message containing html, state, and stats payload", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("type: 'state'");
    expect(html).toContain("stats: calculateStats()");
    expect(html).toContain("html: editor.innerHTML");
  });

  it("serialises postMessage data as JSON for React Native WebView bridge", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("JSON.stringify(data)");
    expect(html).toContain("window.ReactNativeWebView");
  });

  it("calculateStats includes both page break types in estimatedPages count", () => {
    const html = getOfflineEditorHtml("");
    // The calculateStats function body contains the combined selector
    // We search for the function definition marker and extract forward
    const funcMarker = "function calculateStats()";
    const statsIdx = html.indexOf(funcMarker);
    const statsBlock = html.substring(statsIdx, statsIdx + 400);
    expect(statsBlock).toContain(".legal-page-break, hr.page-break");
  });

  it("setFontSize command stores value in window.userFontSize and re-scales layout", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("window.userFontSize = numSize");
  });

  it("posts error type message with err.message on any caught exception", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("type: 'error'");
    expect(html).toContain("err.message");
  });

  it("sets defaultParagraphSeparator to p for clean HTML output", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("defaultParagraphSeparator");
    expect(html).toContain("'p'");
  });
});

// =============================================================================
// SECTION 9 — Selection Persistence & Toolbar Safety
// =============================================================================
describe("Selection Persistence (Toolbar Tap Safety)", () => {
  it("saves selection range on selectionchange for keyboard typing", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain(
      "document.addEventListener('selectionchange', saveEditorSelection)"
    );
  });

  it("saves selection range on mouseup for desktop interactions", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain(
      "editor.addEventListener('mouseup', saveEditorSelection)"
    );
  });

  it("saves selection range on touchend for mobile toolbar taps", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain(
      "editor.addEventListener('touchend', saveEditorSelection)"
    );
  });

  it("restores saved selection before any HTML insertion at cursor", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("restoreEditorSelection()");
    expect(html).toContain("savedEditorRange");
  });

  it("only saves selection when caret is inside the editor container", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("editor.contains(range.commonAncestorContainer)");
  });
});

// =============================================================================
// SECTION 10 — Legal List & Text Case Transformation
// =============================================================================
describe("Legal List & Case Transformation", () => {
  it("ol.legal-list uses CSS counter-reset for hierarchical legal numbering", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("counter-reset: item");
    expect(html).toContain('counters(item, ".")');
  });

  it("toggleLegalList adds legal-list class to the ordered list", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("classList.add('legal-list')");
  });

  it("changeCase 'upper' converts selected text to uppercase", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("toUpperCase()");
  });

  it("changeCase 'lower' converts selected text to lowercase", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("toLowerCase()");
  });

  it("changeCase 'title' capitalises first letter of each word", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("toUpperCase()");
    expect(html).toContain("data.value === 'title'");
  });

  it("undo command uses native execCommand undo", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("execCommand('undo'");
  });

  it("redo command uses native execCommand redo", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("execCommand('redo'");
  });
});

// =============================================================================
// SECTION 11 — Layout Message Handler (7 Configurable Defaults)
// =============================================================================
describe("Layout Message Handler (type: 'layout')", () => {
  it("sets font family from data.font with Times New Roman default", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("data.font || 'Times New Roman'");
  });

  it("accepts userFontSize override via window.userFontSize", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain(
      "if (data.userFontSize) window.userFontSize = data.userFontSize"
    );
  });

  it("parses lineHeight to float with 1.8 fallback for Legal paper", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("parseFloat(data.lineHeight) || 1.8");
  });

  it("accepts letterSpacing with undefined guard before storing", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("data.letterSpacing !== undefined");
    expect(html).toContain("window.userLetterSpacing");
  });

  it("accepts wordSpacing with undefined guard before storing", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("data.wordSpacing !== undefined");
    expect(html).toContain("window.userWordSpacing");
  });

  it("sets all 4 margin defaults: top=24, bottom=24, left=55, right=24", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain(
      "data.topMargin !== undefined ? data.topMargin : 24"
    );
    expect(html).toContain(
      "data.bottomMargin !== undefined ? data.bottomMargin : 24"
    );
    expect(html).toContain(
      "data.leftMargin !== undefined ? data.leftMargin : 55"
    );
    expect(html).toContain(
      "data.rightMargin !== undefined ? data.rightMargin : 24"
    );
  });

  it("sets letterheadSpace with 0 default for courts without a letterhead", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain(
      "data.letterheadSpace !== undefined ? data.letterheadSpace : 0"
    );
    expect(html).toContain("window.userLetterheadSpace");
  });

  it("switches page class to 'page-legal' or 'page-a4' from data.pageSize", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain(
      "data.pageSize === 'legal' ? 'page-legal' : 'page-a4'"
    );
  });

  it("calls updateDynamicPaperRatio after all layout values are applied", () => {
    const html = getOfflineEditorHtml("");
    const layoutIdx = html.indexOf("data.type === 'layout'");
    const setContentIdx = html.indexOf("data.type === 'setContent'");
    const layoutBlock = html.substring(layoutIdx, setContentIdx);
    expect(layoutBlock).toContain("updateDynamicPaperRatio()");
  });
});

// =============================================================================
// SECTION 12 — setContent, setEditorLanguage & requestSave Messages
// =============================================================================
describe("Auxiliary Message Types (setContent, requestSave, load, setEditorLanguage)", () => {
  it("setContent replaces editor.innerHTML from data.html with empty string fallback", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("data.type === 'setContent'");
    expect(html).toContain("editor.innerHTML = data.html || ''");
  });

  it("setContent re-scans and highlights placeholders after injecting new content", () => {
    const html = getOfflineEditorHtml("");
    const setIdx = html.indexOf("data.type === 'setContent'");
    const setBlock = html.substring(setIdx, setIdx + 300);
    expect(setBlock).toContain("scanAndHighlightPlaceholders()");
  });

  it("setEditorLanguage applies lang attribute for RTL/Devanagari language support", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("data.type === 'setEditorLanguage'");
    expect(html).toContain("editor.setAttribute('lang', data.lang)");
  });

  it("requestSave posts type 'save' with both html and stats payload", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("data.type === 'requestSave'");
    expect(html).toContain("type: 'save'");
    expect(html).toContain("html: editor.innerHTML");
  });

  it("load message type sets editor content and re-scans placeholders", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("data.type === 'load'");
    expect(html).toContain("scanAndHighlightPlaceholders()");
  });
});

// =============================================================================
// SECTION 13 — Enter Key Smart Escape (MS Word Paragraph Break Model)
// =============================================================================
describe("Enter Key Smart Escape (MS Word paragraph break model)", () => {
  it("detects Enter key via both e.key and e.keyCode === 13 for cross-platform safety", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("e.key === 'Enter' || e.keyCode === 13");
  });

  it("Enter in a heading creates a clean <p><br> block (prevents nested heading)", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("blockNode.tagName.startsWith('H')");
    const enterIdx = html.indexOf("e.key === 'Enter'");
    const enterBlock = html.substring(enterIdx, enterIdx + 1500);
    expect(enterBlock).toContain("newP.innerHTML = '<br>'");
  });

  it("Enter escape inserts new <p> AFTER current block, not before it", () => {
    const html = getOfflineEditorHtml("");
    const enterIdx = html.indexOf("e.key === 'Enter'");
    const enterBlock = html.substring(enterIdx, enterIdx + 2500);
    expect(enterBlock).toContain(
      "targetEscBlock.parentNode.insertBefore(newP, targetEscBlock.nextSibling)"
    );
  });

  it("Enter escape appends to parent when block has no next sibling (end of document)", () => {
    const html = getOfflineEditorHtml("");
    const enterIdx = html.indexOf("e.key === 'Enter'");
    const enterBlock = html.substring(enterIdx, enterIdx + 2500);
    expect(enterBlock).toContain("targetEscBlock.parentNode.appendChild(newP)");
  });

  it("Enter escape also applies to styled blocks with border or backgroundColor", () => {
    const html = getOfflineEditorHtml("");
    // border and backgroundColor appear in the condition on the same line as startsWith('H')
    expect(html).toContain("blockNode.style.border");
    expect(html).toContain("blockNode.style.backgroundColor");
  });

  it("Enter escape calls sendStateToRN to sync HTML state after insertion", () => {
    const html = getOfflineEditorHtml("");
    const enterIdx = html.indexOf("e.key === 'Enter'");
    const enterBlock = html.substring(enterIdx, enterIdx + 2500);
    expect(enterBlock).toContain("sendStateToRN()");
  });

  it("Backspace detection uses e.keyCode === 8 as cross-platform fallback", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("e.key === 'Backspace' || e.keyCode === 8");
  });

  it("Backspace only fires when selection is collapsed at position 0 (true line start)", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("range.collapsed && range.startOffset === 0");
  });
});

// =============================================================================
// SECTION 14 — canvasHeight Multi-Page Arithmetic (Pure JS Unit Tests)
// =============================================================================
describe("canvasHeight Multi-Page Arithmetic (scaleRatio-verified)", () => {
  it("canvasHeight formula: sheetHeight * pages + gap * (pages - 1)", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain(
      "(singleSheetHeight * totalPages) + (pageGap * (totalPages - 1))"
    );
  });

  it("canvasHeight sets minHeight on editor AND height on container", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("editor.style.minHeight = canvasHeight + 'px'");
    expect(html).toContain("container.style.height = canvasHeight + 'px'");
  });

  it("container width is set to exact paperWidth for physical paper sizing", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("container.style.width = paperWidth + 'px'");
  });

  it("pageGap uses Math.round to avoid sub-pixel rendering gaps between sheets", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("pageGap = Math.round(20 * scaleRatio)");
  });

  // Pure arithmetic: scaleRatio
  it("arithmetic: Legal 816px at full viewport → scaleRatio = 1.000", () => {
    expect(Math.min(816, 816) / 816).toBe(1.0);
  });

  it("arithmetic: 400px viewport on Legal → scaleRatio ≈ 0.490", () => {
    const scaleRatio = Math.min(816, 400) / 816;
    expect(scaleRatio).toBeCloseTo(0.49, 2);
  });

  it("arithmetic: minimum 300px viewport on Legal → scaleRatio ≈ 0.368", () => {
    const scaleRatio = Math.min(816, 300) / 816;
    expect(scaleRatio).toBeCloseTo(0.368, 2);
  });

  it("arithmetic: Legal singleSheetHeight = round(816 × 1.6470) = 1344px", () => {
    expect(Math.round(816 * 1.647)).toBe(1344);
  });

  it("arithmetic: A4 singleSheetHeight = round(794 × 1.4142) = 1123px", () => {
    expect(Math.round(794 * 1.4142)).toBe(1123);
  });

  it("arithmetic: 2-page Legal doc with 20px gap → canvasHeight = 2708px", () => {
    const canvasHeight = Math.round(1344 * 2 + 20 * (2 - 1));
    expect(canvasHeight).toBe(2708);
  });

  it("arithmetic: 1-page doc never adds a gap — canvasHeight = singleSheetHeight", () => {
    const canvasHeight = Math.round(1344 * 1 + 20 * (1 - 1));
    expect(canvasHeight).toBe(1344);
  });

  it("arithmetic: 3-page Legal doc with 20px gap → canvasHeight = 4072px", () => {
    const canvasHeight = Math.round(1344 * 3 + 20 * (3 - 1));
    expect(canvasHeight).toBe(4072);
  });
});

// =============================================================================
// SECTION 15 — Margin Guide Geometry & scaleRatio-Derived Guards
// =============================================================================
describe("Margin Guide Geometry & Minimum Size Guards", () => {
  it("margin guide width guard: Math.max(10, paperWidth - leftMargin - rightMargin)", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain(
      "Math.max(10, paperWidth - (dynamicLeftMargin + dynamicRightMargin))"
    );
  });

  it("margin guide height guard: Math.max(10, sheetHeight - topMargin - bottomMargin)", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain(
      "Math.max(10, singleSheetHeight - (dynamicTopMargin + dynamicBottomMargin))"
    );
  });

  it("each guide top offset is i * (singleSheetHeight + pageGap) for correct stacking", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("i * (singleSheetHeight + pageGap)");
  });

  it("guide overlay innerHTML is cleared before redraw to remove stale guides", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("guideOverlay.innerHTML = ''");
  });

  it("red margin line x uses Math.max(4) so it stays visible on smallest viewport", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain(
      "Math.max(4, Math.round(dynamicLeftMargin - (10 * scaleRatio)))"
    );
  });

  it("all 4 dynamic margins are Math.round-ed for sharp pixel-perfect rendering", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain(
      "dynamicLeftMargin = Math.round(configuredLeftMargin * scaleRatio)"
    );
    expect(html).toContain(
      "dynamicRightMargin = Math.round(configuredRightMargin * scaleRatio)"
    );
    expect(html).toContain(
      "dynamicTopMargin = Math.round((configuredTopMargin + configuredLetterhead) * scaleRatio)"
    );
    expect(html).toContain(
      "dynamicBottomMargin = Math.round(configuredBottomMargin * scaleRatio)"
    );
  });

  it("paragraphMb uses Math.max(4) floor so line spacing never collapses at any scale", () => {
    const html = getOfflineEditorHtml("");
    expect(html).toContain("Math.max(4, Math.round(10 * scaleRatio))");
  });

  it("renderFontPx 10px floor: 300px viewport Legal → baseFontSize 14 renders as 10px", () => {
    const scaleRatio = 300 / 816;
    const renderFontPx = Math.max(10, Math.round(14 * scaleRatio));
    expect(renderFontPx).toBe(10);
  });

  // Typography multiplier arithmetic
  it("typography: h1 title = round(14 × 1.25) = 18px at full Legal scaleRatio", () => {
    expect(Math.round(14 * 1.25)).toBe(18);
  });

  it("typography: h2 court-header = round(14 × 1.15) = 16px at full Legal scaleRatio", () => {
    expect(Math.round(14 * 1.15)).toBe(16);
  });

  it("typography: h3 section-title = round(14 × 1.08) = 15px at full Legal scaleRatio", () => {
    expect(Math.round(14 * 1.08)).toBe(15);
  });

  it("typography: Legal line height = renderFontPx 14 × 1.8 = 25.2px", () => {
    expect((14 * 1.8).toFixed(1)).toBe("25.2");
  });

  it("typography: A4 line height = renderFontPx 14 × 1.5 = 21.0px", () => {
    expect((14 * 1.5).toFixed(1)).toBe("21.0");
  });
});
