import { NextRequest, NextResponse } from "next/server";
import { pgDb } from "@/db/pgClient";
import * as schema from "@/db/pgSchema";
import { eq, and, sql } from "drizzle-orm";
import { verifyAuthToken, isSeniorAdvocate } from "@/lib/auth";
import { generateQRCodeDataUrl } from "@/lib/qrcode";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("advocase_token")?.value;
    const token = authHeader?.replace("Bearer ", "") || cookieToken;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication required to generate chamber invitations." },
        { status: 401 }
      );
    }

    const payload = verifyAuthToken(token);
    if (!payload || !isSeniorAdvocate(payload)) {
      return NextResponse.json(
        {
          success: false,
          error: "Permission denied. Only Senior Advocates & Managing Partners can issue chamber invitations.",
        },
        { status: 403 }
      );
    }

    if (!payload.chamberId) {
      return NextResponse.json(
        { success: false, error: "Active chamber identifier not found in advocate session." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      role = "Associate Advocate",
      target_email,
      target_phone,
      max_uses = 1,
      expiresInDays = 7,
    } = body;

    // Check chamber capacity
    const chamberResult = await pgDb
      .select()
      .from(schema.chambers)
      .where(eq(schema.chambers.id, payload.chamberId))
      .limit(1);

    if (chamberResult.length === 0) {
      return NextResponse.json({ success: false, error: "Chamber not found." }, { status: 404 });
    }

    const chamber = chamberResult[0];

    // Current member count
    const memberCountRes = await pgDb
      .select({ count: sql<number>`count(*)` })
      .from(schema.chamber_members)
      .where(
        and(
          eq(schema.chamber_members.chamber_id, payload.chamberId),
          eq(schema.chamber_members.status, "Active")
        )
      );

    const currentMembers = Number(memberCountRes[0]?.count || 0);
    if (currentMembers >= chamber.max_seats) {
      return NextResponse.json(
        {
          success: false,
          error: `Chamber seat capacity reached (${currentMembers}/${chamber.max_seats} seats used on ${chamber.plan_tier} plan). Please upgrade plan tier to add more associates.`,
        },
        { status: 400 }
      );
    }

    // Generate unique token
    const inviteToken = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(expiresInDays || 7));

    const [newInvite] = await pgDb
      .insert(schema.chamber_invitations)
      .values({
        chamber_id: payload.chamberId,
        created_by_user_id: payload.userId,
        role: role.trim() || "Associate Advocate",
        invite_token: inviteToken,
        target_email: target_email?.trim() || null,
        target_phone: target_phone?.trim() || null,
        max_uses: Number(max_uses) || 1,
        used_count: 0,
        expires_at: expiresAt,
        status: "active",
      })
      .returning();

    // Determine base URL
    const origin =
      req.nextUrl.origin ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const joinUrl = `${origin}/auth/join?token=${inviteToken}`;
    const qrCodeDataUrl = await generateQRCodeDataUrl(joinUrl, { width: 340 });

    return NextResponse.json({
      success: true,
      message: "Chamber invitation created successfully.",
      invitation: {
        id: newInvite.id,
        invite_token: inviteToken,
        role: newInvite.role,
        chamberName: chamber.name,
        expires_at: newInvite.expires_at,
        joinUrl,
        qrCodeDataUrl,
        max_uses: newInvite.max_uses,
      },
    });
  } catch (error: any) {
    console.error("Invite Creation Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate chamber invitation" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Invitation token parameter is required." },
        { status: 400 }
      );
    }

    const invites = await pgDb
      .select({
        id: schema.chamber_invitations.id,
        inviteToken: schema.chamber_invitations.invite_token,
        role: schema.chamber_invitations.role,
        status: schema.chamber_invitations.status,
        expiresAt: schema.chamber_invitations.expires_at,
        usedCount: schema.chamber_invitations.used_count,
        maxUses: schema.chamber_invitations.max_uses,
        targetEmail: schema.chamber_invitations.target_email,
        targetPhone: schema.chamber_invitations.target_phone,
        chamberId: schema.chambers.id,
        chamberName: schema.chambers.name,
        chamberPlanTier: schema.chambers.plan_tier,
        inviterName: schema.users.name,
      })
      .from(schema.chamber_invitations)
      .innerJoin(
        schema.chambers,
        eq(schema.chamber_invitations.chamber_id, schema.chambers.id)
      )
      .innerJoin(
        schema.users,
        eq(schema.chamber_invitations.created_by_user_id, schema.users.id)
      )
      .where(eq(schema.chamber_invitations.invite_token, token))
      .limit(1);

    if (invites.length === 0) {
      return NextResponse.json(
        { success: false, valid: false, error: "Invalid invitation token or link does not exist." },
        { status: 404 }
      );
    }

    const inv = invites[0];
    const now = new Date();

    if (inv.status !== "active" || inv.usedCount >= inv.maxUses) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: "This invitation link has already been claimed or exhausted.",
        },
        { status: 410 }
      );
    }

    if (new Date(inv.expiresAt) < now) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: "This invitation link has expired. Please request a fresh invitation from your Senior Advocate.",
        },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: true,
      invitation: {
        token: inv.inviteToken,
        chamberId: inv.chamberId,
        chamberName: inv.chamberName,
        role: inv.role,
        inviterName: inv.inviterName,
        targetEmail: inv.targetEmail,
        targetPhone: inv.targetPhone,
        expiresAt: inv.expiresAt,
      },
    });
  } catch (error: any) {
    console.error("Fetch Invitation Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to validate invitation." },
      { status: 500 }
    );
  }
}
