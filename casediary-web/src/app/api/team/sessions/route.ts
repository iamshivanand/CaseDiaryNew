import { NextRequest, NextResponse } from "next/server";
import { pgDb } from "@/db/pgClient";
import * as schema from "@/db/pgSchema";
import { eq, and, desc, sql } from "drizzle-orm";
import { verifyAuthToken, isSeniorAdvocate } from "@/lib/auth";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("advocase_token")?.value;
    const token = authHeader?.replace("Bearer ", "") || cookieToken;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication required to view active sessions." },
        { status: 401 }
      );
    }

    const payload = verifyAuthToken(token);
    if (!payload || !payload.chamberId) {
      return NextResponse.json(
        { success: false, error: "Valid chamber session required." },
        { status: 401 }
      );
    }

    const currentTokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Fetch chamber seat details
    const chamberRes = await pgDb
      .select({
        id: schema.chambers.id,
        name: schema.chambers.name,
        planTier: schema.chambers.plan_tier,
        maxSeats: schema.chambers.max_seats,
      })
      .from(schema.chambers)
      .where(eq(schema.chambers.id, payload.chamberId))
      .limit(1);

    const chamber = chamberRes[0] || null;

    // Fetch active sessions for this chamber
    // If user is Senior, they can view all sessions in the chamber.
    // If Associate, they see their own active sessions.
    const isSenior = isSeniorAdvocate(payload);

    const conditions = [
      eq(schema.chamber_active_sessions.chamber_id, payload.chamberId),
      eq(schema.chamber_active_sessions.is_active, true),
    ];

    if (!isSenior) {
      conditions.push(eq(schema.chamber_active_sessions.user_id, payload.userId));
    }

    const rawSessions = await pgDb
      .select({
        id: schema.chamber_active_sessions.id,
        userId: schema.chamber_active_sessions.user_id,
        sessionTokenHash: schema.chamber_active_sessions.session_token_hash,
        deviceName: schema.chamber_active_sessions.device_name,
        ipAddress: schema.chamber_active_sessions.ip_address,
        isActive: schema.chamber_active_sessions.is_active,
        lastHeartbeatAt: schema.chamber_active_sessions.last_heartbeat_at,
        createdAt: schema.chamber_active_sessions.created_at,
        userName: schema.users.name,
        userRole: schema.users.role,
        userEmail: schema.users.email,
      })
      .from(schema.chamber_active_sessions)
      .innerJoin(
        schema.users,
        eq(schema.chamber_active_sessions.user_id, schema.users.id)
      )
      .where(and(...conditions))
      .orderBy(desc(schema.chamber_active_sessions.last_heartbeat_at));

    // Calculate unique active users currently online
    const uniqueUserIds = new Set(rawSessions.map((s) => s.userId));

    const sessions = rawSessions.map((s) => ({
      id: s.id,
      userId: s.userId,
      userName: s.userName,
      userRole: s.userRole,
      userEmail: s.userEmail,
      deviceName: s.deviceName,
      ipAddress: s.ipAddress,
      isActive: s.isActive,
      lastHeartbeatAt: s.lastHeartbeatAt,
      createdAt: s.createdAt,
      isCurrentDevice: s.sessionTokenHash === currentTokenHash,
    }));

    return NextResponse.json({
      success: true,
      sessions,
      seats: {
        activeDevicesCount: sessions.length,
        activeAdvocatesCount: uniqueUserIds.size,
        maxSeats: chamber?.maxSeats || 1,
        planTier: chamber?.planTier || "solo",
        chamberName: chamber?.name || "Chamber",
      },
    });
  } catch (error: any) {
    console.error("Fetch Active Sessions Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch active sessions" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("advocase_token")?.value;
    const token = authHeader?.replace("Bearer ", "") || cookieToken;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication required to revoke session." },
        { status: 401 }
      );
    }

    const payload = verifyAuthToken(token);
    if (!payload || !payload.chamberId) {
      return NextResponse.json(
        { success: false, error: "Valid chamber session required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID parameter is required." },
        { status: 400 }
      );
    }

    const isSenior = isSeniorAdvocate(payload);

    // Target session check
    const targetSession = await pgDb
      .select()
      .from(schema.chamber_active_sessions)
      .where(eq(schema.chamber_active_sessions.id, sessionId))
      .limit(1);

    if (targetSession.length === 0) {
      return NextResponse.json(
        { success: false, error: "Session not found." },
        { status: 404 }
      );
    }

    const sess = targetSession[0];

    // Associates can only revoke their own session; Seniors can revoke any in their chamber
    if (!isSenior && sess.user_id !== payload.userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Permission denied. You can only disconnect your own sessions.",
        },
        { status: 403 }
      );
    }

    if (sess.chamber_id !== payload.chamberId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized chamber access." },
        { status: 403 }
      );
    }

    // Revoke the session
    await pgDb
      .update(schema.chamber_active_sessions)
      .set({ is_active: false })
      .where(eq(schema.chamber_active_sessions.id, sessionId));

    return NextResponse.json({
      success: true,
      message: "Device session revoked successfully.",
    });
  } catch (error: any) {
    console.error("Revoke Session Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to revoke session" },
      { status: 500 }
    );
  }
}
