import { NextRequest, NextResponse } from "next/server";
import { pgDb } from "@/db/pgClient";
import * as schema from "@/db/pgSchema";
import { eq, or, and, sql } from "drizzle-orm";
import { hashPassword, signAuthToken } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      token,
      name,
      email,
      phone,
      password,
      barCouncilNumber,
      deviceName = "Web Browser",
    } = body;

    if (!token || !name || !password || (!email && !phone)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invitation token, full name, password, and email/phone are required.",
        },
        { status: 400 }
      );
    }

    // 1. Verify invitation token
    const invites = await pgDb
      .select({
        id: schema.chamber_invitations.id,
        chamberId: schema.chamber_invitations.chamber_id,
        role: schema.chamber_invitations.role,
        status: schema.chamber_invitations.status,
        expiresAt: schema.chamber_invitations.expires_at,
        usedCount: schema.chamber_invitations.used_count,
        maxUses: schema.chamber_invitations.max_uses,
        chamberName: schema.chambers.name,
        planTier: schema.chambers.plan_tier,
        maxSeats: schema.chambers.max_seats,
      })
      .from(schema.chamber_invitations)
      .innerJoin(
        schema.chambers,
        eq(schema.chamber_invitations.chamber_id, schema.chambers.id)
      )
      .where(eq(schema.chamber_invitations.invite_token, token))
      .limit(1);

    if (invites.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid invitation token or link does not exist." },
        { status: 404 }
      );
    }

    const invite = invites[0];
    const now = new Date();

    if (invite.status !== "active" || invite.usedCount >= invite.maxUses) {
      return NextResponse.json(
        { success: false, error: "This invitation link has already been claimed or exhausted." },
        { status: 410 }
      );
    }

    if (new Date(invite.expiresAt) < now) {
      return NextResponse.json(
        {
          success: false,
          error: "This invitation link has expired. Please ask your Senior Advocate for a fresh invite.",
        },
        { status: 410 }
      );
    }

    // 2. Check if user already exists
    const existingConditions = [];
    if (email && email.trim()) existingConditions.push(eq(schema.users.email, email.trim().toLowerCase()));
    if (phone && phone.trim()) existingConditions.push(eq(schema.users.phone, phone.trim()));

    let user: any = null;

    if (existingConditions.length > 0) {
      const found = await pgDb
        .select()
        .from(schema.users)
        .where(or(...existingConditions))
        .limit(1);

      if (found.length > 0) {
        // User already exists. Check if already a member of this chamber
        user = found[0];
        const existingMembership = await pgDb
          .select()
          .from(schema.chamber_members)
          .where(
            and(
              eq(schema.chamber_members.chamber_id, invite.chamberId),
              eq(schema.chamber_members.user_id, user.id)
            )
          )
          .limit(1);

        if (existingMembership.length > 0) {
          return NextResponse.json(
            {
              success: false,
              error: "You are already an enrolled member of this chamber.",
            },
            { status: 409 }
          );
        }
      }
    }

    // 3. Check chamber seat capacity
    const memberCountRes = await pgDb
      .select({ count: sql<number>`count(*)` })
      .from(schema.chamber_members)
      .where(
        and(
          eq(schema.chamber_members.chamber_id, invite.chamberId),
          eq(schema.chamber_members.status, "Active")
        )
      );

    const activeCount = Number(memberCountRes[0]?.count || 0);
    if (activeCount >= invite.maxSeats) {
      return NextResponse.json(
        {
          success: false,
          error: "Chamber has reached its maximum seat allowance. Contact the Senior Advocate to expand seats.",
        },
        { status: 400 }
      );
    }

    // 4. Create user if new
    const assignedRole = invite.role.toLowerCase().includes("senior") || invite.role.toLowerCase().includes("partner")
      ? "senior_advocate"
      : "junior_advocate";

    if (!user) {
      const passwordHash = await hashPassword(password);
      const [newUser] = await pgDb
        .insert(schema.users)
        .values({
          name: name.trim(),
          email: email ? email.trim().toLowerCase() : null,
          phone: phone ? phone.trim() : null,
          password_hash: passwordHash,
          barCouncilNumber: barCouncilNumber?.trim() || null,
          role: assignedRole,
          is_verified: true,
        })
        .returning();
      user = newUser;
    }

    // 5. Add user to chamber_members
    await pgDb.insert(schema.chamber_members).values({
      chamber_id: invite.chamberId,
      user_id: user.id,
      name: user.name,
      role: invite.role, // Preassigned role locked from Senior's invitation
      barCouncilNumber: user.barCouncilNumber,
      phone: user.phone,
      email: user.email,
      status: "Active",
    });

    // 6. Update invitation usage count & status
    const newUsedCount = invite.usedCount + 1;
    await pgDb
      .update(schema.chamber_invitations)
      .set({
        used_count: newUsedCount,
        status: newUsedCount >= invite.maxUses ? "exhausted" : "active",
      })
      .where(eq(schema.chamber_invitations.id, invite.id));

    // 7. Sign JWT Auth Token
    const authToken = signAuthToken({
      userId: user.id,
      email: user.email || undefined,
      phone: user.phone || undefined,
      name: user.name,
      role: user.role,
      chamberId: invite.chamberId,
      planTier: invite.planTier,
    });

    // 8. Register Active Session
    const sessionTokenHash = crypto.createHash("sha256").update(authToken).digest("hex");
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    await pgDb.insert(schema.chamber_active_sessions).values({
      chamber_id: invite.chamberId,
      user_id: user.id,
      session_token_hash: sessionTokenHash,
      device_name: deviceName || "Advocase Workspace (Web)",
      ip_address: ip,
      is_active: true,
      last_heartbeat_at: new Date(),
    });

    const response = NextResponse.json({
      success: true,
      message: `Successfully joined ${invite.chamberName} as ${invite.role}`,
      token: authToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        barCouncilNumber: user.barCouncilNumber,
      },
      chamber: {
        id: invite.chamberId,
        name: invite.chamberName,
        role: invite.role,
        plan_tier: invite.planTier,
      },
    });

    response.cookies.set("advocase_token", authToken, {
      path: "/",
      maxAge: 2592000,
      sameSite: "lax",
    });
    response.cookies.set("advocase_session", "true", {
      path: "/",
      maxAge: 2592000,
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("Chamber Join Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to join chamber" },
      { status: 500 }
    );
  }
}
