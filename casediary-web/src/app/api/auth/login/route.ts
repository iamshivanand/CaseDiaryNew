import { NextRequest, NextResponse } from "next/server";
import { pgDb } from "@/db/pgClient";
import * as schema from "@/db/pgSchema";
import { eq, or } from "drizzle-orm";
import { comparePassword, signAuthToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, email, phone, password } = body;

    const loginId = (identifier || email || phone || "").trim();

    if (!loginId || !password) {
      return NextResponse.json(
        { success: false, error: "Email/Phone and password are required." },
        { status: 400 }
      );
    }

    // 1. Find user by email or phone
    const foundUsers = await pgDb
      .select()
      .from(schema.users)
      .where(
        or(
          eq(schema.users.email, loginId.toLowerCase()),
          eq(schema.users.phone, loginId)
        )
      )
      .limit(1);

    if (foundUsers.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials. Advocate not found." },
        { status: 401 }
      );
    }

    const user = foundUsers[0];

    // 2. Verify Password
    if (!user.password_hash) {
      return NextResponse.json(
        { success: false, error: "Password not set for this account." },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials. Incorrect password." },
        { status: 401 }
      );
    }

    // 3. Find Chamber Membership
    const memberships = await pgDb
      .select({
        memberId: schema.chamber_members.id,
        role: schema.chamber_members.role,
        chamberId: schema.chambers.id,
        chamberName: schema.chambers.name,
        planTier: schema.chambers.plan_tier,
        maxSeats: schema.chambers.max_seats,
        planStatus: schema.chambers.plan_status,
      })
      .from(schema.chamber_members)
      .innerJoin(
        schema.chambers,
        eq(schema.chamber_members.chamber_id, schema.chambers.id)
      )
      .where(eq(schema.chamber_members.user_id, user.id))
      .limit(1);

    const chamber = memberships[0] || null;

    // 4. Sign JWT
    const token = signAuthToken({
      userId: user.id,
      email: user.email || undefined,
      phone: user.phone || undefined,
      name: user.name,
      role: user.role,
      chamberId: chamber?.chamberId || "",
      planTier: chamber?.planTier || "solo",
    });

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        barCouncilNumber: user.barCouncilNumber,
        chamberAddress: user.chamberAddress,
      },
      chamber: chamber
        ? {
            id: chamber.chamberId,
            name: chamber.chamberName,
            role: chamber.role,
            plan_tier: chamber.planTier,
            max_seats: chamber.maxSeats,
            plan_status: chamber.planStatus,
          }
        : null,
    });

    response.cookies.set("advocase_token", token, {
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
    console.error("Login Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to log in" },
      { status: 500 }
    );
  }
}
