// utils/realTiptapEditorTemplate.ts
import { TIPTAP_OFFLINE_BUNDLE_JS } from "./tiptapOfflineBundle";

/**
 * Sanitizes template and draft HTML for Tiptap ProseMirror DOMParser
 */
export function cleanHtmlForTiptap(rawHtml: string): string {
  if (!rawHtml) return '<p></p>';
  let cleaned = String(rawHtml);
  cleaned = cleaned.replace(/<!-- CD_LAYOUT:[\s\S]*?-->/g, '');
  if (cleaned.includes('<body') && cleaned.includes('</body>')) {
    const match = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (match && match[1]) {
      cleaned = match[1];
    }
  }
  cleaned = cleaned.replace(/<!DOCTYPE[^>]*>/gi, '');
  cleaned = cleaned.replace(/<html[^>]*>/gi, '').replace(/<\/html>/gi, '');
  cleaned = cleaned.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
  cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<div id="red-margin-line"[^>]*>[\s\S]*?<\/div>/gi, '');
  cleaned = cleaned.replace(/<div id="margin-guide-overlay"[^>]*>[\s\S]*?<\/div>/gi, '');
  cleaned = cleaned.trim();
  if (!cleaned) return '<p></p>';
  return cleaned;
}

/**
 * True Production-Grade Tiptap v3 & ProseMirror AST Offline Editor Engine for CaseDiaryNew.
 * Completely eliminates document.execCommand in favor of Tiptap / ProseMirror AST state tree.
 * Runs 100% offline inside React Native WebView with zero external CDN dependencies.
 */
export const getRealTiptapEditorHtml = (initialHtml: string = ""): string => {
  const sanitizedInitialHtml = cleanHtmlForTiptap(initialHtml || "<p></p>");
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    * {
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      min-height: 100%;
      background-color: #e5e7eb;
      font-family: 'Times New Roman', Georgia, serif;
    }
    body {
      padding: 8px 4px 40px 4px;
      display: flex;
      justify-content: center;
      box-sizing: border-box;
    }
    .page-container {
      position: relative;
      margin: 0 auto;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18), 0 4px 12px rgba(0, 0, 0, 0.08);
      border-radius: 6px;
      overflow: hidden;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      box-sizing: border-box;
      width: 100%;
      max-width: 816px;
    }
    .page-margin-guide {
      position: absolute;
      pointer-events: none;
      border: 1px dashed #cbd5e1;
      border-radius: 2px;
      box-sizing: border-box;
      z-index: 1;
      opacity: 0.85;
    }
    .court-running-header {
      position: absolute;
      left: 0;
      right: 0;
      font-family: sans-serif;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      text-align: center;
      pointer-events: none;
      z-index: 5;
    }
    .court-running-footer {
      position: absolute;
      left: 0;
      right: 0;
      font-family: sans-serif;
      font-weight: 600;
      color: #64748b;
      text-align: center;
      pointer-events: none;
      z-index: 5;
    }
    .page-sheet-divider {
      position: absolute;
      left: 0;
      right: 0;
      background-color: #e5e7eb;
      border-top: 1px dashed #cbd5e1;
      border-bottom: 1px dashed #cbd5e1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: sans-serif;
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.5px;
      pointer-events: none;
      z-index: 2;
    }
    #editor {
      outline: none;
      width: 100%;
      min-height: 100%;
      background-color: #ffffff;
      padding: 28px 24px 48px 52px;
      box-sizing: border-box;
      word-wrap: break-word;
      overflow-wrap: break-word;
      word-break: break-word;
      font-family: 'Times New Roman', Georgia, serif;
      font-size: 16px;
      line-height: 1.8;
      color: #111827;
    }
    .tiptap {
      outline: none !important;
      min-height: 100%;
      font-size: inherit;
      line-height: inherit;
      color: inherit;
    }
    .tiptap p {
      margin: 0 0 12px 0;
      font-size: inherit;
      line-height: inherit;
      break-inside: avoid-page;
      page-break-inside: avoid;
    }
    .tiptap p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      float: left;
      color: #94a3b8;
      pointer-events: none;
      height: 0;
    }
    .tiptap h1, .tiptap h2, .tiptap h3, .tiptap h4 {
      break-after: avoid-page;
      page-break-after: avoid;
      break-inside: avoid-page;
      page-break-inside: avoid;
      font-weight: bold;
      margin: 16px 0 10px 0;
    }
    .tiptap h1 { font-size: 1.35em; text-align: center; }
    .tiptap h2 { font-size: 1.22em; text-align: center; }
    .tiptap h3 { font-size: 1.12em; }
    .tiptap blockquote {
      border-left: 4px solid #cbd5e1;
      padding-left: 14px;
      margin: 12px 0;
      color: #475569;
      font-style: italic;
    }
    .tiptap ul, .tiptap ol {
      margin: 0 0 12px 24px;
      padding: 0;
    }
    .tiptap li {
      margin-bottom: 6px;
    }
    .tiptap hr.page-break, .tiptap .legal-page-break {
      display: block;
      page-break-before: always;
      break-before: page;
      height: 0;
      margin: 20px 0;
      border: 0;
      border-top: 1px dashed #94a3b8;
      position: relative;
      -webkit-user-select: none;
      user-select: none;
      pointer-events: none;
    }
    .tiptap hr.page-break:after, .tiptap .legal-page-break:after {
      content: "--- MS Word Page Break ---";
      position: absolute;
      top: -10px;
      left: 50%;
      transform: translateX(-50%);
      background: #f1f5f9;
      padding: 0 10px;
      font-size: 10px;
      color: #64748b;
      font-weight: bold;
      font-family: sans-serif;
    }
    /* Real Tiptap Tables */
    .tiptap table, .editor-table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      table-layout: fixed;
      break-inside: avoid-page;
      page-break-inside: avoid;
    }
    .tiptap td, .tiptap th, .editor-table td, .editor-table th {
      border: 1px solid #94a3b8;
      padding: 8px;
      font-size: 15px;
      vertical-align: top;
      box-sizing: border-box;
      position: relative;
    }
    .tiptap th, .editor-table th {
      background-color: #f1f5f9;
      font-weight: bold;
    }
    .signature-stamp {
      max-height: 90px;
      max-width: 220px;
      margin: 12px 0;
      display: block;
      break-inside: avoid-page;
      page-break-inside: avoid;
    }
    .interactive-shape {
      display: inline-block;
      min-width: 120px;
      min-height: 44px;
      padding: 8px 12px;
      margin: 10px 0;
      box-sizing: border-box;
      position: relative;
      user-select: text;
      break-inside: avoid-page;
      page-break-inside: avoid;
    }
    .shape-rect {
      border: 2px solid #374151;
      background: #f9fafb;
      border-radius: 4px;
    }
    .shape-circle {
      border: 2px dashed #1e3a8a;
      background: #eff6ff;
      border-radius: 50%;
      text-align: center;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 100px;
      min-height: 100px;
    }
    .shape-arrow {
      border: 1.5px solid #2563eb;
      background: #dbeafe;
      color: #1e40af;
      border-radius: 20px;
      font-weight: 600;
      text-align: center;
    }
    .shape-stamp {
      border: 2px double #991b1b;
      background: #fef2f2;
      color: #991b1b;
      font-weight: 700;
      text-align: center;
      border-radius: 4px;
    }
    .legal-placeholder {
      background-color: rgba(254, 240, 138, 0.75);
      border-bottom: 1.5px dashed #ca8a04;
      padding: 0 3px;
      border-radius: 2px;
      cursor: pointer;
      font-weight: 500;
      color: #1c1917;
    }
    .active-selected-element {
      outline: 2.5px solid #2563eb !important;
      box-shadow: 0 0 8px rgba(37, 99, 235, 0.3);
    }
  </style>
