import { NextRequest, NextResponse } from "next/server";
import { pgDb } from "@/db/pgClient";
import * as schema from "@/db/pgSchema";
import { eq } from "drizzle-orm";
import { signAuthToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken, credential, accessToken } = body;

    const tokenToVerify = idToken || credential;

    if (!tokenToVerify && !accessToken) {
      return NextResponse.json(
        { success: false, error: "Google ID Token or Access Token is required." },
        { status: 400 }
      );
    }

    // 1. Verify Token with Google Official API
    let verifiedEmail = "";
    let verifiedName = "";
    let verifiedAvatar = "";

    try {
      if (accessToken) {
        const userInfoRes = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (!userInfoRes.ok) {
          throw new Error("Invalid Google access token");
        }
        const userInfo = await userInfoRes.json();
        if (!userInfo.email) {
          return NextResponse.json(
            { success: false, error: "Unable to retrieve email from Google." },
            { status: 401 }
          );
        }
        verifiedEmail = userInfo.email.toLowerCase().trim();
        verifiedName = userInfo.name || verifiedEmail.split("@")[0];
        verifiedAvatar = userInfo.picture || "";
      } else {
        const googleRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${tokenToVerify}`
        );

        if (!googleRes.ok) {
          throw new Error("Invalid Google token");
        }

        const tokenInfo = await googleRes.json();

        if (tokenInfo.email_verified !== "true" && tokenInfo.email_verified !== true) {
          return NextResponse.json(
            { success: false, error: "Google account email is not verified." },
            { status: 401 }
          );
        }

        verifiedEmail = tokenInfo.email.toLowerCase().trim();
        verifiedName = tokenInfo.name || verifiedEmail.split("@")[0];
        verifiedAvatar = tokenInfo.picture || "";
      }
    } catch (verifyErr) {
      console.warn("Google token verification failed via Google API:", verifyErr);
      return NextResponse.json(
        {
          success: false,
          error: "Google authentication failed. Invalid token supplied by Google.",
        },
        { status: 401 }
      );
    }

    // 2. Check if user already exists in PostgreSQL
    const existingUsers = await pgDb
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, verifiedEmail))
      .limit(1);

    let user: any = null;
    let chamber: any = null;

    if (existingUsers.length > 0) {
      user = existingUsers[0];

      // Fetch Chamber
      const memberships = await pgDb
        .select({
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

      chamber = memberships[0] || null;
    } else {
      // 3. First time signing in with this Google account: Auto-provision User & Chamber
      const [newChamber] = await pgDb
        .insert(schema.chambers)
        .values({
          name: `${verifiedName}'s Law Chamber`,
          plan_tier: "solo",
          plan_status: "active",
          max_seats: 1,
          storage_limit_mb: 5120,
        })
        .returning();

      const [newUser] = await pgDb
        .insert(schema.users)
        .values({
          name: verifiedName,
          email: verifiedEmail,
          avatar_url: verifiedAvatar || null,
          role: "senior_advocate",
          is_verified: true,
        })
        .returning();

      await pgDb.insert(schema.chamber_members).values({
        chamber_id: newChamber.id,
        user_id: newUser.id,
        name: newUser.name,
        role: "Senior Advocate",
        email: newUser.email,
        status: "Active",
      });

      user = newUser;
      chamber = {
        chamberId: newChamber.id,
        chamberName: newChamber.name,
        role: "Senior Advocate",
        planTier: newChamber.plan_tier,
        maxSeats: newChamber.max_seats,
        planStatus: newChamber.plan_status,
      };
    }

    // 4. Issue Advocase JWT Token
    const appToken = signAuthToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      chamberId: chamber?.chamberId || "",
      planTier: chamber?.planTier || "solo",
    });

    const response = NextResponse.json({
      success: true,
      message: "Google authentication successful",
      isNewUser: existingUsers.length === 0,
      token: appToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar_url: user.avatar_url,
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

    response.cookies.set("advocase_token", appToken, {
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
    console.error("Google Auth Route Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process Google sign-in." },
      { status: 500 }
    );
  }
}
