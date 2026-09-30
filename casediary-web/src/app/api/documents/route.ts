import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get("case_id");

    if (!caseId) {
      return NextResponse.json(
        { success: false, error: "case_id query parameter is required" },
        { status: 400 }
      );
    }

    const docs = db
      .select()
      .from(schema.CaseDocuments)
      .where(eq(schema.CaseDocuments.case_id, Number(caseId)))
      .orderBy(desc(schema.CaseDocuments.created_at))
      .all();

    return NextResponse.json({ success: true, documents: docs });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData: any = await request.formData();
    const caseId = formData.get("case_id");
    const category = formData.get("category")?.toString() || "general";
    const file = formData.get("file") as File | null;

    if (!caseId || !file) {
      return NextResponse.json(
        { success: false, error: "case_id and file are required" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(file.name);
    const storedFilename = `doc_${caseId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    const filePath = path.join(uploadDir, storedFilename);

    fs.writeFileSync(filePath, buffer);

    const newDoc = db
      .insert(schema.CaseDocuments)
      .values({
        case_id: Number(caseId),
        stored_filename: storedFilename,
        original_display_name: file.name,
        file_type: file.type || ext.replace(".", ""),
        file_size: file.size,
        category,
      })
      .returning()
      .get();

    return NextResponse.json({
      success: true,
      document: newDoc,
      message: "Document uploaded successfully",
    });
  } catch (error: any) {
    console.error("Document upload error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
