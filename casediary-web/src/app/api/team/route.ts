import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, isSeniorAdvocate } from "@/lib/auth";
import { pgDb } from "@/db/pgClient";
import * as pgSchema from "@/db/pgSchema";
import { eq, sql as drizzleSql } from "drizzle-orm";
import { db as sqliteDb } from "@/db";
import * as sqliteSchema from "@/db/schema";
import { getTodayDateString } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    const todayStr = getTodayDateString();

    // 1. CLOUD POSTGRES (Authenticated Chamber)
    if (authUser && authUser.chamberId) {
      const members = await pgDb
        .select()
        .from(pgSchema.chamber_members)
        .where(eq(pgSchema.chamber_members.chamber_id, authUser.chamberId));

      const [chamber] = await pgDb
        .select()
        .from(pgSchema.chambers)
        .where(eq(pgSchema.chambers.id, authUser.chamberId))
        .limit(1);

      return NextResponse.json({
        success: true,
        source: "cloud_postgres",
        members,
        chamberPlan: chamber
          ? {
              tier: chamber.plan_tier,
              status: chamber.plan_status,
              maxSeats: chamber.max_seats,
              usedSeats: members.length,
              storageMb: chamber.storage_limit_mb,
            }
          : null,
      });
    }

    // 2. LOCAL SQLITE FALLBACK
    const members = sqliteDb.select().from(sqliteSchema.ChamberMembers).all();
    const enrichedMembers = members.map((m) => {
      const activeCasesCount =
        sqliteDb
          .select({ count: drizzleSql<number>`count(*)` })
          .from(sqliteSchema.Cases)
          .where(eq(sqliteSchema.Cases.assigned_member_id, m.id))
          .get()?.count || 0;

      const todayDutiesCount =
        sqliteDb
          .select({ count: drizzleSql<number>`count(*)` })
          .from(sqliteSchema.CaseAssignments)
          .where(
            drizzleSql`${sqliteSchema.CaseAssignments.member_id} = ${m.id} AND ${sqliteSchema.CaseAssignments.duty_date} = ${todayStr}`
          )
          .get()?.count || 0;

      return {
        ...m,
        activeCasesCount,
        todayDutiesCount,
      };
    });

    return NextResponse.json({
      success: true,
      source: "local_sqlite",
      members: enrichedMembers,
      chamberPlan: {
        tier: "chamber_pro",
        maxSeats: 5,
        usedSeats: members.length,
      },
    });
  } catch (error: any) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    const body = await request.json();

    if (authUser && !isSeniorAdvocate(authUser)) {
      return NextResponse.json(
        {
          success: false,
          error: "Permission Denied: Only Senior Advocates / Chamber Heads have permission to add or invite members to the chamber roster.",
        },
        { status: 403 }
      );
    }

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: "Member name is required" },
        { status: 400 }
      );
    }

    // 1. CLOUD POSTGRES (Enforce Chamber Plan Limits)
    if (authUser && authUser.chamberId) {
      const [chamber] = await pgDb
        .select()
        .from(pgSchema.chambers)
        .where(eq(pgSchema.chambers.id, authUser.chamberId))
        .limit(1);

      if (chamber) {
        const existingMembers = await pgDb
          .select()
          .from(pgSchema.chamber_members)
          .where(eq(pgSchema.chamber_members.chamber_id, authUser.chamberId));

        if (existingMembers.length >= chamber.max_seats) {
          return NextResponse.json(
            {
              success: false,
              error: `Chamber seat limit reached (${chamber.max_seats} seat on ${chamber.plan_tier.toUpperCase()} plan). Upgrade to Chamber Pro for up to 5 seats or Firm Enterprise for unlimited seats.`,
              isPlanLimit: true,
            },
            { status: 403 }
          );
        }
      }

      // Create new junior user record or chamber member
      const [newMember] = await pgDb
        .insert(pgSchema.chamber_members)
        .values({
          chamber_id: authUser.chamberId,
          user_id: authUser.userId,
          name: body.name,
          role: body.role || "Junior Advocate",
          barCouncilNumber: body.barCouncilNumber || null,
          phone: body.phone || null,
          email: body.email || null,
          assigned_courts: body.assigned_courts || "",
          status: body.status || "Active",
        })
        .returning();

      return NextResponse.json({
        success: true,
        source: "cloud_postgres",
        member: newMember,
        message: "Chamber member added successfully to your cloud team",
      });
    }

    // 2. LOCAL SQLITE FALLBACK
    const newMember = sqliteDb
      .insert(sqliteSchema.ChamberMembers)
      .values({
        user_id: 1,
        name: body.name,
        role: body.role || "Junior Advocate",
        barCouncilNumber: body.barCouncilNumber || null,
        phone: body.phone || null,
        email: body.email || null,
        assigned_courts: body.assigned_courts || "",
        status: body.status || "Active",
      })
      .returning()
      .get();

    return NextResponse.json({
      success: true,
      source: "local_sqlite",
      member: newMember,
      message: "Chamber member added successfully",
    });
  } catch (error: any) {
    console.error("Error creating team member:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
