import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const caseId = Number(id);

    if (isNaN(caseId)) {
      return NextResponse.json(
        { success: false, error: "Invalid case ID" },
        { status: 400 }
      );
    }

    const foundCase = db
      .select()
      .from(schema.Cases)
      .where(eq(schema.Cases.id, caseId))
      .get();

    if (!foundCase) {
      return NextResponse.json(
        { success: false, error: "Case not found" },
        { status: 404 }
      );
    }

    const timeline = db
      .select()
      .from(schema.CaseTimeline)
      .where(eq(schema.CaseTimeline.case_id, caseId))
      .orderBy(desc(schema.CaseTimeline.hearing_date), desc(schema.CaseTimeline.id))
      .all();

    const documents = db
      .select()
      .from(schema.CaseDocuments)
      .where(eq(schema.CaseDocuments.case_id, caseId))
      .orderBy(desc(schema.CaseDocuments.created_at))
      .all();

    const assignedMember = foundCase.assigned_member_id
      ? db.select().from(schema.ChamberMembers).where(eq(schema.ChamberMembers.id, foundCase.assigned_member_id)).get()
      : null;

    const assignments = db
      .select({
        id: schema.CaseAssignments.id,
        duty_date: schema.CaseAssignments.duty_date,
        duty_type: schema.CaseAssignments.duty_type,
        status: schema.CaseAssignments.status,
        notes: schema.CaseAssignments.notes,
        memberName: schema.ChamberMembers.name,
        memberRole: schema.ChamberMembers.role,
        memberPhone: schema.ChamberMembers.phone,
      })
      .from(schema.CaseAssignments)
      .leftJoin(schema.ChamberMembers, eq(schema.CaseAssignments.member_id, schema.ChamberMembers.id))
      .where(eq(schema.CaseAssignments.case_id, caseId))
      .orderBy(desc(schema.CaseAssignments.duty_date))
      .all();

    return NextResponse.json({
      success: true,
      case: foundCase,
      timeline,
      documents,
      assignedMember,
      assignments,
    });
  } catch (error: any) {
    console.error("Error fetching case details:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch case" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const caseId = Number(id);
    const body = await request.json();

    const existingCase = db
      .select()
      .from(schema.Cases)
      .where(eq(schema.Cases.id, caseId))
      .get();

    if (!existingCase) {
      return NextResponse.json(
        { success: false, error: "Case not found" },
        { status: 404 }
      );
    }

    const updatedCase = db
      .update(schema.Cases)
      .set({
        CaseTitle: body.CaseTitle !== undefined ? body.CaseTitle : existingCase.CaseTitle,
        ClientName: body.ClientName !== undefined ? body.ClientName : existingCase.ClientName,
        OnBehalfOf: body.OnBehalfOf !== undefined ? body.OnBehalfOf : existingCase.OnBehalfOf,
        CNRNumber: body.CNRNumber !== undefined ? body.CNRNumber : existingCase.CNRNumber,
        case_number: body.case_number !== undefined ? body.case_number : existingCase.case_number,
        case_year: body.case_year !== undefined ? Number(body.case_year) : existingCase.case_year,
        court_name: body.court_name !== undefined ? body.court_name : existingCase.court_name,
        case_type_name: body.case_type_name !== undefined ? body.case_type_name : existingCase.case_type_name,
        dateFiled: body.dateFiled !== undefined ? body.dateFiled : existingCase.dateFiled,
        NextDate: body.NextDate !== undefined ? body.NextDate : existingCase.NextDate,
        PreviousDate: body.PreviousDate !== undefined ? body.PreviousDate : existingCase.PreviousDate,
        StatuteOfLimitations: body.StatuteOfLimitations !== undefined ? body.StatuteOfLimitations : existingCase.StatuteOfLimitations,
        crime_number: body.crime_number !== undefined ? body.crime_number : existingCase.crime_number,
        crime_year: body.crime_year !== undefined ? Number(body.crime_year) : existingCase.crime_year,
        Undersection: body.Undersection !== undefined ? body.Undersection : existingCase.Undersection,
        FirstParty: body.FirstParty !== undefined ? body.FirstParty : existingCase.FirstParty,
        OppositeParty: body.OppositeParty !== undefined ? body.OppositeParty : existingCase.OppositeParty,
        Accussed: body.Accussed !== undefined ? body.Accussed : existingCase.Accussed,
        ClientContactNumber: body.ClientContactNumber !== undefined ? body.ClientContactNumber : existingCase.ClientContactNumber,
        JudgeName: body.JudgeName !== undefined ? body.JudgeName : existingCase.JudgeName,
        OpposingCounsel: body.OpposingCounsel !== undefined ? body.OpposingCounsel : existingCase.OpposingCounsel,
        OppositeAdvocate: body.OppositeAdvocate !== undefined ? body.OppositeAdvocate : existingCase.OppositeAdvocate,
        OppAdvocateContactNumber: body.OppAdvocateContactNumber !== undefined ? body.OppAdvocateContactNumber : existingCase.OppAdvocateContactNumber,
        CaseStatus: body.CaseStatus !== undefined ? body.CaseStatus : existingCase.CaseStatus,
        Priority: body.Priority !== undefined ? body.Priority : existingCase.Priority,
        case_stage: body.case_stage !== undefined ? body.case_stage : existingCase.case_stage,
        total_fee: body.total_fee !== undefined ? Number(body.total_fee) : existingCase.total_fee,
        fee_paid: body.fee_paid !== undefined ? Number(body.fee_paid) : existingCase.fee_paid,
        date_fee: body.date_fee !== undefined ? Number(body.date_fee) : existingCase.date_fee,
        date_fee_collected: body.date_fee_collected !== undefined ? Number(body.date_fee_collected) : existingCase.date_fee_collected,
        date_fee_paid: body.date_fee_paid !== undefined ? Number(body.date_fee_paid) : existingCase.date_fee_paid,
        CaseDescription: body.CaseDescription !== undefined ? body.CaseDescription : existingCase.CaseDescription,
        CaseNotes: body.CaseNotes !== undefined ? body.CaseNotes : existingCase.CaseNotes,
        assigned_member_id: body.assigned_member_id !== undefined ? (body.assigned_member_id ? Number(body.assigned_member_id) : null) : existingCase.assigned_member_id,
        updated_at: sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`,
      })
      .where(eq(schema.Cases.id, caseId))
      .returning()
      .get();

    return NextResponse.json({
      success: true,
      case: updatedCase,
      message: "Case successfully updated",
    });
  } catch (error: any) {
    console.error("Error updating case:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update case" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const caseId = Number(id);

    db.delete(schema.Cases).where(eq(schema.Cases.id, caseId)).run();

    return NextResponse.json({
      success: true,
      message: "Case and associated history removed successfully",
    });
  } catch (error: any) {
    console.error("Error deleting case:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete case" },
      { status: 500 }
    );
  }
}
