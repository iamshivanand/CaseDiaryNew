import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pgDb } from "@/db/pgClient";
import * as pgSchema from "@/db/pgSchema";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Strict whitelist of permitted file types for legal proceedings
const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".jpg",
  ".jpeg",
  ".png",
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in to access case documents." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get("case_id");

    if (!caseId) {
      return NextResponse.json(
        { success: false, error: "case_id query parameter is required" },
        { status: 400 }
      );
    }

    // 1. CLOUD POSTGRESQL (Authenticated Chamber)
    if (authUser.chamberId && authUser.chamberId !== "demo-chamber-id") {
      // Verify case belongs to caller's chamber
      const [ownedCase] = await pgDb
        .select()
        .from(pgSchema.cases)
        .where(
          and(
            eq(pgSchema.cases.id, Number(caseId)),
            eq(pgSchema.cases.chamber_id, authUser.chamberId)
          )
        )
        .limit(1);

      if (!ownedCase) {
        return NextResponse.json(
          { success: false, error: "Case not found or access restricted" },
          { status: 404 }
        );
      }

      const docs = await pgDb
        .select()
        .from(pgSchema.case_documents)
        .where(
          and(
            eq(pgSchema.case_documents.case_unique_id, ownedCase.uniqueId),
            eq(pgSchema.case_documents.is_deleted, false)
          )
        )
        .orderBy(desc(pgSchema.case_documents.created_at));

      return NextResponse.json({ success: true, documents: docs });
    }

    // 2. ISOLATED DEMO SANDBOX
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
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in to upload case documents." },
        { status: 401 }
      );
    }

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

    // 1. Enforce strict file size limits
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: "File size exceeds the 25MB security limit.",
        },
        { status: 400 }
      );
    }

    // 2. Enforce strict extension whitelisting
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        {
          success: false,
          error: `File type '${ext}' is not permitted. Only PDF, DOC, DOCX, TXT, JPG, and PNG files are accepted.`,
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Cryptographically random unique filename to prevent overwrites / predictable names
    const crypto = await import("crypto");
    const randHex = crypto.randomBytes(8).toString("hex");
    const storedFilename = `doc_${caseId}_${Date.now()}_${randHex}${ext}`;
    const filePath = path.join(uploadDir, storedFilename);

    fs.writeFileSync(filePath, buffer);

    // 3. Persist metadata
    if (authUser.chamberId && authUser.chamberId !== "demo-chamber-id") {
      const [ownedCase] = await pgDb
        .select()
        .from(pgSchema.cases)
        .where(
          and(
            eq(pgSchema.cases.id, Number(caseId)),
            eq(pgSchema.cases.chamber_id, authUser.chamberId)
          )
        )
        .limit(1);

      if (!ownedCase) {
        // Clean up uploaded file if case unauthorized
        try { fs.unlinkSync(filePath); } catch {}
        return NextResponse.json(
          { success: false, error: "Case not found or permission denied" },
          { status: 403 }
        );
      }

      const [newDoc] = await pgDb
        .insert(pgSchema.case_documents)
        .values({
          uniqueId: `doc-${Date.now().toString(36)}-${randHex}`,
          case_unique_id: ownedCase.uniqueId,
          stored_filename: storedFilename,
          original_display_name: path.basename(file.name),
          file_type: file.type || ext.replace(".", ""),
          file_size: file.size,
          file_url: `/api/documents/${storedFilename}`,
          category,
          user_id: authUser.userId,
          is_deleted: false,
        })
        .returning();

      return NextResponse.json({
        success: true,
        document: newDoc,
        message: "Document uploaded successfully to chamber vault",
      });
    }

    // Demo sandbox
    const newDoc = db
      .insert(schema.CaseDocuments)
      .values({
        case_id: Number(caseId),
        stored_filename: storedFilename,
        original_display_name: path.basename(file.name),
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
