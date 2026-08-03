// utils/e2e/generate-editor-html.ts
// Standalone script: writes the live editor HTML to a .html file for Playwright to load.
import * as fs from "fs";
import * as path from "path";

import { getOfflineEditorHtml } from "../offlineEditorTemplate";

const outDir = path.join(__dirname, "fixtures");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// -- Blank editor (empty document)
fs.writeFileSync(
  path.join(outDir, "editor-blank.html"),
  getOfflineEditorHtml("")
);

// -- Preloaded: 1 manual page break
fs.writeFileSync(
  path.join(outDir, "editor-one-break.html"),
  getOfflineEditorHtml(
    `<p>Page one content. This is a court document for testing.</p>` +
      `<div class="legal-page-break" style="break-before: page; page-break-before: always;"></div>` +
      `<p>Page two content. Lorem ipsum dolor sit amet.</p>`
  )
);

// -- Preloaded: legal placeholder
fs.writeFileSync(
  path.join(outDir, "editor-placeholder.html"),
  getOfflineEditorHtml(
    `<p>In the matter of <span class="legal-placeholder" data-original="[PARTY NAME]">[PARTY NAME]</span> vs State.</p>`
  )
);

// -- Preloaded: table
fs.writeFileSync(
  path.join(outDir, "editor-table.html"),
  getOfflineEditorHtml(
    `<p>Evidence list:</p>` +
      `<table class="editor-table"><thead><tr><th>Sr</th><th>Document</th><th>Date</th></tr></thead>` +
      `<tbody><tr><td>1</td><td>FIR Copy</td><td>01/01/2026</td></tr></tbody></table>` +
      `<p><br></p>`
  )
);

// -- Preloaded: long text to trigger auto-pagination
const longParagraph = `<p>${"This is a very long legal document paragraph that should overflow the first page boundary automatically. ".repeat(60)}</p>`;
fs.writeFileSync(
  path.join(outDir, "editor-long-text.html"),
  getOfflineEditorHtml(longParagraph)
);

console.log("✅  Editor HTML fixtures written to utils/e2e/fixtures/");
