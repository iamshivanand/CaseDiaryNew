export interface PrintMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface PrintHeaderFooterConfig {
  showHeader: boolean;
  showFooter: boolean;
  differentFirstPage: boolean;
  customCourtName?: string;
  customCaseNumber?: string;
  customAdvocateName?: string;
  pageNumberStyle?: "full" | "simple" | "numOnly" | "roman" | "none";
}

export interface PrintEngineParams {
  contentContainer: HTMLElement | null;
  pageSize: "a4" | "legal" | "letter";
  margins: PrintMargins;
  headerFooterConfig: PrintHeaderFooterConfig;
  activeCase?: {
    court_name?: string;
    case_number?: string;
    AdvocateName?: string;
  } | null;
  draftTitle?: string;
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  letterheadSpace: boolean;
  watermark: "NONE" | "DRAFT" | "CONFIDENTIAL" | "OFFICE COPY";
  totalPages: number;
  assignments: number[];
}

export function executeCourtPrint({
  contentContainer,
  pageSize,
  margins,
  headerFooterConfig,
  activeCase,
  draftTitle,
  fontFamily,
  fontSize,
  lineHeight,
  letterheadSpace,
  watermark,
  totalPages,
  assignments,
}: PrintEngineParams): void {
  if (!contentContainer) {
    window.print();
    return;
  }

  const proseMirrorEl = contentContainer.querySelector(".ProseMirror") as HTMLElement | null;
  if (!proseMirrorEl) {
    window.print();
    return;
  }

  const blocks = Array.from(proseMirrorEl.children) as HTMLElement[];
  const rawTotalSheets = Math.max(1, totalPages);

  // Group blocks by assigned sheet, filtering out manual page-break indicators
  const rawSheetBlocks: HTMLElement[][] = Array.from({ length: rawTotalSheets }, () => []);
  blocks.forEach((block, idx) => {
    if (block.getAttribute("data-page-break") === "true" || block.classList.contains("court-page-break")) {
      return;
    }
    const sheetNum = assignments[idx] || 1;
    const sIdx = Math.min(Math.max(1, sheetNum), rawTotalSheets) - 1;
    rawSheetBlocks[sIdx].push(block);
  });

  // Filter out phantom/empty sheets so alternate blank pages never occur
  const populatedSheets = rawSheetBlocks.filter((bList, idx) => bList.length > 0 || idx === 0);
  const calculatedTotalSheets = Math.max(1, populatedSheets.length);

  const isLegal = pageSize === "legal";
  const isLetter = pageSize === "letter";
  const paperSizeCss = isLegal ? "8.5in 14in" : isLetter ? "8.5in 11in" : "210mm 297mm";
  const paperWidthCss = isLegal ? "8.5in" : isLetter ? "8.5in" : "210mm";
  const paperHeightCss = isLegal ? "14in" : isLetter ? "11in" : "297mm";

  const displayCourt =
    headerFooterConfig.customCourtName?.trim() || activeCase?.court_name || "IN THE HON'BLE COURT OF SESSIONS";
  const displayCase =
    headerFooterConfig.customCaseNumber?.trim() || activeCase?.case_number || "CRIMINAL PETITION";
  const displayAdvocate =
    headerFooterConfig.customAdvocateName?.trim() || activeCase?.AdvocateName || "Adv. Rajesh Sharma";

  let sheetsHtml = "";
  for (let s = 1; s <= calculatedTotalSheets; s++) {
    const hasHeader =
      headerFooterConfig.showHeader && (!headerFooterConfig.differentFirstPage || s !== 1);
    const hasFooter = headerFooterConfig.showFooter;

    let pageNumberText = "";
    if (headerFooterConfig.pageNumberStyle === "full") {
      pageNumberText = `Page ${s} of ${calculatedTotalSheets} (${pageSize.toUpperCase()})`;
    } else if (headerFooterConfig.pageNumberStyle === "simple") {
      pageNumberText = `Page ${s} of ${calculatedTotalSheets}`;
    } else if (headerFooterConfig.pageNumberStyle === "numOnly") {
      pageNumberText = `${s}`;
    } else if (headerFooterConfig.pageNumberStyle === "roman") {
      pageNumberText = `— ${s} —`;
    }

    const currentBlocks = populatedSheets[s - 1] || [];
    const contentBlocksHtml = currentBlocks
      .map((b) => {
        const clone = b.cloneNode(true) as HTMLElement;

        // Transfer live computed styles (line-height, font-size, font-family, text-align, font-weight) from original element
        try {
          const comp = window.getComputedStyle(b);
          if (comp.lineHeight && comp.lineHeight !== "normal") {
            clone.style.lineHeight = comp.lineHeight;
          }
          if (comp.textAlign) {
            clone.style.textAlign = comp.textAlign;
          }
          if (comp.letterSpacing && comp.letterSpacing !== "normal") {
            clone.style.letterSpacing = comp.letterSpacing;
          }
          if (comp.fontSize) {
            clone.style.fontSize = comp.fontSize;
          }
          if (comp.fontWeight) {
            clone.style.fontWeight = comp.fontWeight;
          }
        } catch {
          // fallback to inline styles if computed style fails
        }

        // Preserve empty lines and intentional blank paragraphs created by Enter key
        if (clone.tagName === "P" && (!clone.textContent || clone.textContent.trim() === "")) {
          clone.innerHTML = "&nbsp;";
          clone.style.minHeight = "1.2em";
        } else {
          // Clean up any trailing break anchors inside paragraphs with text
          const trailingBreaks = clone.querySelectorAll("br.ProseMirror-trailingBreak");
          trailingBreaks.forEach((br) => br.remove());

          // Walk all text nodes and preserve consecutive whitespace without collapsing
          const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
          let node: Text | null = walker.nextNode() as Text | null;
          while (node) {
            if (node.nodeValue && node.nodeValue.includes("  ")) {
              node.nodeValue = node.nodeValue.replace(/ {2}/g, " \u00A0");
            }
            node = walker.nextNode() as Text | null;
          }
        }

        return clone.outerHTML;
      })
      .join("");

    const headerHeightMm = hasHeader ? 10 : 0;
    const footerHeightMm = hasFooter ? 10 : 0;
    const letterheadSpaceMm = s === 1 && letterheadSpace ? 65 : 0;

    sheetsHtml += `
      <div class="court-print-sheet">
        ${
          hasHeader
            ? `
          <div class="court-print-header">
            <div class="header-left">
              <span class="dot"></span>
              <span>${displayCourt}</span>
            </div>
            <div class="header-right">${displayCase}</div>
          </div>
        `
            : ""
        }

        ${
          watermark !== "NONE"
            ? `
          <div class="watermark-overlay">
            <span>${watermark}</span>
          </div>
        `
            : ""
        }

        ${
          s === 1 && letterheadSpace
            ? `
          <div class="letterhead-space">
            [ 2.5" Reserved For Chamber Letterhead & Seal ]
          </div>
        `
            : ""
        }

        <div class="court-print-content" style="padding-top: ${
          headerHeightMm + letterheadSpaceMm + margins.top
        }mm; padding-bottom: ${footerHeightMm + margins.bottom}mm; padding-left: ${
          margins.left
        }mm; padding-right: ${margins.right}mm;">${contentBlocksHtml}</div>

        ${
          hasFooter
            ? `
          <div class="court-print-footer">
            <div class="footer-left">Counsel for Applicant &bull; <strong>${displayAdvocate}</strong></div>
            <div class="footer-right">${pageNumberText}</div>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  const printDocHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${draftTitle || "Court Petition"}</title>
      <style>
        @page {
          size: ${paperSizeCss};
          margin: 0 !important;
        }
        * {
          box-sizing: border-box !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          color: #000 !important;
          font-family: "${fontFamily}", "Times New Roman", Times, serif;
          font-size: ${fontSize || "14pt"};
          line-height: ${lineHeight || "1.8"};
          width: ${paperWidthCss} !important;
        }
        .court-print-sheet {
          width: ${paperWidthCss} !important;
          max-width: ${paperWidthCss} !important;
          height: ${paperHeightCss} !important;
          max-height: ${paperHeightCss} !important;
          min-height: ${paperHeightCss} !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          position: relative !important;
          overflow: hidden !important;
          display: block !important;
          background: white !important;
          box-sizing: border-box !important;
        }
        .court-print-sheet:not(:last-child) {
          page-break-after: always !important;
          break-after: page !important;
        }
        .court-print-sheet:last-child {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        .court-print-header {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 10mm;
          padding-left: ${margins.left}mm;
          padding-right: ${margins.right}mm;
          border-bottom: 1px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: monospace;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
          color: #475569;
          background: white !important;
          box-sizing: border-box;
          z-index: 20;
        }
        .court-print-header .dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #f59e0b;
          margin-right: 6px;
        }
        .court-print-footer {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 10mm;
          padding-left: ${margins.left}mm;
          padding-right: ${margins.right}mm;
          border-top: 1px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: monospace;
          font-size: 11px;
          color: #475569;
          background: white !important;
          box-sizing: border-box;
          z-index: 20;
        }
        .court-print-content {
          display: block;
          box-sizing: border-box;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 5;
          word-break: break-word !important;
          tab-size: 4 !important;
          white-space: normal !important;
        }
        .court-print-content p,
        .court-print-content div,
        .court-print-content h1,
        .court-print-content h2,
        .court-print-content h3,
        .court-print-content span,
        .court-print-content blockquote {
          white-space: pre-wrap !important;
          word-break: break-word !important;
        }
        .court-print-content > *:first-child {
          margin-top: 0 !important;
        }
        .court-page-break,
        [data-page-break="true"],
        .no-print {
          display: none !important;
        }
        .watermark-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 1;
          overflow: hidden;
        }
        .watermark-overlay span {
          font-size: 80px;
          font-weight: 900;
          color: rgba(203, 213, 225, 0.28);
          transform: rotate(-35deg);
          letter-spacing: 0.15em;
          text-transform: uppercase;
          user-select: none;
        }
        .letterhead-space {
          position: absolute;
          top: 10mm;
          left: ${margins.left}mm;
          right: ${margins.right}mm;
          height: 65mm;
          border-bottom: 1px dashed #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          font-family: monospace;
          font-size: 11px;
          z-index: 8;
        }

        /* TipTap Typography & Table Support - Matched 100% to globals.css */
        h1 {
          font-size: 1.4em;
          font-weight: 700;
          text-align: center;
          text-transform: uppercase;
          margin-top: 1em;
          margin-bottom: 0.6em;
          white-space: pre-wrap !important;
        }
        h2 {
          font-size: 1.2em;
          font-weight: 700;
          text-align: center;
          margin-top: 0.8em;
          margin-bottom: 0.5em;
          white-space: pre-wrap !important;
        }
        h3 {
          font-size: 1.05em;
          font-weight: 600;
          margin-top: 0.6em;
          margin-bottom: 0.4em;
          white-space: pre-wrap !important;
        }
        p {
          margin-top: 0;
          margin-bottom: 0.85em;
          line-height: inherit;
          min-height: 1.2em;
          white-space: pre-wrap !important;
        }
        p:last-child {
          margin-bottom: 0;
        }
        p:empty {
          min-height: 1.2em !important;
          display: block !important;
        }
        p:empty::before {
          content: "\\00a0";
          display: inline-block;
        }
        br.ProseMirror-trailingBreak {
          display: none !important;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          margin: 1.25em 0;
        }
        table td, table th {
          border: 1px solid #94a3b8;
          padding: 6px 8px;
          vertical-align: top;
        }
        table th {
          background-color: #f1f5f9;
          font-weight: bold;
        }
        blockquote {
          border-left: 3px solid #cbd5e1;
          padding-left: 1rem;
          margin: 1em 1.5rem;
          font-style: italic;
          color: #475569;
        }
      </style>
    </head>
    <body>
      ${sheetsHtml}
    </body>
    </html>
  `;

  const oldIframe = document.getElementById("court-print-iframe");
  if (oldIframe) oldIframe.remove();

  const iframe = document.createElement("iframe");
  iframe.id = "court-print-iframe";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(printDocHtml);
    doc.close();

    setTimeout(() => {
      // Dynamic Pre-Print Layout Balancer:
      // Inspect rendered content inside iframe to ensure zero overflow into footer zones across all sheets
      try {
        let sheets = Array.from(doc.querySelectorAll(".court-print-sheet")) as HTMLElement[];
        let totalSheets = sheets.length;

        for (let sIdx = 0; sIdx < sheets.length; sIdx++) {
          const sheet = sheets[sIdx];
          const content = sheet.querySelector(".court-print-content") as HTMLElement | null;
          if (!content) continue;

          // Remove any accidental stray whitespace text nodes between block elements
          Array.from(content.childNodes).forEach((n) => {
            if (n.nodeType === Node.TEXT_NODE && (n.nodeValue || "").trim() === "") {
              n.remove();
            }
          });

          const footer = sheet.querySelector(".court-print-footer") as HTMLElement | null;
          const sRect = sheet.getBoundingClientRect();
          const footerTop = footer ? footer.getBoundingClientRect().top : sRect.bottom - 38;
          const safeLimit = footerTop - 4;

          while (content.children.length > 1) {
            const lastChild = content.lastElementChild as HTMLElement | null;
            if (!lastChild) break;
            const lRect = lastChild.getBoundingClientRect();

            if (lRect.bottom > safeLimit) {
              let nextSheet = sheets[sIdx + 1];
              if (!nextSheet) {
                nextSheet = sheet.cloneNode(true) as HTMLElement;
                const nextContent = nextSheet.querySelector(".court-print-content");
                if (nextContent) nextContent.innerHTML = "";
                sheet.parentElement?.appendChild(nextSheet);
                sheets.push(nextSheet);
                totalSheets++;
              }

              const nextContent = nextSheet.querySelector(".court-print-content");
              if (nextContent) {
                nextContent.insertBefore(lastChild, nextContent.firstElementChild);
              }
            } else {
              break;
            }
          }
        }

        // Keep page numbering strictly synchronized
        sheets.forEach((sh, idx) => {
          const fRight = sh.querySelector(".court-print-footer .footer-right");
          if (fRight) {
            const sNum = idx + 1;
            if (headerFooterConfig.pageNumberStyle === "full") {
              fRight.textContent = `Page ${sNum} of ${totalSheets} (${pageSize.toUpperCase()})`;
            } else if (headerFooterConfig.pageNumberStyle === "simple") {
              fRight.textContent = `Page ${sNum} of ${totalSheets}`;
            } else if (headerFooterConfig.pageNumberStyle === "numOnly") {
              fRight.textContent = `${sNum}`;
            } else if (headerFooterConfig.pageNumberStyle === "roman") {
              fRight.textContent = `— ${sNum} —`;
            }
          }
        });
      } catch (err) {
        console.warn("Pre-print layout verification notice:", err);
      }

      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        iframe.remove();
      }, 5000);
    }, 400);
  }
}
