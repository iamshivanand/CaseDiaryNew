import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pgDb } from "@/db/pgClient";
import * as schema from "@/db/pgSchema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Missing or invalid token." },
        { status: 401 }
      );
    }

    const [user] = await pgDb
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        phone: schema.users.phone,
        role: schema.users.role,
        barCouncilNumber: schema.users.barCouncilNumber,
        chamberAddress: schema.users.chamberAddress,
      })
      .from(schema.users)
      .where(eq(schema.users.id, authUser.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get Chamber details
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

    const chamber = memberships[0] || null;

    return NextResponse.json({
      success: true,
      user,
      chamber: chamber
        ? {
            id: chamber.chamberId,
            name: chamber.chamberName,
            role: chamber.role,
            plan_tier: chamber.planTier,
            max_seats: chamber.maxSeats,
            planStatus: chamber.planStatus,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Auth Me Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
