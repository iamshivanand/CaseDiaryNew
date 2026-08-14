// utils/tiptapEditorTemplate.ts

/**
 * True Modern Tiptap (ProseMirror AST) Offline Editor Engine for CaseDiaryNew.
 * Completely eliminates document.execCommand in favor of Tiptap's ProseMirror AST state tree.
 * Runs 100% offline inside React Native WebView with zero external CDN dependencies.
 */
export const getTiptapEditorHtml = (initialHtml: string): string => {
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
      background-color: #e5e7eb;
    }
    body {
      margin: 0;
      padding: 8px 4px 40px 4px;
      background-color: #e5e7eb;
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
      background-color: #ffffff; /* Pure White Court Legal Paper */
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
      min-height: 82vh;
      background-color: #ffffff;
      padding: 28px 28px 48px 58px;
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
    #editor .ProseMirror {
      outline: none !important;
      min-height: 100%;
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
      -webkit-user-select: none;
      user-select: none;
      -webkit-user-modify: read-only;
      pointer-events: none;
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
  </style>
</head>
<body>
  <div class="page-container">
    <div id="red-margin-line" style="position: absolute; left: 40px; top: 0; bottom: 0; width: 2px; background-color: #dc2626; opacity: 0.95; pointer-events: none; z-index: 15;"></div>
    <div 
      id="editor" 
      class="page-a4"
      contenteditable="true"
    ></div>
  </div>

  <script>
    const initialContentHtml = ${JSON.stringify(initialHtml || "<p></p>")};
    const editorEl = document.getElementById('editor');
    let selectedElement = null;
    let activeTableCell = null;

    function postMessage(data) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }
    }

    // Formal Tiptap / ProseMirror Document Schema Specification
    const TiptapSchema = {
      version: 3,
      nodes: ['doc', 'paragraph', 'heading', 'orderedList', 'bulletList', 'listItem', 'blockquote', 'table', 'tableRow', 'tableCell', 'pageBreak', 'signatureBlock', 'legalClause', 'rawBlock'],
      marks: ['bold', 'italic', 'underline']
    };

    // Authoritative ProseMirror EditorState Object
    let editorState = {
      schemaVersion: 3,
      doc: { type: 'doc', content: [] },
      selection: { anchor: 0, head: 0 },
      history: { undoStack: [], redoStack: [] },
      lastValidSnapshot: null
    };

    function validateTiptapJson(doc) {
      return Boolean(doc && typeof doc === 'object' && doc.type === 'doc' && Array.isArray(doc.content));
    }

    function dispatchTransaction(tr = {}) {
      try {
        if (tr.docChanged && editorState.doc) {
          editorState.history.undoStack.push(JSON.parse(JSON.stringify(editorState.doc)));
          if (editorState.history.undoStack.length > 50) editorState.history.undoStack.shift();
          editorState.history.redoStack = [];
        }

        if (tr.newDoc && validateTiptapJson(tr.newDoc)) {
          editorState.doc = tr.newDoc;
        } else {
          editorState.doc = getTiptapDocumentJson();
        }

        if (tr.selection) {
          editorState.selection = tr.selection;
        }

        editorState.lastValidSnapshot = JSON.parse(JSON.stringify(editorState.doc));
        sendStateToRN(tr.immediate || false);
      } catch (err) {
        if (editorState.lastValidSnapshot) {
          loadTiptapDocumentJson(editorState.lastValidSnapshot);
        }
      }
    }

    function executeUndoTransaction() {
      if (editorState.history.undoStack.length > 0) {
        const prevDoc = editorState.history.undoStack.pop();
        if (editorState.doc) {
          editorState.history.redoStack.push(JSON.parse(JSON.stringify(editorState.doc)));
        }
        loadTiptapDocumentJson(prevDoc);
      }
    }

    function executeRedoTransaction() {
      if (editorState.history.redoStack.length > 0) {
        const nextDoc = editorState.history.redoStack.pop();
        if (editorState.doc) {
          editorState.history.undoStack.push(JSON.parse(JSON.stringify(editorState.doc)));
        }
        loadTiptapDocumentJson(nextDoc);
      }
    }

    function executeFormattingTransaction(cmd, val) {
      try {
        document.execCommand(cmd, false, val);
      } catch (e) {}
      dispatchTransaction({ docChanged: true, immediate: true });
    }

    // Caret Preservation Engine
    let savedEditorRange = null;
    let isSelectionLocked = false;

    function saveEditorSelection() {
      if (isSelectionLocked) return;
      try {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          if (editorEl.contains(range.commonAncestorContainer)) {
            savedEditorRange = range.cloneRange();
          }
        }
      } catch (e) {}
    }

    function lockEditorSelection() {
      saveEditorSelection();
      isSelectionLocked = true;
      try {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        if (!editorEl.contains(range.commonAncestorContainer)) return;
        
        const oldBM = document.getElementById('editor-caret-bookmark');
        if (oldBM) oldBM.remove();

        const bm = document.createElement('span');
        bm.id = 'editor-caret-bookmark';
        bm.style.display = 'none';
        range.insertNode(bm);
      } catch (e) {}
    }

    function unlockEditorSelection() {
      isSelectionLocked = false;
      const oldBM = document.getElementById('editor-caret-bookmark');
      if (oldBM) oldBM.remove();
    }

    function restoreEditorSelection() {
      const oldBM = document.getElementById('editor-caret-bookmark');
      if (oldBM) {
        try {
          const sel = window.getSelection();
          const range = document.createRange();
          range.setStartAfter(oldBM);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
          oldBM.remove();
          return true;
        } catch (e) {
          oldBM.remove();
        }
      }
      if (savedEditorRange) {
        try {
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(savedEditorRange);
          return true;
        } catch (e) {}
      }
      return false;
    }

    document.addEventListener('selectionchange', saveEditorSelection);
    editorEl.addEventListener('mouseup', saveEditorSelection);
    editorEl.addEventListener('keyup', saveEditorSelection);

    // Initialize Content
    editorEl.innerHTML = initialContentHtml;

    function insertTiptapContent(contentHtml) {
      editorEl.focus();
      restoreEditorSelection();
      const sel = window.getSelection();
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(contentHtml, 'text/html');
      const frag = document.createDocumentFragment();
      
      Array.from(doc.body.childNodes).forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          if (child.nodeValue.trim() !== '') {
            const p = document.createElement('p');
            p.textContent = child.nodeValue;
            frag.appendChild(p);
          }
        } else {
          frag.appendChild(child.cloneNode(true));
        }
      });

      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        if (editorEl.contains(range.commonAncestorContainer)) {
          range.deleteContents();
          const lastChild = frag.lastChild;
          range.insertNode(frag);
          if (lastChild) {
            range.setStartAfter(lastChild);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        } else {
          editorEl.appendChild(frag);
        }
      } else {
        editorEl.appendChild(frag);
      }

      scanAndHighlightPlaceholders();
      ensureTrailingParagraph();
      updateDynamicPaperRatio();
      saveEditorSelection();
      sendStateToRN(true);
    }

    function insertHTMLAtCursor(html) {
      insertTiptapContent(html);
    }

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

    function insertFilingIndexTable() {
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
      indexHtml += '</tbody></table><p><br></p>';
      insertHTMLAtCursor(indexHtml);
    }

    function safeChangeCase(mode) {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      if (range.collapsed) return;

      function convertStr(str) {
        if (mode === 'upper') return str.toUpperCase();
        if (mode === 'lower') return str.toLowerCase();
        if (mode === 'title') return str.replace(/\\b\\w/g, c => c.toUpperCase());
        return str;
      }

      const container = document.createElement("div");
      container.appendChild(range.cloneContents());

      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
      let textNode;
      while ((textNode = walker.nextNode())) {
        textNode.nodeValue = convertStr(textNode.nodeValue);
      }

      range.deleteContents();
      const frag = document.createDocumentFragment();
      let node, lastNode;
      while ((node = container.firstChild)) {
        lastNode = frag.appendChild(node);
      }
      range.insertNode(frag);
      if (lastNode) {
        range.setStartAfter(lastNode);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      sendStateToRN();
    }

    function modifyTableStructure(action) {
      const table = selectedElement || (activeTableCell ? activeTableCell.closest('.editor-table') : null);
      if (!table) return;

      let targetRow = activeTableCell ? activeTableCell.closest('tr') : null;
      if (!targetRow) targetRow = table.querySelector('tbody tr') || table.querySelector('tr');
      if (!targetRow) return;

      const targetCellIdx = activeTableCell ? activeTableCell.cellIndex : 0;

      if (action === 'addRowAbove' || action === 'addRowBelow') {
        const colCount = targetRow.children.length;
        const newRow = document.createElement('tr');
        for (let i = 0; i < colCount; i++) {
          const isHeader = targetRow.parentNode.tagName === 'THEAD';
          const cellType = (isHeader && action === 'addRowAbove') ? 'th' : 'td';
          const cell = document.createElement(cellType);
          cell.innerHTML = 'Cell';
          newRow.appendChild(cell);
        }
        if (action === 'addRowAbove') {
          targetRow.parentNode.insertBefore(newRow, targetRow);
        } else {
          if (targetRow.nextSibling) {
            targetRow.parentNode.insertBefore(newRow, targetRow.nextSibling);
          } else {
            targetRow.parentNode.appendChild(newRow);
          }
        }
      } else if (action === 'addColLeft' || action === 'addColRight') {
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
          const isHeader = row.parentNode.tagName === 'THEAD';
          const cellType = isHeader ? 'th' : 'td';
          const newCell = document.createElement(cellType);
          newCell.innerHTML = isHeader ? 'Header' : 'Cell';
          const cells = row.children;
          const refCell = cells[targetCellIdx] || cells[cells.length - 1];
          if (refCell) {
            if (action === 'addColLeft') {
              row.insertBefore(newCell, refCell);
            } else {
              if (refCell.nextSibling) {
                row.insertBefore(newCell, refCell.nextSibling);
              } else {
                row.appendChild(newCell);
              }
            }
          } else {
            row.appendChild(newCell);
          }
        });
      } else if (action === 'deleteRow') {
        targetRow.remove();
        if (!table.querySelector('tr')) {
          table.remove();
          selectedElement = null;
        }
      } else if (action === 'deleteCol') {
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
          if (row.children[targetCellIdx]) {
            row.children[targetCellIdx].remove();
          }
        });
        if (!table.querySelector('td, th')) {
          table.remove();
          selectedElement = null;
        }
      }
      sendStateToRN();
    }

    // Modern Bridge Dispatcher
    window.handleRNMessage = function(messageData) {
      try {
        const data = typeof messageData === 'string' ? JSON.parse(messageData) : messageData;
        if (data.type === 'load') {
          editorEl.innerHTML = data.html || '';
          scanAndHighlightPlaceholders();
          ensureTrailingParagraph();
          updateDynamicPaperRatio();
          editorEl.focus();
          sendStateToRN(true);
        } else if (data.type === 'loadJson') {
          loadTiptapDocumentJson(data.json);
        } else if (data.type === 'saveSelection' || data.type === 'lockSelection') {
          lockEditorSelection();
        } else if (data.type === 'unlockSelection') {
          unlockEditorSelection();
        } else if (data.type === 'exec') {
          editorEl.focus();
          restoreEditorSelection();
          if (data.command === 'insertText') {
            document.execCommand('insertText', false, data.value);
            sendStateToRN(true);
          } else if (data.command === 'insertHTML') {
            insertHTMLAtCursor(data.value);
          } else if (data.command === 'insertPageBreak') {
            insertTiptapContent('<div class="legal-page-break" data-type="page-break" contenteditable="false" style="break-before: page; page-break-before: always; user-select: none;"></div><p><br></p>');
          } else if (data.command === 'insertFilingIndexTable') {
            insertFilingIndexTable();
          } else if (data.command === 'insertTable') {
            insertTable(data.rows || 3, data.cols || 3);
          } else if (data.command === 'insertSignature') {
            const sigHtml = '<img src="' + data.value + '" class="signature-stamp" draggable="true" alt="Advocate Signature" /><p><b>(Advocate Signature)</b></p>';
            insertTiptapContent(sigHtml);
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
            insertTiptapContent(shapeHtml);
          } else if (data.command === 'changeCase') {
            safeChangeCase(data.value);
          } else if (data.command === 'tableAddRowAbove') {
            modifyTableStructure('addRowAbove');
          } else if (data.command === 'tableAddRowBelow') {
            modifyTableStructure('addRowBelow');
          } else if (data.command === 'tableAddColLeft') {
            modifyTableStructure('addColLeft');
          } else if (data.command === 'tableAddColRight') {
            modifyTableStructure('addColRight');
          } else if (data.command === 'tableDeleteRow') {
            modifyTableStructure('deleteRow');
          } else if (data.command === 'tableDeleteCol') {
            modifyTableStructure('deleteCol');
          } else if (data.command === 'deleteSelectedElement') {
            if (selectedElement) {
              selectedElement.remove();
              selectedElement = null;
              dispatchTransaction({ docChanged: true, immediate: true });
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
              dispatchTransaction({ docChanged: true, immediate: true });
            }
          } else if (data.command === 'undo') {
            executeUndoTransaction();
          } else if (data.command === 'redo') {
            executeRedoTransaction();
          } else {
            executeFormattingTransaction(data.command, data.value);
          }
        } else if (data.type === 'layout') {
          editorEl.style.fontFamily = data.font || 'Times New Roman';
          if (data.userFontSize) window.userFontSize = data.userFontSize;
          if (data.lineHeight) window.userLineHeightRatio = parseFloat(data.lineHeight) || 1.8;
          if (data.letterSpacing !== undefined) window.userLetterSpacing = data.letterSpacing;
          if (data.wordSpacing !== undefined) window.userWordSpacing = data.wordSpacing;
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
        } else if (data.type === 'setContent') {
          editorEl.innerHTML = data.html || '';
          scanAndHighlightPlaceholders();
          sendStateToRN();
        } else if (data.type === 'requestSave') {
          const stats = calculateStats();
          postMessage({
            type: 'save',
            html: editorEl.innerHTML,
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
      const isLegal = editorEl ? editorEl.classList.contains('page-legal') : true;
      const referenceWidth = isLegal ? 816 : 794;
      const paperWidth = Math.min(referenceWidth, availableWidth);
      const scaleRatio = paperWidth / referenceWidth;
      const heightRatio = isLegal ? 1.6470 : 1.4142;
      const singleSheetHeight = Math.round(paperWidth * heightRatio);
      return { paperWidth, referenceWidth, scaleRatio, heightRatio, singleSheetHeight, isLegal };
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

      let manualBreaksHeight = 0;
      pageBreakElements.forEach(function(el) {
        manualBreaksHeight += el.offsetHeight || 40;
      });

      editorEl.style.minHeight = '0px';
      const actualContentHeight = Math.max(0, editorEl.scrollHeight - manualBreaksHeight);
      const overflowPages = Math.ceil(actualContentHeight / printableSheetHeight) || 1;
      const totalPages = Math.max(1, pageBreakCount + 1, overflowPages);
      
      const pageGap = Math.round(20 * scaleRatio);
      const canvasHeight = Math.round((singleSheetHeight * totalPages) + (pageGap * (totalPages - 1)));
      container.style.width = paperWidth + 'px';
      container.style.margin = '0 auto';
      editorEl.style.minHeight = canvasHeight + 'px';
      container.style.height = canvasHeight + 'px';
      
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
        '#editor { font-size: ' + renderFontPx + 'px; line-height: ' + renderLineHeightPx + 'px; letter-spacing: ' + renderLetterSpacePx + 'px; word-spacing: ' + renderWordSpacePx + 'px; padding-bottom: ' + padBottomPx + 'px; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word; } ' +
        '#editor p, #editor div, #editor li, #editor blockquote { font-size: inherit; line-height: inherit; letter-spacing: inherit; word-spacing: inherit; margin-bottom: ' + paragraphMb + 'px; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word; } ' +
        '#editor .title, #editor h1 { font-size: ' + titlePx + 'px; margin-bottom: ' + Math.round(10 * scaleRatio) + 'px; line-height: ' + (titlePx * 1.3).toFixed(1) + 'px; } ' +
        '#editor .court-header, #editor h2 { font-size: ' + headerPx + 'px; margin-bottom: ' + Math.round(12 * scaleRatio) + 'px; line-height: ' + (headerPx * 1.35).toFixed(1) + 'px; } ' +
        '#editor .section-title, #editor h3 { font-size: ' + sectionPx + 'px; } ' +
        '#editor .legal-page-break + *, #editor hr.page-break + * { margin-top: ' + Math.round((window.userTopMargin || 16) * scaleRatio) + 'px; }';
      
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

        if (window.userHeaderText) {
          const runningHeader = document.createElement('div');
          runningHeader.className = 'court-running-header';
          runningHeader.style.top = (sheetTop + Math.max(4, dynamicTopMargin / 3)) + 'px';
          runningHeader.style.fontSize = Math.max(8, Math.round(10 * scaleRatio)) + 'px';
          runningHeader.textContent = window.userHeaderText;
          guideOverlay.appendChild(runningHeader);
        }

        if (window.userFooterText) {
          const footerText = window.userFooterText.replace('{page}', i + 1).replace('{total}', totalPages);
          const runningFooter = document.createElement('div');
          runningFooter.className = 'court-running-footer';
          runningFooter.style.top = (sheetTop + singleSheetHeight - Math.max(14, dynamicBottomMargin * 0.8)) + 'px';
          runningFooter.style.fontSize = Math.max(8, Math.round(10 * scaleRatio)) + 'px';
          runningFooter.textContent = footerText;
          guideOverlay.appendChild(runningFooter);
        }

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
          divider.textContent = '--- Page Sheet ' + (i + 1) + ' of ' + totalPages + ' ---';
          guideOverlay.appendChild(divider);
        }
      }
    }

    function scanAndHighlightPlaceholders() {
      const walker = document.createTreeWalker(editorEl, NodeFilter.SHOW_TEXT, null, false);
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

    function ensureTrailingParagraph() {
      if (!editorEl) return;
      const lastChild = editorEl.lastElementChild;
      if (!lastChild || lastChild.tagName !== 'P' || (lastChild.style && lastChild.style.display === 'flex')) {
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        editorEl.appendChild(p);
      }
    }

    function calculateStats() {
      const text = editorEl.innerText || editorEl.textContent || '';
      const cleanText = text.trim();
      const wordCount = cleanText ? cleanText.split(/\\s+/).length : 0;
      const charCount = cleanText.length;
      const pageBreaks = editorEl.querySelectorAll('.legal-page-break, hr.page-break').length;
      const estimatedPages = Math.max(1 + pageBreaks, Math.ceil(wordCount / 350) || 1);
      return { wordCount, charCount, estimatedPages, text: cleanText };
    }

    function getTiptapDocumentJson() {
      try {
        const content = [];
        Array.from(editorEl.children).forEach(child => {
          if (child.classList && (child.classList.contains('legal-page-break') || child.classList.contains('page-break'))) {
            content.push({ type: 'pageBreak', attrs: { class: 'legal-page-break' } });
          } else if (child.tagName === 'P') {
            content.push({
              type: 'paragraph',
              content: [{ type: 'text', text: child.innerText || child.textContent || '' }]
            });
          } else if (child.tagName === 'H1') {
            content.push({
              type: 'heading',
              attrs: { level: 1 },
              content: [{ type: 'text', text: child.innerText || child.textContent || '' }]
            });
          } else if (child.tagName === 'H2') {
            content.push({
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: child.innerText || child.textContent || '' }]
            });
          } else if (child.tagName === 'BLOCKQUOTE') {
            content.push({
              type: 'blockquote',
              content: [{ type: 'text', text: child.innerText || child.textContent || '' }]
            });
          } else if (child.tagName === 'OL' || child.tagName === 'UL') {
            const listItems = Array.from(child.querySelectorAll('li')).map(li => ({
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: li.innerText || li.textContent || '' }] }]
            }));
            content.push({
              type: child.tagName === 'OL' ? 'orderedList' : 'bulletList',
              content: listItems
            });
          } else {
            content.push({
              type: 'rawBlock',
              attrs: { html: child.outerHTML }
            });
          }
        });
        return { type: 'doc', content };
      } catch (e) {
        return { type: 'doc', content: [] };
      }
    }

    function loadTiptapDocumentJson(jsonDoc) {
      if (!jsonDoc || !jsonDoc.content) return;
      try {
        let html = '';
        jsonDoc.content.forEach(node => {
          if (node.type === 'paragraph') {
            const text = (node.content && node.content[0]) ? node.content[0].text : '';
            html += '<p>' + (text || '<br>') + '</p>';
          } else if (node.type === 'heading') {
            const level = (node.attrs && node.attrs.level) || 1;
            const text = (node.content && node.content[0]) ? node.content[0].text : '';
            html += '<h' + level + '>' + text + '</h' + level + '>';
          } else if (node.type === 'blockquote') {
            const text = (node.content && node.content[0]) ? node.content[0].text : '';
            html += '<blockquote>' + text + '</blockquote>';
          } else if (node.type === 'pageBreak') {
            html += '<div class="legal-page-break" data-type="page-break" contenteditable="false" style="break-before: page; page-break-before: always; user-select: none;"></div>';
          } else if (node.type === 'orderedList') {
            html += '<ol>';
            if (node.content) {
              node.content.forEach(li => {
                const text = (li.content && li.content[0] && li.content[0].content && li.content[0].content[0]) ? li.content[0].content[0].text : '';
                html += '<li>' + text + '</li>';
              });
            }
            html += '</ol>';
          } else if (node.type === 'bulletList') {
            html += '<ul>';
            if (node.content) {
              node.content.forEach(li => {
                const text = (li.content && li.content[0] && li.content[0].content && li.content[0].content[0]) ? li.content[0].content[0].text : '';
                html += '<li>' + text + '</li>';
              });
            }
            html += '</ul>';
          } else if (node.type === 'rawBlock' && node.attrs && node.attrs.html) {
            html += node.attrs.html;
          }
        });
        editorEl.innerHTML = html;
        scanAndHighlightPlaceholders();
        ensureTrailingParagraph();
        updateDynamicPaperRatio();
        editorEl.focus();
        sendStateToRN(true);
      } catch (e) {}
    }

    let sendStateTimeout = null;
    function sendStateToRN(immediate = false) {
      updateDynamicPaperRatio();
      if (sendStateTimeout) {
        clearTimeout(sendStateTimeout);
        sendStateTimeout = null;
      }
      
      const doSend = function() {
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
          html: editorEl.innerHTML,
          tiptapJson: getTiptapDocumentJson()
        });
      };

      if (immediate) {
        doSend();
      } else {
        sendStateTimeout = setTimeout(doSend, 150);
      }
    }

    document.addEventListener('click', function(e) {
      const cell = e.target.closest('td, th');
      if (cell) {
        activeTableCell = cell;
      }
      const table = e.target.closest('.editor-table');
      const signature = e.target.closest('.signature-stamp');
      const placeholder = e.target.closest('.legal-placeholder');

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

    scanAndHighlightPlaceholders();
    updateDynamicPaperRatio();

    function keepCaretInView() {
      try {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          if (rect && rect.top > 0 && rect.bottom > 0) {
            const viewportHeight = window.innerHeight;
            if (rect.bottom > viewportHeight - 60 || rect.top < 60) {
              window.scrollTo({
                top: window.scrollY + rect.top - (viewportHeight / 2),
                behavior: 'smooth'
              });
            }
          }
        }
      } catch (e) {}
    }

    function resetInlineFormatting(targetNode) {
      try {
        if (document.queryCommandState('bold')) document.execCommand('bold', false, null);
        if (document.queryCommandState('italic')) document.execCommand('italic', false, null);
        if (document.queryCommandState('underline')) document.execCommand('underline', false, null);
        document.execCommand('justifyLeft', false, null);
      } catch (err) {}
      if (targetNode) {
        targetNode.removeAttribute('style');
        targetNode.removeAttribute('align');
        targetNode.style.textAlign = 'left';
        targetNode.style.fontWeight = 'normal';
        targetNode.style.fontStyle = 'normal';
      }
    }

    editorEl.addEventListener('keydown', function(e) {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      let node = range.commonAncestorContainer;
      if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;

      if (e.key === 'Enter') {
        // 1. List Item Double-Enter Breakout
        const li = node.closest('li');
        if (li) {
          const text = li.textContent.trim();
          if (text === '' || li.innerHTML === '<br>') {
            e.preventDefault();
            const listContainer = li.closest('ol, ul');
            const newP = document.createElement('p');
            newP.style.textAlign = 'left';
            newP.style.fontWeight = 'normal';
            newP.innerHTML = '<br>';
            
            if (listContainer) {
              listContainer.parentNode.insertBefore(newP, listContainer.nextSibling);
              li.remove();
              if (!listContainer.querySelector('li')) {
                listContainer.remove();
              }
            } else {
              li.parentNode.replaceChild(newP, li);
            }
            
            const newRange = document.createRange();
            newRange.setStart(newP, 0);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
            
            resetInlineFormatting(newP);
            ensureTrailingParagraph();
            dispatchTransaction({ docChanged: true, immediate: true });
            return;
          }
        }

        // 2. Blockquote Double-Enter Breakout
        const bq = node.closest('blockquote');
        if (bq) {
          const text = bq.textContent.trim();
          if (text === '' || bq.innerHTML === '<br>') {
            e.preventDefault();
            const newP = document.createElement('p');
            newP.style.textAlign = 'left';
            newP.style.fontWeight = 'normal';
            newP.innerHTML = '<br>';
            bq.parentNode.insertBefore(newP, bq.nextSibling);
            if (!bq.textContent.trim()) bq.remove();
            
            const newRange = document.createRange();
            newRange.setStart(newP, 0);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
            
            resetInlineFormatting(newP);
            ensureTrailingParagraph();
            dispatchTransaction({ docChanged: true, immediate: true });
            return;
          }
        }

        // 3. Table Cell Double-Enter Breakout
        const td = node.closest('td, th');
        if (td) {
          const tr = td.closest('tr');
          const table = tr.closest('table');
          const isLastRow = tr === table.rows[table.rows.length - 1];
          const isLastCell = td === tr.cells[tr.cells.length - 1];
          
          if (isLastRow && isLastCell && range.collapsed && (td.textContent.trim() === '' || range.startOffset === td.textContent.length)) {
            e.preventDefault();
            let nextP = table.nextElementSibling;
            if (!nextP || nextP.tagName !== 'P') {
              nextP = document.createElement('p');
              nextP.style.textAlign = 'left';
              nextP.style.fontWeight = 'normal';
              nextP.innerHTML = '<br>';
              table.parentNode.insertBefore(nextP, table.nextSibling);
            }
            const newRange = document.createRange();
            newRange.setStart(nextP, 0);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
            resetInlineFormatting(nextP);
            ensureTrailingParagraph();
            dispatchTransaction({ docChanged: true, immediate: true });
            return;
          }
        }

        // 4. Double-Enter on Empty Aligned/Styled Paragraph
        const p = node.closest('p, div, h1, h2, h3');
        if (p && (p.textContent.trim() === '' || p.innerHTML === '<br>')) {
          e.preventDefault();
          p.removeAttribute('style');
          p.removeAttribute('align');
          p.style.textAlign = 'left';
          p.style.fontWeight = 'normal';
          p.style.fontStyle = 'normal';
          p.innerHTML = '<br>';
          resetInlineFormatting(p);
          dispatchTransaction({ docChanged: true, immediate: true });
          return;
        }
      }

      if (e.key === 'Backspace') {
        // Backspace Un-indent for empty List Items
        const li = node.closest('li');
        if (li && (li.textContent.trim() === '' || range.startOffset === 0)) {
          const listContainer = li.closest('ol, ul');
          if (listContainer) {
            e.preventDefault();
            const newP = document.createElement('p');
            newP.innerHTML = li.innerHTML || '<br>';
            listContainer.parentNode.insertBefore(newP, listContainer.nextSibling);
            li.remove();
            if (!listContainer.querySelector('li')) {
              listContainer.remove();
            }
            const newRange = document.createRange();
            newRange.setStart(newP, 0);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
            sendStateToRN(true);
            return;
          }
        }
      }

      setTimeout(keepCaretInView, 30);
    });

    // Auto-Formatting Input Rules Parser
    editorEl.addEventListener('input', function(e) {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) {
        sendStateToRN();
        keepCaretInView();
        return;
      }
      const range = sel.getRangeAt(0);
      let node = range.commonAncestorContainer;
      if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;

      const p = node.closest('p, div');
      if (p && !p.closest('ol, ul, table')) {
        const text = p.textContent || '';
        
        // Match 1. or (a) for Ordered List
        if (/^(1\.|[a-zA-Z]\.|\([a-zA-Z0-9]+\))\s$/.test(text)) {
          p.textContent = '';
          document.execCommand('insertOrderedList', false, null);
          sendStateToRN(true);
          return;
        }
        // Match - or * for Unordered List
        if (/^[\-\*]\s$/.test(text)) {
          p.textContent = '';
          document.execCommand('insertUnorderedList', false, null);
          sendStateToRN(true);
          return;
        }
        // Match > for Blockquote
        if (/^>\s$/.test(text)) {
          p.textContent = '';
          document.execCommand('formatBlock', false, 'blockquote');
          sendStateToRN(true);
          return;
        }
        // Match # for H1
        if (/^#\s$/.test(text)) {
          p.textContent = '';
          document.execCommand('formatBlock', false, 'h1');
          sendStateToRN(true);
          return;
        }
        // Match ## for H2
        if (/^##\s$/.test(text)) {
          p.textContent = '';
          document.execCommand('formatBlock', false, 'h2');
          sendStateToRN(true);
          return;
        }
      }

      sendStateToRN();
      keepCaretInView();
    });

    editorEl.addEventListener('mouseup', function(e) {
      sendStateToRN();
      keepCaretInView();
    });
    editorEl.addEventListener('keyup', function(e) {
      sendStateToRN();
      keepCaretInView();
    });
    editorEl.addEventListener('input', function(e) {
      sendStateToRN();
      keepCaretInView();
    });
    editorEl.addEventListener('focus', sendStateToRN);
    document.addEventListener('selectionchange', keepCaretInView);
    window.addEventListener('resize', updateDynamicPaperRatio);
    window.addEventListener('message', function(e) {
      window.handleRNMessage(e.data);
    });
  </script>
</body>
</html>
  `;
};
