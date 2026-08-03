// utils/offlineEditorTemplate.ts

export const getOfflineEditorHtml = (initialHtml: string): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    * {
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background-color: #f3f4f6; /* Gray desktop background */
    }
    body {
      margin: 0;
      padding: 8px 4px 40px 4px;
      background-color: #e5e7eb; /* Neutral gray background void between page sheets */
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
      background-color: #fcf9f2;
      border: 1px solid #e2e8f0;
      box-sizing: border-box;
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
    #editor {
      outline: none;
      width: 100%;
      min-height: 82vh;
      background-color: #fcf9f2; /* Professional Court Green/Yellowish Ledger Paper */
      padding: 28px 28px 48px 58px; /* Leave space for left red ledger line */
      box-sizing: border-box;
      word-wrap: break-word;
      overflow-wrap: break-word;
      word-break: break-word;
      font-family: 'Times New Roman', Georgia, serif;
      font-size: 16px;
      line-height: 1.8;
      color: #111827;
      -webkit-user-select: text;
      user-select: text;
    }
    #editor.page-a4 {
      box-sizing: border-box;
    }
    #editor.page-legal {
      box-sizing: border-box;
    }
    #editor p {
      margin: 0 0 12px 0;
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;
      color: inherit;
    }
    hr.page-break, .legal-page-break {
      display: block;
      page-break-before: always;
      break-before: page;
      height: 0;
      margin: 20px 0;
      border: 0;
      border-top: 1px dashed #94a3b8;
      position: relative;
      user-select: none;
    }
    hr.page-break:after, .legal-page-break:after {
      content: "--- Page Break ---";
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
    @media print {
      hr.page-break, .legal-page-break {
        page-break-before: always;
        break-before: page;
        height: 0;
        border: 0;
        margin: 0;
        padding: 0;
      }
      hr.page-break:after, .legal-page-break:after {
        display: none !important;
      }
    }
    ul, ol {
      margin: 0 0 12px 20px;
      padding: 0;
    }
    ol.legal-list {
      list-style-type: none;
      counter-reset: item;
      padding-left: 20px;
      margin: 0 0 12px 0;
    }
    ol.legal-list > li {
      display: block;
      position: relative;
      margin-bottom: 8px;
    }
    ol.legal-list > li:before {
      content: counters(item, ".") ". ";
      counter-increment: item;
      font-weight: bold;
      margin-right: 6px;
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
    .editor-table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
    }
    .editor-table td, .editor-table th {
      border: 1px solid #9ca3af;
      padding: 8px;
      font-size: 15px;
    }
    .editor-table th {
      background-color: #e5e7eb;
      font-weight: bold;
    }
    .signature-stamp {
      max-height: 90px;
      max-width: 220px;
      margin: 12px 0;
      display: block;
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
    .editor-table, .signature-stamp, .interactive-shape {
      cursor: grab;
    }
    .editor-table:active, .signature-stamp:active, .interactive-shape:active {
      cursor: grabbing;
    }
    .active-selected-element {
      outline: 2.5px solid #2563eb !important;
      box-shadow: 0 0 8px rgba(37, 99, 235, 0.3);
    }
    blockquote {
      border-left: 4px solid #d1d5db;
      padding-left: 12px;
      margin: 0 0 12px 0;
      color: #4b5563;
      font-style: italic;
    }
    [placeholder]:empty:before {
      content: attr(placeholder);
      color: #9ca3af;
      font-style: italic;
      cursor: text;
    }
  </style>
</head>
<body>
  <div class="page-container">
    <!-- Court Ledger Red Margin Line absolute positioned relative to page sheet -->
    <div id="red-margin-line" style="position: absolute; left: 40px; top: 0; bottom: 0; width: 2px; background-color: #dc2626; opacity: 0.95; pointer-events: none; z-index: 15;"></div>
    <div 
      id="editor" 
      class="page-a4"
      contenteditable="true" 
      placeholder="Write your draft here..."
      autocorrect="on"
      spellcheck="true"
    >${initialHtml || ""}</div>
  </div>

  <script>
    const editor = document.getElementById('editor');
    let selectedElement = null;

    // Auto-focus on load
    editor.focus();
    try {
      document.execCommand('defaultParagraphSeparator', false, 'p');
    } catch (e) {}

    // Command runner
    function execCmd(command, value = null) {
      editor.focus();
      document.execCommand(command, false, value);
      sendStateToRN();
    }

    // Post messages to React Native
    function postMessage(data) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }
    }

    let savedEditorRange = null;

    function saveEditorSelection() {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        if (editor.contains(range.commonAncestorContainer)) {
          savedEditorRange = range.cloneRange();
        }
      }
    }

    function restoreEditorSelection() {
      if (savedEditorRange) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedEditorRange);
      }
    }

    document.addEventListener('selectionchange', saveEditorSelection);
    editor.addEventListener('mouseup', saveEditorSelection);
    editor.addEventListener('keyup', saveEditorSelection);
    editor.addEventListener('touchend', saveEditorSelection);

    // Insert HTML cleanly at current cursor selection
    function insertHTMLAtCursor(html) {
      editor.focus();
      restoreEditorSelection();
      const sel = window.getSelection();
      let inserted = false;
      if (sel && sel.getRangeAt && sel.rangeCount) {
        try {
          const range = sel.getRangeAt(0);
          if (editor.contains(range.commonAncestorContainer)) {
            range.deleteContents();
            const el = document.createElement("div");
            el.innerHTML = html;
            const frag = document.createDocumentFragment();
            let node, lastNode;
            while ((node = el.firstChild)) {
              lastNode = frag.appendChild(node);
            }
            range.insertNode(frag);
            if (lastNode) {
              range.setStartAfter(lastNode);
              sel.removeAllRanges();
              sel.addRange(range);
              saveEditorSelection();
            }
            inserted = true;
          }
        } catch (e) {
          inserted = false;
        }
      }
      if (!inserted) {
        const div = document.createElement("div");
        div.innerHTML = html;
        editor.appendChild(div);
        saveEditorSelection();
      }
      sendStateToRN();
    }

    // Custom Table Generator
    function insertTable(rows = 3, cols = 3) {
      let tableHtml = '<table class="editor-table" draggable="true"><thead><tr>';
      for (let c = 1; c <= cols; c++) {
        tableHtml += '<th>Header ' + c + '</th>';
      }
      tableHtml += '</tr></thead><tbody>';
      for (let r = 1; r <= rows; r++) {
        tableHtml += '<tr>';
        for (let c = 1; c <= cols; c++) {
          tableHtml += '<td>Cell ' + r + '.' + c + '</td>';
        }
        tableHtml += '</tr>';
      }
      tableHtml += '</tbody></table><p><br></p>';
      insertHTMLAtCursor(tableHtml);
    }

    // Direct message handler for React Native WebView communication
    window.handleRNMessage = function(messageData) {
      try {
        const data = typeof messageData === 'string' ? JSON.parse(messageData) : messageData;
        if (data.type === 'load') {
          editor.innerHTML = data.html || '';
          scanAndHighlightPlaceholders();
          editor.focus();
        } else if (data.type === 'saveSelection') {
          saveEditorSelection();
        } else if (data.type === 'exec') {
          editor.focus();
          if (data.command === 'insertText') {
            document.execCommand('insertText', false, data.value);
            sendStateToRN();
          } else if (data.command === 'insertHTML') {
            insertHTMLAtCursor(data.value);
          } else if (data.command === 'insertPageBreak') {
            document.execCommand('insertHTML', false, '<div class="legal-page-break" style="break-before: page; page-break-before: always;"></div><p><br></p>');
            sendStateToRN();
          } else if (data.command === 'insertTable') {
            insertTable(data.rows || 3, data.cols || 3);
          } else if (data.command === 'insertSignature') {
            const sigHtml = '<img src="' + data.value + '" class="signature-stamp" draggable="true" alt="Advocate Signature" /><p><b>(Advocate Signature)</b></p>';
            insertHTMLAtCursor(sigHtml);
          } else if (data.command === 'insertShape') {
            let shapeHtml = '';
            const shapeType = data.value || 'rect';
            if (shapeType === 'rect') {
              shapeHtml = '<div class="interactive-shape shape-rect" contenteditable="true" draggable="true"><b>Rectangle / Stamp Box</b></div><p><br></p>';
            } else if (shapeType === 'circle') {
              shapeHtml = '<div class="interactive-shape shape-circle" contenteditable="true" draggable="true"><b>Round Seal Frame</b></div><p><br></p>';
            } else if (shapeType === 'arrow') {
              shapeHtml = '<div class="interactive-shape shape-arrow" contenteditable="true" draggable="true"><b>➔ Process Arrow</b></div><p><br></p>';
            } else if (shapeType === 'stamp') {
              shapeHtml = '<div class="interactive-shape shape-stamp" contenteditable="true" draggable="true"><b>[ AFFIX COURT FEE STAMP HERE - ₹10/- ]</b></div><p><br></p>';
            }
            insertHTMLAtCursor(shapeHtml);
          } else if (data.command === 'duplicateSelectedElement') {
            if (selectedElement) {
              const clone = selectedElement.cloneNode(true);
              selectedElement.parentNode.insertBefore(clone, selectedElement.nextSibling);
              sendStateToRN();
            }
          } else if (data.command === 'setFontSize') {
            const sizeVal = data.value || '14';
            const numSize = parseInt(sizeVal, 10) || 14;
            window.userFontSize = numSize;
            updateDynamicPaperRatio();
            sendStateToRN();
          } else if (data.command === 'deleteSelectedElement') {
            if (selectedElement) {
              selectedElement.remove();
              selectedElement = null;
              sendStateToRN();
            }
          } else if (data.command === 'replacePlaceholderValue') {
            const label = data.label;
            const newVal = data.value;
            if (label && newVal) {
              const allPlaceholders = Array.from(document.querySelectorAll('.legal-placeholder'));
              allPlaceholders.forEach(p => {
                if (p.textContent === label || p.getAttribute('data-original') === label) {
                  p.textContent = newVal;
                  p.classList.remove('legal-placeholder');
                  p.style.backgroundColor = 'transparent';
                  p.style.borderBottom = 'none';
                }
              });
              sendStateToRN();
            }
          } else if (data.command === 'toggleLegalList') {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              let node = range.commonAncestorContainer;
              if (node.nodeType === Node.TEXT_NODE) {
                node = node.parentElement;
              }
              const ol = node.closest('ol');
              if (ol) {
                ol.classList.toggle('legal-list');
              } else {
                document.execCommand('insertOrderedList');
                setTimeout(() => {
                  const selOl = window.getSelection().anchorNode.parentElement.closest('ol');
                  if (selOl) selOl.classList.add('legal-list');
                }, 10);
              }
              sendStateToRN();
            }
          } else if (data.command === 'changeCase') {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const text = selection.toString();
              if (text) {
                let converted = '';
                if (data.value === 'upper') {
                  converted = text.toUpperCase();
                } else if (data.value === 'lower') {
                  converted = text.toLowerCase();
                } else if (data.value === 'title') {
                  converted = text.replace(/\b\w/g, c => c.toUpperCase());
                }
                document.execCommand('insertText', false, converted);
                sendStateToRN();
              }
            }
          } else if (data.command === 'undo') {
            document.execCommand('undo', false, null);
            sendStateToRN();
          } else if (data.command === 'redo') {
            document.execCommand('redo', false, null);
            sendStateToRN();
          } else {
            execCmd(data.command, data.value);
          }
        } else if (data.type === 'layout') {
          editor.style.fontFamily = data.font || 'Times New Roman';
          if (data.userFontSize) window.userFontSize = data.userFontSize;
          if (data.lineHeight) window.userLineHeightRatio = parseFloat(data.lineHeight) || 1.8;
          if (data.letterSpacing !== undefined) window.userLetterSpacing = data.letterSpacing;
          if (data.wordSpacing !== undefined) window.userWordSpacing = data.wordSpacing;
          
          window.userTopMargin = data.topMargin !== undefined ? data.topMargin : 24;
          window.userBottomMargin = data.bottomMargin !== undefined ? data.bottomMargin : 24;
          window.userLeftMargin = data.leftMargin !== undefined ? data.leftMargin : 55;
          window.userRightMargin = data.rightMargin !== undefined ? data.rightMargin : 24;
          window.userLetterheadSpace = data.letterheadSpace !== undefined ? data.letterheadSpace : 0;
          
          if (data.pageSize) {
            editor.className = data.pageSize === 'legal' ? 'page-legal' : 'page-a4';
          }
          updateDynamicPaperRatio();
        } else if (data.type === 'setContent') {
          editor.innerHTML = data.html || '';
          scanAndHighlightPlaceholders();
          sendStateToRN();
        } else if (data.type === 'setEditorLanguage') {
          if (data.lang) {
            editor.setAttribute('lang', data.lang);
          }
        } else if (data.type === 'requestSave') {
          const stats = calculateStats();
          postMessage({
            type: 'save',
            html: editor.innerHTML,
            stats: stats
          });
        }
      } catch (err) {
        postMessage({
          type: 'error',
          error: err.message
        });
      }
    };

    function getPaperMetrics() {
      const container = document.querySelector('.page-container');
      const outerPadding = 8;
      const availableWidth = container ? Math.max(300, (container.clientWidth || window.innerWidth) - outerPadding) : window.innerWidth - outerPadding;
      const isLegal = editor ? editor.classList.contains('page-legal') : true;
      const referenceWidth = isLegal ? 816 : 794;
      const paperWidth = Math.min(referenceWidth, availableWidth);
      const scaleRatio = paperWidth / referenceWidth;
      const heightRatio = isLegal ? 1.6470 : 1.4142;
      const singleSheetHeight = Math.round(paperWidth * heightRatio);
      return { paperWidth, referenceWidth, scaleRatio, heightRatio, singleSheetHeight, isLegal };
    }

    function updateDynamicPaperRatio() {
      const container = document.querySelector('.page-container');
      if (!container || !editor) return;
      
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

      // MS Word Page Count Calculation (Non-Destructive)
      const printableSheetHeight = Math.max(100, singleSheetHeight - (dynamicTopMargin + dynamicBottomMargin));
      const pageBreakCount = editor.querySelectorAll('.legal-page-break, hr.page-break').length;

      // Temporarily set minHeight to 0px to accurately measure content scrollHeight without feedback loop
      editor.style.minHeight = '0px';
      const actualScrollHeight = editor.scrollHeight;

      const overflowPages = Math.ceil(actualScrollHeight / printableSheetHeight) || 1;
      const totalPages = Math.max(1, pageBreakCount + 1, overflowPages);
      
      const pageGap = Math.round(20 * scaleRatio);
      const canvasHeight = Math.round((singleSheetHeight * totalPages) + (pageGap * (totalPages - 1)));
      container.style.width = paperWidth + 'px';
      container.style.margin = '0 auto';
      editor.style.minHeight = canvasHeight + 'px';
      container.style.height = canvasHeight + 'px';
      
      // Proportional font, line-height, spacing & padding derived strictly from scaleRatio
      const baseFontSize = window.userFontSize || 14;
      const renderFontPx = Math.max(10, Math.round(baseFontSize * scaleRatio));

      const baseLineRatio = window.userLineHeightRatio || (metrics.isLegal ? 1.8 : 1.5);
      const renderLineHeightPx = (renderFontPx * baseLineRatio).toFixed(1);

      const baseLetterSpace = window.userLetterSpacing || 0;
      const renderLetterSpacePx = (baseLetterSpace * scaleRatio).toFixed(2);

      const baseWordSpace = window.userWordSpacing || 0;
      const renderWordSpacePx = (baseWordSpace * scaleRatio).toFixed(2);

      const titlePx = Math.round(renderFontPx * 1.25);
      const headerPx = Math.round(renderFontPx * 1.15);
      const sectionPx = Math.round(renderFontPx * 1.08);
      const paragraphMb = Math.max(4, Math.round(10 * scaleRatio));
      const padBottomPx = Math.round(30 * scaleRatio);

      let dynamicStyle = document.getElementById('dynamic-paper-scale-style');
      if (!dynamicStyle) {
        dynamicStyle = document.createElement('style');
        dynamicStyle.id = 'dynamic-paper-scale-style';
        document.head.appendChild(dynamicStyle);
      }
      
      dynamicStyle.innerHTML = 
        '#editor { font-size: ' + renderFontPx + 'px !important; line-height: ' + renderLineHeightPx + 'px !important; letter-spacing: ' + renderLetterSpacePx + 'px !important; word-spacing: ' + renderWordSpacePx + 'px !important; padding-bottom: ' + padBottomPx + 'px !important; word-wrap: break-word !important; overflow-wrap: break-word !important; word-break: break-word !important; } ' +
        '#editor p, #editor div, #editor td, #editor th, #editor li, #editor span, #editor blockquote, #editor caption, #editor .footnote { font-size: ' + renderFontPx + 'px !important; line-height: ' + renderLineHeightPx + 'px !important; letter-spacing: ' + renderLetterSpacePx + 'px !important; word-spacing: ' + renderWordSpacePx + 'px !important; margin-bottom: ' + paragraphMb + 'px !important; word-wrap: break-word !important; overflow-wrap: break-word !important; word-break: break-word !important; } ' +
        '#editor .title, #editor h1 { font-size: ' + titlePx + 'px !important; margin-bottom: ' + Math.round(10 * scaleRatio) + 'px !important; line-height: ' + (titlePx * 1.3).toFixed(1) + 'px !important; } ' +
        '#editor .court-header, #editor h2 { font-size: ' + headerPx + 'px !important; margin-bottom: ' + Math.round(12 * scaleRatio) + 'px !important; line-height: ' + (headerPx * 1.35).toFixed(1) + 'px !important; } ' +
        '#editor .section-title, #editor h3 { font-size: ' + sectionPx + 'px !important; } ' +
        '#editor .legal-page-break + *, #editor hr.page-break + * { margin-top: ' + Math.round((window.userTopMargin || 16) * scaleRatio) + 'px !important; }';
      
      editor.style.paddingLeft = dynamicLeftMargin + 'px';
      editor.style.paddingRight = dynamicRightMargin + 'px';
      editor.style.paddingTop = dynamicTopMargin + 'px';
      
      const redMargin = document.getElementById('red-margin-line');
      if (redMargin) {
        redMargin.style.left = Math.max(4, Math.round(dynamicLeftMargin - (10 * scaleRatio))) + 'px';
      }

      // Render 4-sided dashed margin guide boxes for each physical page sheet
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
      }
    }

    // Atomic Page Break Protection & Clean Enter-Key Reset
    editor.addEventListener('keydown', function(e) {
      if (e.key === 'Backspace' || e.keyCode === 8) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          if (range.collapsed && range.startOffset === 0) {
            let currentNode = range.startContainer;
            if (currentNode.nodeType === Node.TEXT_NODE) {
              currentNode = currentNode.parentElement;
            }
            const prev = currentNode ? currentNode.previousElementSibling : null;
            if (prev && (prev.classList.contains('legal-page-break') || (prev.tagName === 'HR' && prev.classList.contains('page-break')))) {
              e.preventDefault();
              const prevPageNode = prev.previousElementSibling;
              prev.remove();
              if (prevPageNode) {
                const newRange = document.createRange();
                newRange.selectNodeContents(prevPageNode);
                newRange.collapse(false);
                selection.removeAllRanges();
                selection.addRange(newRange);
              }
              sendStateToRN();
              updateDynamicPaperRatio();
              return;
            }
          }
        }
      }

      if (e.key === 'Enter' || e.keyCode === 13) {
        let range;
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) range = sel.getRangeAt(0);

        let blockNode = range ? range.startContainer : null;
        if (!blockNode || blockNode === editor) {
          blockNode = (sel && sel.focusNode) ? sel.focusNode : (document.activeElement || editor.lastElementChild || editor);
        }
        if (blockNode && blockNode.nodeType === Node.TEXT_NODE) blockNode = blockNode.parentElement;

        const containerBlock = blockNode ? (blockNode.closest('.signature-row, .sig-row, .signature-block, [style*="display: flex"], [style*="display:flex"], .editor-table') || blockNode.closest('.sig-col, [style*="flex"], .signature-stamp, .interactive-shape, h1, h2, h3, blockquote')) : null;

        if (containerBlock || (blockNode && (blockNode.querySelector('hr') || blockNode.style.border || blockNode.style.backgroundColor || (blockNode.tagName && blockNode.tagName.startsWith('H'))))) {
          e.preventDefault();
          const targetEscBlock = containerBlock || blockNode;
          const newP = document.createElement('p');
          newP.innerHTML = '<br>';
          if (targetEscBlock.nextSibling) {
            targetEscBlock.parentNode.insertBefore(newP, targetEscBlock.nextSibling);
          } else {
            targetEscBlock.parentNode.appendChild(newP);
          }
          if (sel) {
            const newRange = document.createRange();
            newRange.setStart(newP, 0);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
          }
          sendStateToRN();
          return;
        }
      }
    });

    window.addEventListener('resize', updateDynamicPaperRatio);
    setTimeout(updateDynamicPaperRatio, 100);

    window.addEventListener('message', function(e) {
      window.handleRNMessage(e.data);
    });

    function calculateStats() {
      const text = editor.innerText || editor.textContent || '';
      const cleanText = text.trim();
      const wordCount = cleanText ? cleanText.split(/\\s+/).length : 0;
      const charCount = cleanText.length;
      const pageBreaks = editor.querySelectorAll('.legal-page-break, hr.page-break').length;
      const estimatedPages = Math.max(1 + pageBreaks, Math.ceil(wordCount / 350) || 1);
      return { wordCount, charCount, estimatedPages, text: cleanText };
    }

    function sendStateToRN() {
      updateDynamicPaperRatio();
      const state = {
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        alignLeft: document.queryCommandState('justifyLeft') || (!document.queryCommandState('justifyCenter') && !document.queryCommandState('justifyRight') && !document.queryCommandState('justifyFull')),
        alignCenter: document.queryCommandState('justifyCenter'),
        alignRight: document.queryCommandState('justifyRight'),
        alignJustify: document.queryCommandState('justifyFull'),
        orderedList: document.queryCommandState('insertOrderedList'),
        unorderedList: document.queryCommandState('insertUnorderedList')
      };
      
      postMessage({
        type: 'state',
        state: state,
        stats: calculateStats(),
        html: editor.innerHTML
      });
    }

    function scanAndHighlightPlaceholders() {
      const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null, false);
      const textNodes = [];
      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node);
      }
      
      const regex = /\\[[^\\]]+\\]|__+/g;
      
      for (let i = textNodes.length - 1; i >= 0; i--) {
        const textNode = textNodes[i];
        if (textNode.parentElement.closest('.legal-placeholder')) continue;
        
        const val = textNode.nodeValue;
        if (regex.test(val)) {
          regex.lastIndex = 0;
          const parent = textNode.parentElement;
          const fragment = document.createDocumentFragment();
          let lastIdx = 0;
          let match;
          
          while ((match = regex.exec(val)) !== null) {
            if (match.index > lastIdx) {
              fragment.appendChild(document.createTextNode(val.substring(lastIdx, match.index)));
            }
            
            const span = document.createElement('span');
            span.className = 'legal-placeholder';
            span.setAttribute('data-original', match[0]);
            span.textContent = match[0];
            fragment.appendChild(span);
            
            lastIdx = regex.lastIndex;
          }
          
          if (lastIdx < val.length) {
            fragment.appendChild(document.createTextNode(val.substring(lastIdx)));
          }
          
          parent.replaceChild(fragment, textNode);
        }
      }
    }

    // Tap to select elements (tables, signatures) or edit placeholders
    document.addEventListener('click', function(e) {
      const table = e.target.closest('.editor-table');
      const signature = e.target.closest('.signature-stamp');
      const placeholder = e.target.closest('.legal-placeholder');

      // Clear previous active outlines
      document.querySelectorAll('.active-selected-element').forEach(el => el.classList.remove('active-selected-element'));

      if (table) {
        selectedElement = table;
        table.classList.add('active-selected-element');
        postMessage({
          type: 'openElementContextModal',
          elementType: 'table'
        });
      } else if (signature) {
        selectedElement = signature;
        signature.classList.add('active-selected-element');
        postMessage({
          type: 'openElementContextModal',
          elementType: 'signature'
        });
      } else if (placeholder) {
        e.preventDefault();
        e.stopPropagation();
        const label = placeholder.textContent;
        postMessage({
          type: 'openPlaceholderModal',
          label: label,
          cleanLabel: label.replace(/[\\[\\]]/g, '')
        });
      } else {
        selectedElement = null;
      }
    });

    // Scan initial placeholders and initialize dynamic paper ratio on load
    scanAndHighlightPlaceholders();
    updateDynamicPaperRatio();

    // Drag and Drop Repositioning for Tables, Shapes, and Signatures
    let draggedItem = null;
    document.addEventListener('dragstart', function(e) {
      const target = e.target.closest('.interactive-shape, .signature-stamp, .editor-table');
      if (target) {
        draggedItem = target;
        e.dataTransfer.setData('text/plain', '');
        e.dataTransfer.effectAllowed = 'move';
        target.style.opacity = '0.5';
      }
    });

    document.addEventListener('dragend', function(e) {
      if (draggedItem) {
        draggedItem.style.opacity = '1.0';
        draggedItem = null;
      }
    });

    editor.addEventListener('dragover', function(e) {
      if (draggedItem) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }
    });

    editor.addEventListener('drop', function(e) {
      if (draggedItem) {
        e.preventDefault();
        draggedItem.style.opacity = '1.0';
        
        let dropRange = null;
        if (document.caretRangeFromPoint) {
          dropRange = document.caretRangeFromPoint(e.clientX, e.clientY);
        } else if (e.rangeParent) {
          dropRange = document.createRange();
          dropRange.setStart(e.rangeParent, e.rangeOffset);
          dropRange.collapse(true);
        }
        
        if (dropRange && editor.contains(dropRange.startContainer)) {
          let targetBlock = dropRange.startContainer;
          if (targetBlock.nodeType === Node.TEXT_NODE) targetBlock = targetBlock.parentElement;
          targetBlock = targetBlock.closest('p, div, blockquote, td, th') || targetBlock;
          if (targetBlock && targetBlock !== draggedItem && !draggedItem.contains(targetBlock)) {
            targetBlock.parentNode.insertBefore(draggedItem, targetBlock.nextSibling || targetBlock);
            sendStateToRN();
          }
        }
        draggedItem = null;
      }
    });

    // Paste Sanitization (strips MS Word Mso classes and aggressive inline styles)
    editor.addEventListener('paste', function(e) {
      e.preventDefault();
      let html = (e.clipboardData || window.clipboardData).getData('text/html');
      let text = (e.clipboardData || window.clipboardData).getData('text/plain');

      if (html) {
        html = html.replace(/<!--[\s\S]*?-->/g, '');
        html = html.replace(new RegExp('<xml[\\s\\S]*?<\\/xml>', 'gi'), '');
        html = html.replace(new RegExp('<\\/?[owm]:[^>]*>', 'gi'), '');
        html = html.replace(/font-size\s*:[^;"]*;?/gi, '');
        html = html.replace(/width\s*:[^;"]*;?/gi, '');
        html = html.replace(/class\s*=\s*"[^"]*Mso[^"]*"/gi, '');
        html = html.replace(/\bMso\w+/g, '');

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const allEls = [doc.body, ...Array.from(doc.body.querySelectorAll('*'))];
        allEls.forEach(el => {
          if (el.className && (typeof el.className === 'string') && el.className.includes('Mso')) {
            el.className = el.className.replace(/\bMso\w+/g, '').trim();
            if (!el.className || el.className === '') {
              el.removeAttribute('class');
            }
          }
          if (el.getAttribute('class') && el.getAttribute('class').includes('Mso')) {
            el.removeAttribute('class');
          }

          if (el.style) {
            el.style.fontSize = '';
            el.style.fontFamily = '';
            el.style.lineHeight = '';
            el.style.letterSpacing = '';
            el.style.wordSpacing = '';
            if (el.tagName !== 'TABLE' && el.tagName !== 'TD' && el.tagName !== 'TH' && !el.classList.contains('signature-stamp') && !el.classList.contains('interactive-shape')) {
              el.style.width = '';
              el.style.height = '';
            }
            if (!el.getAttribute('style') || el.getAttribute('style').trim() === '') {
              el.removeAttribute('style');
            }
          }
        });

        const cleanHtml = doc.body.innerHTML;
        document.execCommand('insertHTML', false, cleanHtml);
      } else if (text) {
        document.execCommand('insertText', false, text);
      }

      scanAndHighlightPlaceholders();
      sendStateToRN();
    });

    editor.addEventListener('mouseup', sendStateToRN);
    editor.addEventListener('keyup', sendStateToRN);
    editor.addEventListener('input', sendStateToRN);
    editor.addEventListener('focus', sendStateToRN);
  </script>
</body>
</html>
  `;
};
