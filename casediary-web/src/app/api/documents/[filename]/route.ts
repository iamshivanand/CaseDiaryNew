import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pgDb } from "@/db/pgClient";
import * as pgSchema from "@/db/pgSchema";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";
import path from "path";
import fs from "fs";

interface Params {
  params: Promise<{ filename: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { filename } = await params;
    // Strict defense against path traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), "uploads", safeFilename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // 1. Authentication & Authorization check
    const authUser = getAuthUser(request);
    const { searchParams } = new URL(request.url);
    const shareToken = searchParams.get("share_token");

    let isAuthorized = false;

    if (authUser) {
      if (authUser.chamberId && authUser.chamberId !== "demo-chamber-id") {
        // Cloud PostgreSQL: Verify file belongs to caller's chamber
        const [doc] = await pgDb
          .select({
            id: pgSchema.case_documents.id,
            chamberId: pgSchema.cases.chamber_id,
          })
          .from(pgSchema.case_documents)
          .innerJoin(
            pgSchema.cases,
            eq(pgSchema.case_documents.case_unique_id, pgSchema.cases.uniqueId)
          )
          .where(
            and(
              eq(pgSchema.case_documents.stored_filename, safeFilename),
              eq(pgSchema.cases.chamber_id, authUser.chamberId),
              eq(pgSchema.case_documents.is_deleted, false)
            )
          )
          .limit(1);

        if (doc) isAuthorized = true;
      } else {
        // Demo sandbox
        const doc = db
          .select()
          .from(schema.CaseDocuments)
          .where(eq(schema.CaseDocuments.stored_filename, safeFilename))
          .get();
        if (doc) isAuthorized = true;
      }
    } else if (shareToken) {
      // External counsel access via valid Case Share token
      const [share] = await pgDb
        .select({
          caseUniqueId: pgSchema.case_shares.case_unique_id,
          isActive: pgSchema.case_shares.is_active,
          expiresAt: pgSchema.case_shares.expires_at,
        })
        .from(pgSchema.case_shares)
        .where(eq(pgSchema.case_shares.share_token, shareToken))
        .limit(1);

      if (
        share &&
        share.isActive &&
        (!share.expiresAt || new Date(share.expiresAt) > new Date())
      ) {
        // Verify document belongs to this specific shared matter
        const [doc] = await pgDb
          .select()
          .from(pgSchema.case_documents)
          .where(
            and(
              eq(pgSchema.case_documents.stored_filename, safeFilename),
              eq(pgSchema.case_documents.case_unique_id, share.caseUniqueId),
              eq(pgSchema.case_documents.is_deleted, false)
            )
          )
          .limit(1);

        if (doc) isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Access Denied: You do not have permission to access this legal record." },
        { status: 403 }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(safeFilename).toLowerCase();

    let contentType = "application/octet-stream";
    if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".txt") contentType = "text/plain";
    else if (ext === ".docx")
      contentType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    else if (ext === ".doc") contentType = "application/msword";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${safeFilename}"`,
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
