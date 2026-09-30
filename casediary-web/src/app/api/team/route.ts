import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { getTodayDateString } from "@/lib/utils";

export async function GET() {
  try {
    const members = db.select().from(schema.ChamberMembers).all();
    const todayStr = getTodayDateString();

    const enrichedMembers = members.map((m) => {
      // Count total active cases assigned
      const activeCasesCount = db
        .select({ count: sql<number>`count(*)` })
        .from(schema.Cases)
        .where(eq(schema.Cases.assigned_member_id, m.id))
        .get()?.count || 0;

      // Count today's court duties
      const todayDutiesCount = db
        .select({ count: sql<number>`count(*)` })
        .from(schema.CaseAssignments)
        .where(
          sql`${schema.CaseAssignments.member_id} = ${m.id} AND ${schema.CaseAssignments.duty_date} = ${todayStr}`
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
      members: enrichedMembers,
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
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: "Member name is required" },
        { status: 400 }
      );
    }

    const newMember = db
      .insert(schema.ChamberMembers)
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
