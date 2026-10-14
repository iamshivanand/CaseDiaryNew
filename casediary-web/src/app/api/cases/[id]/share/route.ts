import { NextRequest, NextResponse } from "next/server";
import { pgDb } from "@/db/pgClient";
import * as schema from "@/db/pgSchema";
import { eq, and } from "drizzle-orm";
import { verifyAuthToken, isSeniorAdvocate } from "@/lib/auth";
import { generateQRCodeDataUrl } from "@/lib/qrcode";
import crypto from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const caseId = parseInt(id, 10);
    if (isNaN(caseId)) {
      return NextResponse.json({ success: false, error: "Invalid case ID" }, { status: 400 });
    }

    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("advocase_token")?.value;
    const token = authHeader?.replace("Bearer ", "") || cookieToken;

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthenticated" }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload || !payload.chamberId) {
      return NextResponse.json({ success: false, error: "Valid chamber session required" }, { status: 401 });
    }

    // Verify case exists in user's chamber
    const foundCases = await pgDb
      .select()
      .from(schema.cases)
      .where(and(eq(schema.cases.id, caseId), eq(schema.cases.chamber_id, payload.chamberId)))
      .limit(1);

    if (foundCases.length === 0) {
      return NextResponse.json({ success: false, error: "Matter not found in your chamber" }, { status: 404 });
    }

    const c = foundCases[0];
    const body = await req.json().catch(() => ({}));
    const {
      access_level = "view_brief", // "view_brief" | "co_counsel"
      shared_with_counsel_name,
      shared_with_email,
      expiresInDays = 30,
    } = body;

    const shareToken = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(expiresInDays || 30));

    const [newShare] = await pgDb
      .insert(schema.case_shares)
      .values({
        case_id: c.id,
        case_unique_id: c.uniqueId,
        chamber_id: payload.chamberId,
        shared_by_user_id: payload.userId,
        share_token: shareToken,
        access_level: access_level === "co_counsel" ? "co_counsel" : "view_brief",
        shared_with_counsel_name: shared_with_counsel_name?.trim() || null,
        shared_with_email: shared_with_email?.trim() || null,
        expires_at: expiresAt,
        is_active: true,
      })
      .returning();

    const origin =
      req.nextUrl.origin ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const shareUrl = `${origin}/cases/shared/${shareToken}`;
    const qrCodeDataUrl = await generateQRCodeDataUrl(shareUrl, { width: 340 });

    return NextResponse.json({
      success: true,
      message: "Matter brief shared successfully with external counsel.",
      share: {
        id: newShare.id,
        shareToken,
        shareUrl,
        qrCodeDataUrl,
        accessLevel: newShare.access_level,
        expiresAt: newShare.expires_at,
        counselName: newShare.shared_with_counsel_name,
        caseTitle: c.CaseTitle,
      },
    });
  } catch (error: any) {
    console.error("Case Share Creation Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate matter share" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const caseId = parseInt(id, 10);
    if (isNaN(caseId)) {
      return NextResponse.json({ success: false, error: "Invalid case ID" }, { status: 400 });
    }

    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("advocase_token")?.value;
    const token = authHeader?.replace("Bearer ", "") || cookieToken;

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthenticated" }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload || !payload.chamberId) {
      return NextResponse.json({ success: false, error: "Valid chamber session required" }, { status: 401 });
    }

    const origin =
      req.nextUrl.origin ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const shares = await pgDb
      .select({
        id: schema.case_shares.id,
        shareToken: schema.case_shares.share_token,
        accessLevel: schema.case_shares.access_level,
        counselName: schema.case_shares.shared_with_counsel_name,
        email: schema.case_shares.shared_with_email,
        isActive: schema.case_shares.is_active,
        expiresAt: schema.case_shares.expires_at,
        createdAt: schema.case_shares.created_at,
        sharedByName: schema.users.name,
      })
      .from(schema.case_shares)
      .innerJoin(schema.users, eq(schema.case_shares.shared_by_user_id, schema.users.id))
      .where(
        and(
          eq(schema.case_shares.case_id, caseId),
          eq(schema.case_shares.chamber_id, payload.chamberId),
          eq(schema.case_shares.is_active, true)
        )
      );

    const formattedShares = await Promise.all(
      shares.map(async (s) => {
        const shareUrl = `${origin}/cases/shared/${s.shareToken}`;
        const qrCodeDataUrl = await generateQRCodeDataUrl(shareUrl, { width: 200 });
        return {
          ...s,
          shareUrl,
          qrCodeDataUrl,
        };
      })
    );

    return NextResponse.json({ success: true, shares: formattedShares });
  } catch (error: any) {
    console.error("Fetch Case Shares Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch matter shares" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const caseId = parseInt(id, 10);
    const { searchParams } = new URL(req.url);
    const shareId = searchParams.get("shareId");

    if (!shareId) {
      return NextResponse.json({ success: false, error: "shareId query param required" }, { status: 400 });
    }

    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("advocase_token")?.value;
    const token = authHeader?.replace("Bearer ", "") || cookieToken;

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthenticated" }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload || !payload.chamberId) {
      return NextResponse.json({ success: false, error: "Valid chamber session required" }, { status: 401 });
    }

    await pgDb
      .update(schema.case_shares)
      .set({ is_active: false })
      .where(
        and(
          eq(schema.case_shares.id, shareId),
          eq(schema.case_shares.case_id, caseId),
          eq(schema.case_shares.chamber_id, payload.chamberId)
        )
      );

    return NextResponse.json({ success: true, message: "Share link revoked successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to revoke share link" },
      { status: 500 }
    );
  }
}
