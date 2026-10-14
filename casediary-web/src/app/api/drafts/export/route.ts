import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, html_content, format = "doc" } = body;

    const documentTitle = title || "Legal_Draft";

    // Format as Microsoft Word compatible HTML document envelope
    const wordDocumentHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${documentTitle}</title>
        <!--[if gte mso 9]>
        <xml>
        <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
        <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page Section1 {
            size: 595.3pt 841.9pt; /* A4 */
            margin: 72pt 72pt 72pt 126pt; /* 1.75 inch left gutter */
            mso-header-margin: 36pt;
            mso-footer-margin: 36pt;
            mso-paper-source: 0;
          }
          div.Section1 { page: Section1; }
          body {
            font-family: 'Times New Roman', Georgia, serif;
            font-size: 14pt;
            line-height: 1.8;
            color: #000000;
            white-space: pre-wrap !important;
            word-break: break-word !important;
            tab-size: 4 !important;
          }
          p {
            margin-bottom: 0.85em;
            white-space: pre-wrap !important;
            min-height: 1.4em;
          }
          h1 {
            font-size: 16pt;
            font-weight: bold;
            text-align: center;
            text-transform: uppercase;
            text-decoration: underline;
            white-space: pre-wrap !important;
          }
          h2 {
            font-size: 14pt;
            font-weight: bold;
            text-align: center;
            text-decoration: underline;
            white-space: pre-wrap !important;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          table, th, td {
            border: 1px solid #333333;
            padding: 6px;
          }
          th {
            background-color: #f2f2f2;
          }
        </style>
      </head>
      <body>
        <div class="Section1">
          ${(html_content || "")
            .replace(/<p><\/p>/gi, "<p>&nbsp;</p>")
            .replace(/<p><br\s*\/?>\s*<\/p>/gi, "<p>&nbsp;</p>")
            .replace(/  /g, " &nbsp;")}
        </div>
      </body>
      </html>
    `.trim();

    return new NextResponse(wordDocumentHtml, {
      status: 200,
      headers: {
        "Content-Type": "application/msword; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          documentTitle.replace(/[^a-zA-Z0-9_-]/g, "_")
        )}.doc"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
