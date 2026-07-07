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
      padding: 12px;
      padding-bottom: 120px; /* Space for keyboard */
    }
    .page-container {
      position: relative;
      width: 100%;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border-radius: 4px;
      overflow: hidden;
    }
    #editor {
      outline: none;
      width: 100%;
      min-height: 80vh;
      background-color: #fcf9f2; /* Court paper yellowish color */
      padding: 24px;
      padding-left: 55px; /* Leave space for left red ledger line */
      padding-right: 24px;
      box-sizing: border-box;
      font-family: 'Times New Roman', Georgia, serif;
      font-size: 16px;
      line-height: 1.8;
      color: #1f2937;
      -webkit-user-select: text;
      user-select: text;
    }
    #editor.page-a4 {
      min-height: 297mm;
    }
    #editor.page-legal {
      min-height: 355mm;
    }
    #editor p {
      margin: 0 0 12px 0;
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
    <div id="red-margin-line" style="position: absolute; left: 40px; top: 0; bottom: 0; width: 1.5px; background-color: #ef4444; opacity: 0.75; pointer-events: none; z-index: 10;"></div>
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

    // Auto-focus on load
    editor.focus();

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

    // Direct message handler for injectJavaScript reliability
    window.handleRNMessage = function(messageData) {
      try {
        const data = typeof messageData === 'string' ? JSON.parse(messageData) : messageData;
        if (data.type === 'load') {
          editor.innerHTML = data.html || '';
          scanAndHighlightPlaceholders();
          editor.focus();
        } else if (data.type === 'exec') {
          editor.focus();
          if (data.command === 'insertText') {
            document.execCommand('insertText', false, data.value);
            sendStateToRN();
          } else if (data.command === 'insertHTML') {
            insertHTMLAtCursor(data.value);
            sendStateToRN();
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
          } else if (data.command === 'nextPlaceholder') {
            const selection = window.getSelection();
            const range = document.createRange();
            
            const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null, false);
            let node;
            let found = false;
            
            let afterActiveSelection = selection.rangeCount > 0 ? false : true;
            const activeNode = selection.rangeCount > 0 ? selection.anchorNode : null;
 
            while (node = walker.nextNode()) {
              if (!afterActiveSelection) {
                if (node === activeNode) {
                  afterActiveSelection = true;
                }
                continue;
              }
 
              const val = node.nodeValue;
              const match = val.match(/\[[^\]]+\]|__+/);
              if (match) {
                const startIdx = match.index;
                const endIdx = startIdx + match[0].length;
                
                range.setStart(node, startIdx);
                range.setEnd(node, endIdx);
                
                selection.removeAllRanges();
                selection.addRange(range);
                
                node.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                found = true;
                break;
              }
            }
 
            if (!found) {
              const wrapWalker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null, false);
              while (node = wrapWalker.nextNode()) {
                const val = node.nodeValue;
                const match = val.match(/\[[^\]]+\]|__+/);
                if (match) {
                  const startIdx = match.index;
                  const endIdx = startIdx + match[0].length;
                  
                  range.setStart(node, startIdx);
                  range.setEnd(node, endIdx);
                  
                  selection.removeAllRanges();
                  selection.addRange(range);
                  
                  node.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  break;
                }
              }
            }
          } else {
            execCmd(data.command, data.value);
          }
        } else if (data.type === 'layout') {
          editor.style.fontFamily = data.font || 'Times New Roman';
          editor.style.lineHeight = data.lineHeight || '1.8';
          
          const topMargin = data.topMargin !== undefined ? data.topMargin : 24;
          const bottomMargin = data.bottomMargin !== undefined ? data.bottomMargin : 24;
          const leftMargin = data.leftMargin !== undefined ? data.leftMargin : 55;
          const rightMargin = data.rightMargin !== undefined ? data.rightMargin : 24;
          const letterheadSpace = data.letterheadSpace !== undefined ? data.letterheadSpace : 0;
          
          editor.style.paddingTop = (topMargin + letterheadSpace) + 'px';
          editor.style.paddingBottom = (bottomMargin + 100) + 'px';
          editor.style.paddingLeft = leftMargin + 'px';
          editor.style.paddingRight = rightMargin + 'px';
          
          const redMargin = document.getElementById('red-margin-line');
          if (redMargin) {
            redMargin.style.left = (leftMargin - 15) + 'px';
          }
          
          if (data.pageSize) {
            editor.className = data.pageSize === 'legal' ? 'page-legal' : 'page-a4';
            if (!data.lineHeight) {
              editor.style.lineHeight = data.pageSize === 'legal' ? '2.0' : '1.5';
            }
          }
        } else if (data.type === 'requestSave') {
          postMessage({
            type: 'save',
            html: editor.innerHTML
          });
        }
      } catch (err) {
        postMessage({
          type: 'error',
          error: err.message
        });
      }
    };
 
    // Communicate changes and state (legacy fallback for postMessage)
    window.addEventListener('message', function(e) {
      window.handleRNMessage(e.data);
    });
 
    // Notify React Native about current formatting state at selection
    function sendStateToRN() {
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
        state: state
      });
    }

    function insertHTMLAtCursor(html) {
      const sel = window.getSelection();
      if (sel.getRangeAt && sel.rangeCount) {
        const range = sel.getRangeAt(0);
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
        }
      }
    }

    function scanAndHighlightPlaceholders() {
      const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null, false);
      const textNodes = [];
      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node);
      }
      
      const regex = /\[[^\]]+\]|__+/g;
      
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

    // Tap to edit placeholders
    document.addEventListener('click', function(e) {
      const placeholder = e.target.closest('.legal-placeholder');
      if (placeholder) {
        e.preventDefault();
        e.stopPropagation();
        
        const label = placeholder.textContent;
        const newVal = window.prompt("Fill Placeholder Details:", label.replace(/[\[\]]/g, ''));
        if (newVal !== null) {
          const cleanVal = newVal.trim();
          if (cleanVal) {
            const allPlaceholders = Array.from(document.querySelectorAll('.legal-placeholder'));
            allPlaceholders.forEach(p => {
              if (p.textContent === label) {
                p.textContent = cleanVal;
                p.classList.remove('legal-placeholder');
                p.style.backgroundColor = 'transparent';
                p.style.borderBottom = 'none';
              }
            });
            sendStateToRN();
          }
        }
      }
    });

    // Scan initial placeholders on load
    scanAndHighlightPlaceholders();
 
    // Trigger state checks on interaction
    editor.addEventListener('mouseup', sendStateToRN);
    editor.addEventListener('keyup', sendStateToRN);
    editor.addEventListener('input', sendStateToRN);
    editor.addEventListener('focus', sendStateToRN);
  </script>
</body>
</html>
  `;
};
