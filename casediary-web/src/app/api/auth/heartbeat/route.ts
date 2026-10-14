import { NextRequest, NextResponse } from "next/server";
import { pgDb } from "@/db/pgClient";
import * as schema from "@/db/pgSchema";
import { eq } from "drizzle-orm";
import { verifyAuthToken } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("advocase_token")?.value;
    const token = authHeader?.replace("Bearer ", "") || cookieToken;

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthenticated" }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    const sessionHash = crypto.createHash("sha256").update(token).digest("hex");

    // Update heartbeat
    await pgDb
      .update(schema.chamber_active_sessions)
      .set({ last_heartbeat_at: new Date() })
      .where(eq(schema.chamber_active_sessions.session_token_hash, sessionHash));

    return NextResponse.json({ success: true, timestamp: Date.now() });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
