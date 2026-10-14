import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pgDb } from "@/db/pgClient";
import * as pgSchema from "@/db/pgSchema";
import { db as sqliteDb } from "@/db";
import * as sqliteSchema from "@/db/schema";
import { eq, asc, desc, and } from "drizzle-orm";
import { getTodayDateString } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || getTodayDateString();

    // ─────────────────────────────────────────────────────────────────────────
    // 1. CLOUD POSTGRESQL (Authenticated Chamber)
    // ─────────────────────────────────────────────────────────────────────────
    if (authUser && authUser.chamberId && authUser.chamberId !== "demo-chamber-id") {
      const cases = await pgDb
        .select()
        .from(pgSchema.cases)
        .where(
          and(
            eq(pgSchema.cases.chamber_id, authUser.chamberId),
            eq(pgSchema.cases.NextDate, date),
            eq(pgSchema.cases.is_deleted, false)
          )
        )
        .orderBy(asc(pgSchema.cases.court_name), desc(pgSchema.cases.Priority));

      const members = await pgDb
        .select({
          id: pgSchema.chamber_members.id,
          name: pgSchema.chamber_members.name,
          role: pgSchema.chamber_members.role,
          phone: pgSchema.chamber_members.phone,
        })
        .from(pgSchema.chamber_members)
        .where(eq(pgSchema.chamber_members.chamber_id, authUser.chamberId));

      const membersMap = new Map(members.map((m) => [m.id, m]));

      const dateAssignments = await pgDb
        .select()
        .from(pgSchema.case_assignments)
        .where(eq(pgSchema.case_assignments.duty_date, date));

      const assignmentsMap = new Map(
        dateAssignments.map((a) => [a.case_unique_id, a])
      );

      const casesWithTeam = cases.map((c) => {
        const duty = assignmentsMap.get(c.uniqueId);
        let dutyMember = null;
        if (duty && duty.member_id) {
          dutyMember = membersMap.get(duty.member_id) || null;
        }

        return {
          ...c,
          assignedMember: c.assigned_member_id
            ? membersMap.get(c.assigned_member_id) || null
            : null,
          duty: duty ? { ...duty, member: dutyMember } : null,
        };
      });

      return NextResponse.json({
        success: true,
        source: "cloud_postgres",
        date,
        count: casesWithTeam.length,
        cases: casesWithTeam,
        lawyer: {
          name: authUser.name,
          email: authUser.email,
        },
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. ISOLATED DEMO SANDBOX
    // ─────────────────────────────────────────────────────────────────────────
    const cases = sqliteDb
      .select()
      .from(sqliteSchema.Cases)
      .where(and(eq(sqliteSchema.Cases.NextDate, date), eq(sqliteSchema.Cases.user_id, 1)))
      .orderBy(asc(sqliteSchema.Cases.court_name), desc(sqliteSchema.Cases.Priority))
      .all();

    const allMembers = sqliteDb
      .select({
        id: sqliteSchema.ChamberMembers.id,
        name: sqliteSchema.ChamberMembers.name,
        role: sqliteSchema.ChamberMembers.role,
        phone: sqliteSchema.ChamberMembers.phone,
      })
      .from(sqliteSchema.ChamberMembers)
      .all();
    const membersMap = new Map(allMembers.map((m) => [m.id, m]));

    const dateAssignments = sqliteDb
      .select()
      .from(sqliteSchema.CaseAssignments)
      .where(eq(sqliteSchema.CaseAssignments.duty_date, date))
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

    const lawyer = sqliteDb.select().from(sqliteSchema.LawyerProfiles).get();

    return NextResponse.json({
      success: true,
      source: "demo_sandbox",
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
