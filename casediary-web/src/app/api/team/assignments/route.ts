import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { getTodayDateString } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || getTodayDateString();
    const memberId = searchParams.get("member_id");

    let conditions = [];
    if (date !== "all") {
      conditions.push(eq(schema.CaseAssignments.duty_date, date));
    }
    if (memberId) {
      conditions.push(eq(schema.CaseAssignments.member_id, Number(memberId)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rawAssignments = db
      .select({
        id: schema.CaseAssignments.id,
        case_id: schema.CaseAssignments.case_id,
        member_id: schema.CaseAssignments.member_id,
        duty_date: schema.CaseAssignments.duty_date,
        duty_type: schema.CaseAssignments.duty_type,
        status: schema.CaseAssignments.status,
        notes: schema.CaseAssignments.notes,
        created_at: schema.CaseAssignments.created_at,
        caseTitle: schema.Cases.CaseTitle,
        caseNumber: schema.Cases.case_number,
        cnrNumber: schema.Cases.CNRNumber,
        courtName: schema.Cases.court_name,
        judgeName: schema.Cases.JudgeName,
        caseStage: schema.Cases.case_stage,
        clientName: schema.Cases.ClientName,
        clientPhone: schema.Cases.ClientContactNumber,
        priority: schema.Cases.Priority,
        memberName: schema.ChamberMembers.name,
        memberRole: schema.ChamberMembers.role,
        memberPhone: schema.ChamberMembers.phone,
        memberBarNo: schema.ChamberMembers.barCouncilNumber,
      })
      .from(schema.CaseAssignments)
      .leftJoin(schema.Cases, eq(schema.CaseAssignments.case_id, schema.Cases.id))
      .leftJoin(schema.ChamberMembers, eq(schema.CaseAssignments.member_id, schema.ChamberMembers.id))
      .where(whereClause)
      .orderBy(desc(schema.CaseAssignments.id))
      .all();

    return NextResponse.json({
      success: true,
      date,
      count: rawAssignments.length,
      assignments: rawAssignments,
    });
  } catch (error: any) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.case_id || !body.member_id) {
      return NextResponse.json(
        { success: false, error: "case_id and member_id are required" },
        { status: 400 }
      );
    }

    const duty_date = body.duty_date || getTodayDateString();
    const duty_type = body.duty_type || "Pass-Over Request";
    const notes = body.notes || "";

    const newAssignment = db
      .insert(schema.CaseAssignments)
      .values({
        case_id: Number(body.case_id),
        member_id: Number(body.member_id),
        duty_date,
        duty_type,
        status: "Pending",
        notes,
      })
      .returning()
      .get();

    // Link assigned member to the case if requested
    db.update(schema.Cases)
      .set({ assigned_member_id: Number(body.member_id) })
      .where(eq(schema.Cases.id, Number(body.case_id)))
      .run();

    return NextResponse.json({
      success: true,
      assignment: newAssignment,
      message: "Duty assigned successfully to chamber member",
    });
  } catch (error: any) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const assignmentId = Number(body.id);

    if (!assignmentId) {
      return NextResponse.json(
        { success: false, error: "Assignment id is required" },
        { status: 400 }
      );
    }

    const existing = db
      .select()
      .from(schema.CaseAssignments)
      .where(eq(schema.CaseAssignments.id, assignmentId))
      .get();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Assignment not found" },
        { status: 404 }
      );
    }

    const updated = db
      .update(schema.CaseAssignments)
      .set({
        status: body.status !== undefined ? body.status : existing.status,
        notes: body.notes !== undefined ? body.notes : existing.notes,
        duty_type: body.duty_type !== undefined ? body.duty_type : existing.duty_type,
        updated_at: sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`,
      })
      .where(eq(schema.CaseAssignments.id, assignmentId))
      .returning()
      .get();

    return NextResponse.json({
      success: true,
      assignment: updated,
      message: "Duty status updated",
    });
  } catch (error: any) {
    console.error("Error updating assignment:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "id is required" },
        { status: 400 }
      );
    }

    db.delete(schema.CaseAssignments).where(eq(schema.CaseAssignments.id, Number(id))).run();

    return NextResponse.json({ success: true, message: "Duty assignment removed" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
