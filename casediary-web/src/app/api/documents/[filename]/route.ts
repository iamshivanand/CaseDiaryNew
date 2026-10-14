import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

interface Params {
  params: Promise<{ filename: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { filename } = await params;
    // Prevent path traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), "uploads", safeFilename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(safeFilename).toLowerCase();

    let contentType = "application/octet-stream";
    if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".txt") contentType = "text/plain";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${safeFilename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