</head>
<body>
  <div class="page-container">
    <div id="red-margin-line" style="position: absolute; left: 38px; top: 0; bottom: 0; width: 2px; background-color: #dc2626; opacity: 0.95; pointer-events: none; z-index: 15;"></div>
    <div id="editor"></div>
  </div>

  <!-- 100% Offline Standalone Tiptap v3 & ProseMirror Engine Bundle -->
  <script>
    ${TIPTAP_OFFLINE_BUNDLE_JS}
  </script>

  <script>
    function cleanHtmlForTiptap(rawHtml) {
      if (!rawHtml) return '<p></p>';
      var str = String(rawHtml);
      var bStart = str.indexOf('<body');
      if (bStart !== -1) {
        var bTagEnd = str.indexOf('>', bStart);
        var bEnd = str.indexOf('</body', bTagEnd);
        if (bTagEnd !== -1 && bEnd !== -1) {
          str = str.substring(bTagEnd + 1, bEnd);
        }
      }
      str = str.replace(new RegExp('<!-- CD_LAYOUT:[\\s\\S]*?-->', 'g'), '');
      str = str.replace(new RegExp('<!DOCTYPE[^>]*>', 'gi'), '');
      str = str.replace(new RegExp('<html[^>]*>', 'gi'), '');
      str = str.replace(new RegExp('<\\/html>', 'gi'), '');
      str = str.replace(new RegExp('<head[^>]*>[\\s\\S]*?<\\/head>', 'gi'), '');
      str = str.replace(new RegExp('<style[^>]*>[\\s\\S]*?<\\/style>', 'gi'), '');
      str = str.replace(new RegExp('<script[^>]*>[\\s\\S]*?<\\/script>', 'gi'), '');
      str = str.replace(new RegExp('<div id="red-margin-line"[^>]*>[\\s\\S]*?<\\/div>', 'gi'), '');
      str = str.replace(new RegExp('<div id="margin-guide-overlay"[^>]*>[\\s\\S]*?<\\/div>', 'gi'), '');
      str = str.trim();
      return str || '<p></p>';
    }

    const initialContentHtml = ${JSON.stringify(sanitizedInitialHtml)};
    const editorEl = document.getElementById('editor');
    let selectedElement = null;

    function postMessage(data) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }
    }

    function logTiptapEvent(tag, message, payload = null) {
      try {
        console.log('[Tiptap:' + tag + '] ' + message, payload ? JSON.stringify(payload) : '');
      } catch (e) {}
    }

    // Initialize True Tiptap Engine with ProseMirror AST
    let editor = null;
    try {
      editor = new Tiptap.Editor({
        element: editorEl,
        extensions: [
          Tiptap.StarterKit.configure({
            heading: { levels: [1, 2, 3, 4, 5, 6] },
          }),
          Tiptap.Underline,
          Tiptap.Table.configure({
            resizable: true,
            HTMLAttributes: {
              class: 'editor-table',
            },
          }),
          Tiptap.TableRow,
          Tiptap.TableCell,
          Tiptap.TableHeader,
          Tiptap.Placeholder.configure({
            placeholder: 'Start drafting legal pleading...',
          }),
        ],
        content: initialContentHtml,
        autofocus: false,
        editable: true,
        onUpdate() {
          sendStateToRN(false);
        },
        onSelectionUpdate() {
          sendStateToRN(false);
        },
      });
      console.log('[Tiptap:INIT] Tiptap Engine initialized successfully');
    } catch (err) {
      console.error('Failed to instantiate Tiptap Editor:', err);
      postMessage({ type: 'error', error: 'Tiptap init error: ' + err.message });
    }

    // Keyboard Shortcuts (Ctrl+Enter for page break)
    if (editorEl) {
      editorEl.addEventListener('keydown', (e) => {
        const isCtrl = e.ctrlKey || e.metaKey;
        if (isCtrl && e.key === 'Enter') {
          e.preventDefault();
          if (editor) {
            editor.chain().focus().insertContent('<div class="legal-page-break" data-type="page-break" contenteditable="false" style="break-before: page; page-break-before: always; user-select: none;"></div><p></p>').run();
          }
        }
      });
    }

    function calculateStats() {
      if (!editor) return { wordCount: 0, charCount: 0, estimatedPages: 1, text: '' };
      const text = editor.getText() || '';
      const cleanText = text.trim();
      const wordCount = cleanText ? cleanText.split(/\\s+/).length : 0;
      const charCount = cleanText.length;
      const html = editor.getHTML() || '';
      const pageBreaks = (html.match(/legal-page-break|hr class="page-break"/g) || []).length;
      const estimatedPages = Math.max(1 + pageBreaks, Math.ceil(wordCount / 350) || 1);
      return { wordCount, charCount, estimatedPages, text: cleanText };
    }

    function getPaperMetrics() {
      const outerPadding = 8;
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth || (window.screen ? window.screen.width : 360);
      const availableWidth = Math.max(300, viewportWidth - outerPadding);
      const isLegal = editorEl ? editorEl.classList.contains('page-legal') : true;
      const referenceWidth = isLegal ? 816 : 794;
      const paperWidth = Math.min(referenceWidth, availableWidth);
      const scaleRatio = paperWidth / referenceWidth;
      const heightRatio = isLegal ? 1.6470 : 1.4142;
      const singleSheetHeight = Math.round(paperWidth * heightRatio);
      return { paperWidth, referenceWidth, scaleRatio, heightRatio, singleSheetHeight, isLegal };
    }

    function getRealContentHeight() {
      if (!editorEl) return 0;
      const tiptapRoot = editorEl.querySelector('.tiptap') || editorEl;
      const children = tiptapRoot.children;
      if (!children || children.length === 0) return 0;
      let maxBottom = 0;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.id === 'red-margin-line' || child.id === 'margin-guide-overlay' || child.classList.contains('page-sheet-divider')) continue;
        const bottom = (child.offsetTop || 0) + (child.offsetHeight || 0);
        if (bottom > maxBottom) {
          maxBottom = bottom;
        }
      }
      return maxBottom;
    }

    function updateDynamicPaperRatio() {
      const container = document.querySelector('.page-container');
      if (!container || !editorEl) return;
      
      const metrics = getPaperMetrics();
      const paperWidth = metrics.paperWidth;
      const singleSheetHeight = metrics.singleSheetHeight;
      const scaleRatio = metrics.scaleRatio;

      const configuredLeftMargin = window.userLeftMargin !== undefined ? window.userLeftMargin : 36;
      const configuredRightMargin = window.userRightMargin !== undefined ? window.userRightMargin : 16;
      const configuredTopMargin = window.userTopMargin !== undefined ? window.userTopMargin : 16;
      const configuredBottomMargin = window.userBottomMargin !== undefined ? window.userBottomMargin : 16;
      const configuredLetterhead = window.userLetterheadSpace !== undefined ? window.userLetterheadSpace : 0;
      
      const dynamicLeftMargin = Math.round(configuredLeftMargin * scaleRatio);
      const dynamicRightMargin = Math.round(configuredRightMargin * scaleRatio);
      const dynamicTopMargin = Math.round((configuredTopMargin + configuredLetterhead) * scaleRatio);
      const dynamicBottomMargin = Math.round(configuredBottomMargin * scaleRatio);

      const printableSheetHeight = Math.max(100, singleSheetHeight - (dynamicTopMargin + dynamicBottomMargin));
      const pageBreakElements = editorEl.querySelectorAll('.legal-page-break, hr.page-break');
      const pageBreakCount = pageBreakElements.length;

      const contentHeight = getRealContentHeight();
      const actualContentHeight = Math.max(0, contentHeight - dynamicTopMargin);
      const overflowPages = Math.max(1, Math.ceil(actualContentHeight / printableSheetHeight));
      const totalPages = Math.max(1, pageBreakCount + 1, overflowPages);
      
      const pageGap = Math.round(20 * scaleRatio);
      const canvasHeight = Math.round((singleSheetHeight * totalPages) + (pageGap * (totalPages - 1)));
      container.style.width = paperWidth + 'px';
      container.style.margin = '0 auto';
      editorEl.style.minHeight = canvasHeight + 'px';
      container.style.height = canvasHeight + 'px';
      
      // Proportional font, line-height, spacing & padding derived strictly from scaleRatio
      const baseFontSize = window.userFontSize || 14;
      const renderFontPx = Math.max(11, Math.round(baseFontSize * scaleRatio));

      const baseLineRatio = window.userLineHeightRatio || (metrics.isLegal ? 1.8 : 1.5);
      const renderLineHeightPx = (renderFontPx * baseLineRatio).toFixed(1);

      const baseLetterSpace = window.userLetterSpacing || 0;
      const renderLetterSpacePx = (baseLetterSpace * scaleRatio).toFixed(2);

      const baseWordSpace = window.userWordSpacing || 0;
      const renderWordSpacePx = (baseWordSpace * scaleRatio).toFixed(2);

      const titlePx = Math.round(renderFontPx * 1.35);
      const headerPx = Math.round(renderFontPx * 1.22);
      const sectionPx = Math.round(renderFontPx * 1.12);
      const paragraphMb = Math.max(4, Math.round(10 * scaleRatio));
      const padBottomPx = Math.round(30 * scaleRatio);

      let dynamicStyle = document.getElementById('dynamic-paper-scale-style');
      if (!dynamicStyle) {
        dynamicStyle = document.createElement('style');
        dynamicStyle.id = 'dynamic-paper-scale-style';
        document.head.appendChild(dynamicStyle);
      }
      
      const newStyleContent = 
        '#editor, .tiptap { font-size: ' + renderFontPx + 'px; line-height: ' + renderLineHeightPx + 'px; letter-spacing: ' + renderLetterSpacePx + 'px; word-spacing: ' + renderWordSpacePx + 'px; padding-bottom: ' + padBottomPx + 'px; } ' +
        '.tiptap p, .tiptap div, .tiptap li, .tiptap blockquote { font-size: inherit; line-height: inherit; letter-spacing: inherit; word-spacing: inherit; margin-bottom: ' + paragraphMb + 'px; } ' +
        '.tiptap .title, .tiptap h1 { font-size: ' + titlePx + 'px; margin-bottom: ' + Math.round(10 * scaleRatio) + 'px; line-height: ' + (titlePx * 1.3).toFixed(1) + 'px; } ' +
        '.tiptap .court-header, .tiptap h2 { font-size: ' + headerPx + 'px; margin-bottom: ' + Math.round(12 * scaleRatio) + 'px; line-height: ' + (headerPx * 1.35).toFixed(1) + 'px; } ' +
        '.tiptap .section-title, .tiptap h3 { font-size: ' + sectionPx + 'px; } ' +
        '.tiptap table, .editor-table { font-size: ' + Math.max(10, Math.round(renderFontPx * 0.95)) + 'px; } ' +
        '.tiptap td, .tiptap th, .editor-table td, .editor-table th { padding: ' + Math.max(4, Math.round(8 * scaleRatio)) + 'px; } ' +
        '.tiptap .legal-page-break + *, .tiptap hr.page-break + * { margin-top: ' + Math.round((window.userTopMargin || 16) * scaleRatio) + 'px; }';

      if (dynamicStyle.innerHTML !== newStyleContent) {
        dynamicStyle.innerHTML = newStyleContent;
      }
      
      editorEl.style.paddingLeft = dynamicLeftMargin + 'px';
      editorEl.style.paddingRight = dynamicRightMargin + 'px';
      editorEl.style.paddingTop = dynamicTopMargin + 'px';
      
      const redMargin = document.getElementById('red-margin-line');
      if (redMargin) {
        redMargin.style.left = Math.max(4, Math.round(dynamicLeftMargin - (10 * scaleRatio))) + 'px';
      }

      let guideOverlay = document.getElementById('margin-guide-overlay');
      if (!guideOverlay) {
        guideOverlay = document.createElement('div');
        guideOverlay.id = 'margin-guide-overlay';
        guideOverlay.style.position = 'absolute';
        guideOverlay.style.top = '0';
        guideOverlay.style.left = '0';
        guideOverlay.style.right = '0';
        guideOverlay.style.bottom = '0';
        guideOverlay.style.pointerEvents = 'none';
        guideOverlay.style.zIndex = '1';
        container.appendChild(guideOverlay);
      }

      guideOverlay.innerHTML = '';
      for (let i = 0; i < totalPages; i++) {
        const sheetTop = i * (singleSheetHeight + pageGap);
        const guide = document.createElement('div');
        guide.className = 'page-margin-guide';
        guide.style.left = dynamicLeftMargin + 'px';
        guide.style.top = (sheetTop + dynamicTopMargin) + 'px';
        guide.style.width = Math.max(10, paperWidth - (dynamicLeftMargin + dynamicRightMargin)) + 'px';
        guide.style.height = Math.max(10, singleSheetHeight - (dynamicTopMargin + dynamicBottomMargin)) + 'px';
        guideOverlay.appendChild(guide);

        const headerText = window.userHeaderText || "IN THE HIGH COURT OF JUDICATURE";
        const runningHeader = document.createElement('div');
        runningHeader.className = 'court-running-header';
        runningHeader.style.top = (sheetTop + Math.max(4, dynamicTopMargin / 3)) + 'px';
        runningHeader.style.fontSize = Math.max(8, Math.round(10 * scaleRatio)) + 'px';
        runningHeader.textContent = headerText;
        guideOverlay.appendChild(runningHeader);

        const rawFooterText = window.userFooterText || "Page {page} of {total} | Advocate Draft";
        const footerText = rawFooterText.replace('{page}', i + 1).replace('{total}', totalPages);
        const runningFooter = document.createElement('div');
        runningFooter.className = 'court-running-footer';
        runningFooter.style.top = (sheetTop + singleSheetHeight - Math.max(14, dynamicBottomMargin * 0.8)) + 'px';
        runningFooter.style.fontSize = Math.max(8, Math.round(10 * scaleRatio)) + 'px';
        runningFooter.textContent = footerText;
        guideOverlay.appendChild(runningFooter);

        if (window.userWatermarkText) {
          const watermark = document.createElement('div');
          watermark.className = 'court-watermark-overlay';
          watermark.style.position = 'absolute';
          watermark.style.top = (sheetTop + (singleSheetHeight / 2) - 30) + 'px';
          watermark.style.left = '0';
          watermark.style.right = '0';
          watermark.style.textAlign = 'center';
          watermark.style.transform = 'rotate(-30deg)';
          watermark.style.fontSize = Math.round(36 * scaleRatio) + 'px';
          watermark.style.fontWeight = 'bold';
          watermark.style.color = '#94a3b8';
          watermark.style.opacity = window.userWatermarkOpacity !== undefined ? window.userWatermarkOpacity : '0.2';
          watermark.style.pointerEvents = 'none';
          watermark.style.zIndex = '3';
          watermark.style.letterSpacing = '3px';
          watermark.style.textTransform = 'uppercase';
          watermark.textContent = window.userWatermarkText;
          guideOverlay.appendChild(watermark);
        }

        if (i < totalPages - 1) {
          const divider = document.createElement('div');
          divider.className = 'page-sheet-divider';
          divider.style.top = (sheetTop + singleSheetHeight) + 'px';
          divider.style.height = pageGap + 'px';
          divider.textContent = '--- MS Word Page Sheet ' + (i + 1) + ' of ' + totalPages + ' ---';
          guideOverlay.appendChild(divider);
        }
      }
    }

    function insertFilingIndexTable() {
      if (!editor) return;
      let indexHtml = '<h2 style="text-align: center; font-weight: bold; margin-bottom: 12px;">IN THE HIGH COURT OF JUDICATURE AT [CITY]</h2>';
      indexHtml += '<h3 style="text-align: center; font-weight: bold; margin-bottom: 16px;"><u>INDEX OF DOCUMENTS</u></h3>';
      indexHtml += '<table class="editor-table index-of-documents"><thead><tr>';
      indexHtml += '<th style="width: 10%;">S.No.</th>';
      indexHtml += '<th style="width: 50%;">Particulars of Document</th>';
      indexHtml += '<th style="width: 20%;">Annexure / Exhibit</th>';
      indexHtml += '<th style="width: 20%;">Page No.</th>';
      indexHtml += '</tr></thead><tbody>';
      indexHtml += '<tr><td style="text-align:center;">1.</td><td>Urgent Application / Motion on behalf of Petitioner</td><td style="text-align:center;">---</td><td style="text-align:center;">1 - 3</td></tr>';
      indexHtml += '<tr><td style="text-align:center;">2.</td><td>Memo of Parties with Complete Addresses</td><td style="text-align:center;">---</td><td style="text-align:center;">4 - 5</td></tr>';
      indexHtml += '<tr><td style="text-align:center;">3.</td><td>Main Petition / Writ Petition under Article 226</td><td style="text-align:center;">---</td><td style="text-align:center;">6 - 22</td></tr>';
      indexHtml += '<tr><td style="text-align:center;">4.</td><td>Supporting Affidavit of Petitioner</td><td style="text-align:center;">---</td><td style="text-align:center;">23 - 25</td></tr>';
      indexHtml += '<tr><td style="text-align:center;">5.</td><td>True Copy of Impugned Order / Notice</td><td style="text-align:center;">Annexure P-1</td><td style="text-align:center;">26 - 30</td></tr>';
      indexHtml += '<tr><td style="text-align:center;">6.</td><td>Vakalatnama (Authority Letter) & Court Fee</td><td style="text-align:center;">---</td><td style="text-align:center;">31</td></tr>';
      indexHtml += '</tbody></table><p></p>';
      editor.chain().focus().insertContent(indexHtml).run();
    }

    function safeChangeCase(mode) {
      if (!editor) return;
      const { state } = editor;
      const { from, to } = state.selection;
      if (from === to) return;
      const selectedText = state.doc.textBetween(from, to);
      let converted = selectedText;
      if (mode === 'upper') converted = selectedText.toUpperCase();
      else if (mode === 'lower') converted = selectedText.toLowerCase();
      else if (mode === 'title') converted = selectedText.replace(/\b\w/g, function(c) { return c.toUpperCase(); });
      editor.chain().focus().insertContentAt({ from, to }, converted).run();
    }

    // Native Bridge Dispatcher for True Tiptap Engine
    window.handleRNMessage = function(messageData) {
      try {
        const data = typeof messageData === 'string' ? JSON.parse(messageData) : messageData;
        if (!editor) return;
        logTiptapEvent('BRIDGE_IN', 'Received bridge message: ' + (data.type || 'unknown'), data);

        if (data.type === 'load' || data.type === 'setContent') {
          const cleaned = cleanHtmlForTiptap(data.html || '');
          editor.commands.setContent(cleaned);
          setTimeout(updateDynamicPaperRatio, 50);
          sendStateToRN(true);
        } else if (data.type === 'exec') {
          const cmd = data.command;
          logTiptapEvent('EXEC_CMD', 'Executing command: ' + cmd, { command: cmd, value: data.value });
          if (cmd === 'bold') {
            editor.chain().focus().toggleBold().run();
          } else if (cmd === 'italic') {
            editor.chain().focus().toggleItalic().run();
          } else if (cmd === 'underline') {
            editor.chain().focus().toggleUnderline().run();
          } else if (cmd === 'justifyLeft') {
            editor.chain().focus().setParagraph().run();
          } else if (cmd === 'justifyCenter') {
            editor.chain().focus().setHeading({ level: 2 }).run();
          } else if (cmd === 'justifyRight') {
            editor.chain().focus().setHeading({ level: 3 }).run();
          } else if (cmd === 'justifyFull') {
            editor.chain().focus().setParagraph().run();
          } else if (cmd === 'insertOrderedList' || cmd === 'toggleLegalList') {
            editor.chain().focus().toggleOrderedList().run();
          } else if (cmd === 'insertUnorderedList') {
            editor.chain().focus().toggleBulletList().run();
          } else if (cmd === 'insertParagraph') {
            editor.chain().focus().createParagraphNear().run();
          } else if (cmd === 'nextPlaceholder') {
            const placeholders = document.querySelectorAll('.legal-placeholder');
            if (placeholders.length > 0) {
              const nextEl = placeholders[0];
              nextEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              const label = nextEl.textContent;
              postMessage({ type: 'openPlaceholderModal', label: label, cleanLabel: label.replace('[', '').replace(']', '') });
            }
          } else if (cmd === 'insertTable') {
            editor.chain().focus().insertTable({ rows: data.rows || 3, cols: data.cols || 3, withHeaderRow: true }).run();
          } else if (cmd === 'insertPageBreak') {
            editor.chain().focus().insertContent('<div class="legal-page-break" data-type="page-break" contenteditable="false" style="break-before: page; page-break-before: always; user-select: none;"></div><p></p>').run();
          } else if (cmd === 'insertFilingIndexTable') {
            insertFilingIndexTable();
          } else if (cmd === 'insertSignature') {
            const sigHtml = '<img src="' + data.value + '" class="signature-stamp" alt="Advocate Signature" /><p><b>(Advocate Signature)</b></p>';
            editor.chain().focus().insertContent(sigHtml).run();
          } else if (cmd === 'insertShape') {
            let shapeHtml = '';
            const shapeType = data.value || 'rect';
            if (shapeType === 'rect') {
              shapeHtml = '<div class="interactive-shape shape-rect"><b>Rectangle / Stamp Box</b></div><p></p>';
            } else if (shapeType === 'circle') {
              shapeHtml = '<div class="interactive-shape shape-circle"><b>Round Seal Frame</b></div><p></p>';
            } else if (shapeType === 'arrow') {
              shapeHtml = '<div class="interactive-shape shape-arrow"><b>➔ Process Arrow</b></div><p></p>';
            } else if (shapeType === 'stamp') {
              shapeHtml = '<div class="interactive-shape shape-stamp"><b>[ AFFIX COURT FEE STAMP HERE - ₹10/- ]</b></div><p></p>';
            }
            editor.chain().focus().insertContent(shapeHtml).run();
          } else if (cmd === 'insertUniversalCaption') {
            const captionHtml = '<p class="court-header" style="text-align: center; font-weight: bold; margin-bottom: 8px;"><strong>IN THE COURT OF [NAME OF COURT / TRIBUNAL]</strong><br/><strong>AT [CITY / JURISDICTION]</strong></p><p style="text-align: center; margin-bottom: 16px;"><strong>CASE NO.: ____________ OF 2026</strong></p><table style="width: 100%; border: none; margin-bottom: 16px;"><tr><td style="width: 60%; border: none; vertical-align: top;"><strong>[PLAINTIFF / PETITIONER NAME]</strong><br/>Address: [Full Address]</td><td style="width: 40%; border: none; text-align: right; vertical-align: top;">... <strong>PLAINTIFF / PETITIONER</strong></td></tr><tr><td colspan="2" style="border: none; text-align: center; padding: 6px 0;"><strong>VERSUS</strong></td></tr><tr><td style="width: 60%; border: none; vertical-align: top;"><strong>[DEFENDANT / RESPONDENT NAME]</strong><br/>Address: [Full Address]</td><td style="width: 40%; border: none; text-align: right; vertical-align: top;">... <strong>DEFENDANT / RESPONDENT</strong></td></tr></table><p></p>';
            editor.chain().focus().insertContent(captionHtml).run();
          } else if (cmd === 'insertPrayerClause') {
            const prayerHtml = '<p style="text-align: center; font-weight: bold; margin: 18px 0 10px 0;"><strong><u>PRAYER / RELIEF SOUGHT</u></strong></p><p>WHEREFORE, in light of the facts and circumstances stated hereinabove, it is most respectfully prayed that this Hon&apos;ble Court may graciously be pleased to:</p><p>a) Pass an order granting [Specific Relief / Order Requested];</p><p>b) Award the costs of this proceeding in favor of the [Petitioner / Plaintiff]; and</p><p>c) Pass such other and further order(s) as this Hon&apos;ble Court may deem fit and proper in the interest of justice.</p><p></p>';
            editor.chain().focus().insertContent(prayerHtml).run();
          } else if (cmd === 'insertAffidavitBlock') {
            const affHtml = '<div style="border: 1.5px solid #334155; padding: 14px; margin-top: 20px; border-radius: 4px; line-height: 1.6;"><p style="text-align: center; margin: 0 0 10px 0;"><strong><u>SWORN VERIFICATION / AFFIDAVIT</u></strong></p><p style="margin: 0 0 10px 0;">I, the Deponent / Declarant above named, do hereby solemnly declare and affirm that the contents of the foregoing paragraphs are true and correct to the best of my personal knowledge, information, and belief, and nothing material has been concealed therefrom.</p><p style="margin: 0 0 16px 0;">Verified and executed at <strong>[Place / City]</strong> on this <strong>[Day]</strong> day of <strong>[Month]</strong>, 2026.</p><table style="width: 100%; border: none; margin-top: 14px;"><tr><td style="width: 50%; border: none;"><strong>DEPONENT / DECLARANT</strong></td><td style="width: 50%; text-align: right; border: none;"><strong>ADVOCATE / COUNSEL</strong></td></tr></table></div><p></p>';
            editor.chain().focus().insertContent(affHtml).run();
          } else if (cmd === 'insertCertificateOfService') {
            const certHtml = '<div style="border-top: 1px dashed #64748b; padding-top: 14px; margin-top: 24px;"><p style="text-align: center; font-weight: bold; margin-bottom: 8px;"><strong><u>CERTIFICATE OF SERVICE / PROOF OF FILING</u></strong></p><p style="margin-bottom: 10px;">I hereby certify that on this date, a true and complete copy of the foregoing document was duly served upon all opposing parties / counsels of record via [Hand Delivery / Registered Post / Electronic Service].</p><table style="width: 100%; border: none; margin-top: 12px;"><tr><td style="width: 50%; border: none;">Date: [DD/MM/YYYY]</td><td style="width: 50%; text-align: right; border: none;"><strong>[ADVOCATE / COUNSEL SIGNATURE]</strong></td></tr></table></div><p></p>';
            editor.chain().focus().insertContent(certHtml).run();
          } else if (cmd === 'insertText') {
            editor.chain().focus().insertContent(data.value).run();
          } else if (cmd === 'insertHTML') {
            editor.chain().focus().insertContent(data.value).run();
          } else if (cmd === 'changeCase') {
            safeChangeCase(data.value);
          } else if (cmd === 'tableAddRowAbove') {
            editor.chain().focus().addRowBefore().run();
          } else if (cmd === 'tableAddRowBelow') {
            editor.chain().focus().addRowAfter().run();
          } else if (cmd === 'tableAddColLeft') {
            editor.chain().focus().addColumnBefore().run();
          } else if (cmd === 'tableAddColRight') {
            editor.chain().focus().addColumnAfter().run();
          } else if (cmd === 'tableDeleteRow') {
            editor.chain().focus().deleteRow().run();
          } else if (cmd === 'tableDeleteCol') {
            editor.chain().focus().deleteColumn().run();
          } else if (cmd === 'deleteSelectedElement') {
            if (editor.isActive('table')) {
              editor.chain().focus().deleteTable().run();
            } else {
              editor.chain().focus().deleteSelection().run();
            }
          } else if (cmd === 'replacePlaceholderValue') {
            const label = data.label;
            const newVal = data.value;
            if (label && newVal) {
              const currentHtml = editor.getHTML();
              const updatedHtml = currentHtml.split(label).join(newVal);
              editor.commands.setContent(updatedHtml);
              sendStateToRN(true);
            }
          } else if (cmd === 'setFontSize') {
            const sizeVal = data.value || '14';
            const numSize = parseInt(sizeVal, 10) || 14;
            window.userFontSize = numSize;
            updateDynamicPaperRatio();
            sendStateToRN();
          } else if (cmd === 'setLineHeight') {
            const lhVal = parseFloat(data.value) || 1.8;
            window.userLineHeightRatio = lhVal;
            updateDynamicPaperRatio();
            sendStateToRN();
          } else if (cmd === 'undo') {
            editor.chain().focus().undo().run();
          } else if (cmd === 'redo') {
            editor.chain().focus().redo().run();
          }
        } else if (data.type === 'layout') {
          if (data.font) editorEl.style.fontFamily = data.font;
          if (data.lineHeight) editorEl.style.lineHeight = data.lineHeight;
          if (data.headerText !== undefined) window.userHeaderText = data.headerText;
          if (data.footerText !== undefined) window.userFooterText = data.footerText;
          if (data.watermarkText !== undefined) window.userWatermarkText = data.watermarkText;
          if (data.watermarkOpacity !== undefined) window.userWatermarkOpacity = data.watermarkOpacity;
          
          window.userTopMargin = data.topMargin !== undefined ? data.topMargin : 24;
          window.userBottomMargin = data.bottomMargin !== undefined ? data.bottomMargin : 24;
          window.userLeftMargin = data.leftMargin !== undefined ? data.leftMargin : 55;
          window.userRightMargin = data.rightMargin !== undefined ? data.rightMargin : 24;
          window.userLetterheadSpace = data.letterheadSpace !== undefined ? data.letterheadSpace : 0;
          
          if (data.pageSize) {
            editorEl.className = data.pageSize === 'legal' ? 'page-legal' : 'page-a4';
          }
          updateDynamicPaperRatio();
        } else if (data.type === 'requestSave') {
          const stats = calculateStats();
          postMessage({
            type: 'save',
            html: editor.getHTML(),
            stats: stats,
          });
        }
      } catch (err) {
        postMessage({
          type: 'error',
          error: err.message,
        });
      }
    };

    // Element Click & Selection Modal Triggers
    document.addEventListener('click', function(e) {
      const table = e.target.closest('table, .editor-table');
      const signature = e.target.closest('.signature-stamp');
      const placeholder = e.target.closest('.legal-placeholder');

      document.querySelectorAll('.active-selected-element').forEach(el => el.classList.remove('active-selected-element'));

      if (table) {
        table.classList.add('active-selected-element');
        logTiptapEvent('TOUCH_ELEMENT', 'Table tapped and selected');
        postMessage({ type: 'openElementContextModal', elementType: 'table' });
      } else if (signature) {
        signature.classList.add('active-selected-element');
        logTiptapEvent('TOUCH_ELEMENT', 'Signature stamp tapped');
        postMessage({ type: 'openElementContextModal', elementType: 'signature' });
      } else if (placeholder) {
        e.preventDefault();
        e.stopPropagation();
        const label = placeholder.textContent;
        logTiptapEvent('TOUCH_ELEMENT', 'Placeholder tapped: ' + label);
        postMessage({ type: 'openPlaceholderModal', label: label, cleanLabel: label.replace('[', '').replace(']', '') });
      }
    });

    let sendStateTimeout = null;
    let lastSentStateJson = '';
    function sendStateToRN(immediate = false) {
      updateDynamicPaperRatio();
      if (sendStateTimeout) {
        clearTimeout(sendStateTimeout);
        sendStateTimeout = null;
      }
      
      const doSend = function() {
        if (!editor) return;
        const state = {
          bold: editor.isActive('bold'),
          italic: editor.isActive('italic'),
          underline: editor.isActive('underline'),
          alignLeft: !editor.isActive('heading', { level: 2 }) && !editor.isActive('heading', { level: 3 }),
          alignCenter: editor.isActive('heading', { level: 2 }) || editor.isActive('heading', { level: 1 }),
          alignRight: editor.isActive('heading', { level: 3 }),
          alignJustify: false,
          orderedList: editor.isActive('orderedList'),
          unorderedList: editor.isActive('bulletList'),
        };
        const stats = calculateStats();
        const payloadJson = JSON.stringify({ state, stats });
        if (payloadJson === lastSentStateJson && !immediate) {
          return;
        }
        lastSentStateJson = payloadJson;

        postMessage({
          type: 'state',
          engine: 'tiptap-v3-prosemirror-ast',
          state: state,
          stats: stats,
        });
      };

      if (immediate) {
        doSend();
      } else {
        sendStateTimeout = setTimeout(doSend, 300);
      }
    }

    window.addEventListener('resize', function() { updateDynamicPaperRatio(); });
    window.addEventListener('orientationchange', function() { setTimeout(updateDynamicPaperRatio, 150); });

    // Initial render layout setup & RN dispatch
    setTimeout(() => {
      updateDynamicPaperRatio();
      sendStateToRN(true);
    }, 100);
  </script>
</body>
</html>
  `;
};
