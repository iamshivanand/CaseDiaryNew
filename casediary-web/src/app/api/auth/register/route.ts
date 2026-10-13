import { NextRequest, NextResponse } from "next/server";
import { pgDb } from "@/db/pgClient";
import * as schema from "@/db/pgSchema";
import { eq, or } from "drizzle-orm";
import { hashPassword, signAuthToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      password,
      chamberName,
      barCouncilNumber,
      planTier = "solo",
    } = body;

    if (!name || !password || (!email && !phone)) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, password, and at least an email or phone number are required.",
        },
        { status: 400 }
      );
    }

    // 1. Check for existing user by email or phone
    const existingConditions = [];
    if (email && email.trim()) existingConditions.push(eq(schema.users.email, email.trim().toLowerCase()));
    if (phone && phone.trim()) existingConditions.push(eq(schema.users.phone, phone.trim()));

    if (existingConditions.length > 0) {
      const existingUser = await pgDb
        .select()
        .from(schema.users)
        .where(or(...existingConditions))
        .limit(1);

      if (existingUser.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: "An advocate account already exists with this email or phone number.",
          },
          { status: 409 }
        );
      }
    }

    // 2. Hash password
    const passwordHash = await hashPassword(password);

    // 3. Create Chamber Organization
    const defaultChamberName = chamberName?.trim() || `${name.trim()}'s Law Chamber`;
    const maxSeats = planTier === "firm_enterprise" ? 25 : planTier === "chamber_pro" ? 5 : 1;

    const [newChamber] = await pgDb
      .insert(schema.chambers)
      .values({
        name: defaultChamberName,
        plan_tier: planTier,
        plan_status: "active",
        max_seats: maxSeats,
        storage_limit_mb: planTier === "firm_enterprise" ? 51200 : planTier === "chamber_pro" ? 20480 : 5120,
      })
      .returning();

    // 4. Create User
    const [newUser] = await pgDb
      .insert(schema.users)
      .values({
        name: name.trim(),
        email: email ? email.trim().toLowerCase() : null,
        phone: phone ? phone.trim() : null,
        password_hash: passwordHash,
        barCouncilNumber: barCouncilNumber?.trim() || null,
        role: "senior_advocate",
        is_verified: true,
      })
      .returning();

    // 5. Add User as Chamber Owner/Senior Advocate
    await pgDb.insert(schema.chamber_members).values({
      chamber_id: newChamber.id,
      user_id: newUser.id,
      name: newUser.name,
      role: "Senior Advocate",
      barCouncilNumber: newUser.barCouncilNumber,
      phone: newUser.phone,
      email: newUser.email,
      status: "Active",
    });

    // 6. Sign JWT
    const token = signAuthToken({
      userId: newUser.id,
      email: newUser.email || undefined,
      phone: newUser.phone || undefined,
      name: newUser.name,
      role: newUser.role,
      chamberId: newChamber.id,
      planTier: newChamber.plan_tier,
    });

    const response = NextResponse.json({
      success: true,
      message: "Advocate and Chamber created successfully",
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        barCouncilNumber: newUser.barCouncilNumber,
      },
      chamber: {
        id: newChamber.id,
        name: newChamber.name,
        plan_tier: newChamber.plan_tier,
        max_seats: newChamber.max_seats,
      },
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

    // 7. Track Active Session in Chamber Radar
    try {
      const userAgent = req.headers.get("user-agent") || "Advocase Web Client";
      let deviceName = "Web Browser";
      if (userAgent.includes("Windows")) deviceName = "Windows PC / Laptop";
      else if (userAgent.includes("Macintosh")) deviceName = "Mac Desktop";
      else if (userAgent.includes("Android")) deviceName = "Android Mobile";
      else if (userAgent.includes("iPhone")) deviceName = "Apple iPhone";
      else if (userAgent.includes("iPad")) deviceName = "Apple iPad";

      const crypto = await import("crypto");
      const sessionHash = crypto.createHash("sha256").update(token).digest("hex");
      const forwarded = req.headers.get("x-forwarded-for");
      const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

      await pgDb.insert(schema.chamber_active_sessions).values({
        chamber_id: newChamber.id,
        user_id: newUser.id,
        session_token_hash: sessionHash,
        device_name: deviceName,
        ip_address: ip,
        is_active: true,
        last_heartbeat_at: new Date(),
      });
    } catch (sessErr) {
      console.warn("Could not log active session on register:", sessErr);
    }

    return response;
  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to register advocate" },
      { status: 500 }
    );
  }
}
