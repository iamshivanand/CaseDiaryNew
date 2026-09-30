async function run() {
  const res = await fetch('http://127.0.0.1:9222/json');
  const tabs = await res.json();
  const draftTab = tabs.find(t => t.url && t.url.includes('/drafts'));
  const ws = new WebSocket(draftTab.webSocketDebuggerUrl);

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
    const testResult = await sendCmd('Runtime.evaluate', {
      expression: `(() => {
        const proseMirror = document.querySelector('.ProseMirror');
        if (!proseMirror) return { error: 'ProseMirror not found' };

        const results = {};
        const paras = Array.from(proseMirror.querySelectorAll('p'));

        function selectNode(node) {
          const sel = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(node);
          sel.removeAllRanges();
          sel.addRange(range);
        }

        // Test Italic on Para 1
        if (paras[1]) {
          selectNode(paras[1]);
          document.getElementById('toolbar-italic-btn')?.click();
          results.italicApplied = paras[1].innerHTML.includes('<em>') || !!paras[1].querySelector('em');
        }

        // Test Underline on Para 2
        if (paras[2]) {
          selectNode(paras[2]);
          document.getElementById('toolbar-underline-btn')?.click();
          results.underlineApplied = paras[2].innerHTML.includes('<u>') || !!paras[2].querySelector('u');
        }

        // Test Strikethrough on Para 3
        if (paras[3]) {
          selectNode(paras[3]);
          document.getElementById('toolbar-strike-btn')?.click();
          results.strikeApplied = paras[3].innerHTML.includes('<s>') || !!paras[3].querySelector('s');
        }

        // Test Align Justify on Para 1
        if (paras[1]) {
          selectNode(paras[1]);
          document.getElementById('toolbar-align-justify-btn')?.click();
          results.justifyApplied = paras[1].style.textAlign === 'justify' || paras[1].getAttribute('style')?.includes('text-align: justify');
        }

        // Test Align Right on Para 2
        if (paras[2]) {
          selectNode(paras[2]);
          document.getElementById('toolbar-align-right-btn')?.click();
          results.alignRightApplied = paras[2].style.textAlign === 'right' || paras[2].getAttribute('style')?.includes('text-align: right');
        }

        // Test Align Center on Para 3
        if (paras[3]) {
          selectNode(paras[3]);
          document.getElementById('toolbar-align-center-btn')?.click();
          results.alignCenterApplied = paras[3].style.textAlign === 'center' || paras[3].getAttribute('style')?.includes('text-align: center');
        }

        // Test Font Size (16pt) on Para 4
        if (paras[4]) {
          selectNode(paras[4]);
          const fsSelect = document.getElementById('toolbar-font-size-select');
          if (fsSelect) {
            fsSelect.value = '16pt';
            fsSelect.dispatchEvent(new Event('change', { bubbles: true }));
            results.fontSizeApplied = paras[4].innerHTML.includes('font-size: 16pt') || paras[4].outerHTML.includes('16pt');
          }
        }

        // Test Table Insertion
        const initialTableCount = proseMirror.querySelectorAll('table').length;
        document.getElementById('toolbar-insert-table-btn')?.click();
        const newTableCount = proseMirror.querySelectorAll('table').length;
        results.tableInserted = newTableCount > initialTableCount;

        return results;
      })()`,
      returnByValue: true
    });

    console.log('--- INDIVIDUAL BUTTON EXECUTION RESULTS ---');
    console.log(JSON.stringify(testResult.result.value, null, 2));

    ws.close();
    process.exit(0);
  };
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
