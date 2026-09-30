import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { getTodayDateString } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || getTodayDateString();

    const cases = db
      .select()
      .from(schema.Cases)
      .where(eq(schema.Cases.NextDate, date))
      .orderBy(asc(schema.Cases.court_name), desc(schema.Cases.Priority))
      .all();

    // Fetch all chamber members and date assignments in single batch queries to eliminate N+1 latency
    const allMembers = db
      .select({
        id: schema.ChamberMembers.id,
        name: schema.ChamberMembers.name,
        role: schema.ChamberMembers.role,
        phone: schema.ChamberMembers.phone,
      })
      .from(schema.ChamberMembers)
      .all();
    const membersMap = new Map(allMembers.map((m) => [m.id, m]));

    const dateAssignments = db
      .select()
      .from(schema.CaseAssignments)
      .where(eq(schema.CaseAssignments.duty_date, date))
      .all();
    const assignmentsMap = new Map(dateAssignments.map((a) => [a.case_id, a]));

    const casesWithTeam = cases.map((c) => {
      const assignedMember = c.assigned_member_id ? membersMap.get(c.assigned_member_id) || null : null;
      const duty = assignmentsMap.get(c.id);
      let dutyMember = null;
      if (duty && duty.member_id) {
        dutyMember = membersMap.get(duty.member_id) || null;
      }

      return {
        ...c,
        assignedMember,
        duty: duty ? { ...duty, member: dutyMember } : null,
      };
    });

    const lawyer = db.select().from(schema.LawyerProfiles).get();

    return NextResponse.json({
      success: true,
      date,
      count: casesWithTeam.length,
      cases: casesWithTeam,
      lawyer,
    });
  } catch (error: any) {
    console.error("Error generating cause list:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
