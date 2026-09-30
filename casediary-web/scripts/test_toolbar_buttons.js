const http = require('http');

async function getWsUrl() {
  const res = await fetch('http://127.0.0.1:9222/json');
  const tabs = await res.json();
  const draftTab = tabs.find(t => t.url && t.url.includes('/drafts'));
  if (draftTab) return draftTab.webSocketDebuggerUrl;
  const pageTab = tabs.find(t => t.type === 'page');
  return pageTab ? pageTab.webSocketDebuggerUrl : null;
}

async function run() {
  const wsUrl = await getWsUrl();
  console.log('Connecting to WebSocket:', wsUrl);
  if (!wsUrl) {
    console.error('No tab found!');
    process.exit(1);
  }

  const ws = new WebSocket(wsUrl);

  let idCounter = 1;
  const pending = new Map();

  function sendCmd(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve } = pending.get(data.id);
      pending.delete(data.id);
      resolve(data.result);
    }
  };

  ws.onopen = async () => {
    console.log('WebSocket connected. Running tests directly...');

    // Test 1: Check presence of all toolbar buttons
    const checkPresence = await sendCmd('Runtime.evaluate', {
      expression: `(() => {
        const ids = [
          'toolbar-bold-btn',
          'toolbar-italic-btn',
          'toolbar-underline-btn',
          'toolbar-strike-btn',
          'toolbar-highlight-btn',
          'toolbar-align-left-btn',
          'toolbar-align-center-btn',
          'toolbar-align-right-btn',
          'toolbar-align-justify-btn',
          'toolbar-h1-btn',
          'toolbar-h2-btn',
          'toolbar-h3-btn',
          'toolbar-bullet-list-btn',
          'toolbar-ordered-list-btn',
          'toolbar-insert-table-btn',
          'toolbar-font-size-select',
          'toolbar-line-height-select',
          'toolbar-margins-btn',
          'toolbar-ruler-btn',
          'toolbar-print-btn',
          'toolbar-save-btn'
        ];
        return ids.map(id => ({ id, exists: !!document.getElementById(id) }));
      })()`,
      returnByValue: true
    });

    console.log('--- BUTTON PRESENCE CHECK ---');
    console.log(JSON.stringify(checkPresence.result.value, null, 2));

    // Test 2: Perform interactive formatting tests on TipTap editor
    const formatTests = await sendCmd('Runtime.evaluate', {
      expression: `(() => {
        const proseMirror = document.querySelector('.ProseMirror');
        if (!proseMirror) return { error: 'ProseMirror not found' };

        const results = {};

        // Focus and select the first paragraph
        const firstP = proseMirror.querySelector('p');
        if (!firstP) return { error: 'No paragraph found' };

        // Helper to select text inside node
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(firstP);
        sel.removeAllRanges();
        sel.addRange(range);

        // Test Bold
        const boldBtn = document.getElementById('toolbar-bold-btn');
        if (boldBtn) {
          boldBtn.click();
          results.boldApplied = !!firstP.querySelector('strong') || firstP.innerHTML.includes('<strong>');
        }

        // Test Italic
        const italicBtn = document.getElementById('toolbar-italic-btn');
        if (italicBtn) {
          italicBtn.click();
          results.italicApplied = !!firstP.querySelector('em') || firstP.innerHTML.includes('<em>');
        }

        // Test Underline
        const underlineBtn = document.getElementById('toolbar-underline-btn');
        if (underlineBtn) {
          underlineBtn.click();
          results.underlineApplied = !!firstP.querySelector('u') || firstP.innerHTML.includes('<u>');
        }

        // Test Strikethrough
        const strikeBtn = document.getElementById('toolbar-strike-btn');
        if (strikeBtn) {
          strikeBtn.click();
          results.strikeApplied = !!firstP.querySelector('s') || firstP.innerHTML.includes('<s>');
        }

        // Test Heading 1, 2, 3
        const h1Btn = document.getElementById('toolbar-h1-btn');
        if (h1Btn) {
          h1Btn.click();
          results.h1Created = proseMirror.querySelectorAll('h1').length;
        }

        const h2Btn = document.getElementById('toolbar-h2-btn');
        if (h2Btn) {
          h2Btn.click();
          results.h2Created = proseMirror.querySelectorAll('h2').length;
        }

        const h3Btn = document.getElementById('toolbar-h3-btn');
        if (h3Btn) {
          h3Btn.click();
          results.h3Created = proseMirror.querySelectorAll('h3').length;
        }

        // Test Font Size (16pt)
        const fsSelect = document.getElementById('toolbar-font-size-select');
        if (fsSelect) {
          fsSelect.value = '16pt';
          fsSelect.dispatchEvent(new Event('change', { bubbles: true }));
          results.fontSizeHtml = firstP.outerHTML.substring(0, 150);
        }

        // Test Line Height (2.0)
        const lhSelect = document.getElementById('toolbar-line-height-select');
        if (lhSelect) {
          lhSelect.value = '2.0';
          lhSelect.dispatchEvent(new Event('change', { bubbles: true }));
          results.lineHeightHtml = firstP.outerHTML.substring(0, 150);
        }

        // Test Alignment (Justify)
        const justifyBtn = document.getElementById('toolbar-align-justify-btn');
        if (justifyBtn) {
          justifyBtn.click();
          results.justifyApplied = firstP.style.textAlign === 'justify' || firstP.getAttribute('style')?.includes('text-align: justify');
        }

        return results;
      })()`,
      returnByValue: true
    });

    console.log('\n--- INTERACTIVE FORMATTING TEST RESULTS ---');
    console.log(JSON.stringify(formatTests.result.value, null, 2));

    // Test 3: Test Print Iframe generation and verify no whitespace inflation
    const printTest = await sendCmd('Runtime.evaluate', {
      expression: `(() => {
        const printBtn = document.getElementById('toolbar-print-btn');
        if (!printBtn) return { error: 'Print button not found' };

        printBtn.click();

        // Check if iframe was created
        const iframe = document.getElementById('court-print-iframe');
        if (!iframe) return { error: 'Print iframe not injected' };

        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return { error: 'Iframe document not accessible' };

        const sheets = Array.from(doc.querySelectorAll('.court-print-sheet'));
        const sheetDetails = sheets.map((s, idx) => {
          const rect = s.getBoundingClientRect();
          const content = s.querySelector('.court-print-content');
          const contentRect = content ? content.getBoundingClientRect() : null;
          const paras = content ? Array.from(content.querySelectorAll('p')) : [];
          const paraHeights = paras.slice(0, 5).map(p => ({
            text: p.textContent.substring(0, 30),
            height: p.getBoundingClientRect().height,
            style: p.getAttribute('style')
          }));

          return {
            sheetIndex: idx + 1,
            computedDisplay: window.getComputedStyle(s).display,
            sheetHeight: rect.height,
            contentHeight: contentRect ? contentRect.height : 0,
            contentDisplay: content ? window.getComputedStyle(content).display : null,
            paraCount: paras.length,
            sampleParaHeights: paraHeights
          };
        });

        return {
          sheetCount: sheets.length,
          sheetDetails
        };
      })()`,
      returnByValue: true
    });

    console.log('\n--- PRINT ENGINE & WHITESPACE PARITY CHECK ---');
    console.log(JSON.stringify(printTest.result.value, null, 2));

    ws.close();
    process.exit(0);
  };
}

run().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
