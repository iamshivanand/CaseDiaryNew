import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, isSeniorAdvocate } from "@/lib/auth";
import { pgDb } from "@/db/pgClient";
import * as pgSchema from "@/db/pgSchema";
import { db as sqliteDb } from "@/db";
import * as sqliteSchema from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const authUser = getAuthUser(request);
    const { id } = await params;
    const caseId = Number(id);

    if (isNaN(caseId)) {
      return NextResponse.json(
        { success: false, error: "Invalid case ID" },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. CLOUD POSTGRESQL (Authenticated Chamber)
    // ─────────────────────────────────────────────────────────────────────────
    if (authUser && authUser.chamberId && authUser.chamberId !== "demo-chamber-id") {
      const [foundCase] = await pgDb
        .select()
        .from(pgSchema.cases)
        .where(
          and(
            eq(pgSchema.cases.id, caseId),
            eq(pgSchema.cases.chamber_id, authUser.chamberId),
            eq(pgSchema.cases.is_deleted, false)
          )
        )
        .limit(1);

      if (!foundCase) {
        return NextResponse.json(
          { success: false, error: "Case not found or access restricted" },
          { status: 404 }
        );
      }

      const timeline = await pgDb
        .select()
        .from(pgSchema.case_timeline)
        .where(
          and(
            eq(pgSchema.case_timeline.case_unique_id, foundCase.uniqueId),
            eq(pgSchema.case_timeline.is_deleted, false)
          )
        )
        .orderBy(
          desc(pgSchema.case_timeline.hearing_date),
          desc(pgSchema.case_timeline.id)
        );

      const documents = await pgDb
        .select()
        .from(pgSchema.case_documents)
        .where(
          and(
            eq(pgSchema.case_documents.case_unique_id, foundCase.uniqueId),
            eq(pgSchema.case_documents.is_deleted, false)
          )
        )
        .orderBy(desc(pgSchema.case_documents.created_at));

      const assignments = await pgDb
        .select()
        .from(pgSchema.case_assignments)
        .where(eq(pgSchema.case_assignments.case_unique_id, foundCase.uniqueId))
        .orderBy(desc(pgSchema.case_assignments.duty_date));

      return NextResponse.json({
        success: true,
        source: "cloud_postgres",
        case: foundCase,
        timeline,
        documents,
        assignments,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. ISOLATED DEMO SANDBOX
    // ─────────────────────────────────────────────────────────────────────────
    const foundCase = sqliteDb
      .select()
      .from(sqliteSchema.Cases)
      .where(and(eq(sqliteSchema.Cases.id, caseId), eq(sqliteSchema.Cases.user_id, 1)))
      .get();

    if (!foundCase) {
      return NextResponse.json(
        { success: false, error: "Case not found in demo sandbox" },
        { status: 404 }
      );
    }

    const timeline = sqliteDb
      .select()
      .from(sqliteSchema.CaseTimeline)
      .where(eq(sqliteSchema.CaseTimeline.case_id, caseId))
      .orderBy(desc(sqliteSchema.CaseTimeline.hearing_date), desc(sqliteSchema.CaseTimeline.id))
      .all();

    const documents = sqliteDb
      .select()
      .from(sqliteSchema.CaseDocuments)
      .where(eq(sqliteSchema.CaseDocuments.case_id, caseId))
      .orderBy(desc(sqliteSchema.CaseDocuments.created_at))
      .all();

    const assignments = sqliteDb
      .select({
        id: sqliteSchema.CaseAssignments.id,
        duty_date: sqliteSchema.CaseAssignments.duty_date,
        duty_type: sqliteSchema.CaseAssignments.duty_type,
        status: sqliteSchema.CaseAssignments.status,
        notes: sqliteSchema.CaseAssignments.notes,
        memberName: sqliteSchema.ChamberMembers.name,
        memberRole: sqliteSchema.ChamberMembers.role,
        memberPhone: sqliteSchema.ChamberMembers.phone,
      })
      .from(sqliteSchema.CaseAssignments)
      .leftJoin(sqliteSchema.ChamberMembers, eq(sqliteSchema.CaseAssignments.member_id, sqliteSchema.ChamberMembers.id))
      .where(eq(sqliteSchema.CaseAssignments.case_id, caseId))
      .orderBy(desc(sqliteSchema.CaseAssignments.duty_date))
      .all();

    return NextResponse.json({
      success: true,
      source: "demo_sandbox",
      case: foundCase,
      timeline,
      documents,
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
    const authUser = getAuthUser(request);
    const { id } = await params;
    const caseId = Number(id);
    const body = await request.json();

    // ─────────────────────────────────────────────────────────────────────────
    // 1. CLOUD POSTGRESQL (Authenticated Chamber)
    // ─────────────────────────────────────────────────────────────────────────
    if (authUser && authUser.chamberId && authUser.chamberId !== "demo-chamber-id") {
      const [existingCase] = await pgDb
        .select()
        .from(pgSchema.cases)
        .where(
          and(
            eq(pgSchema.cases.id, caseId),
            eq(pgSchema.cases.chamber_id, authUser.chamberId),
            eq(pgSchema.cases.is_deleted, false)
          )
        )
        .limit(1);

      if (!existingCase) {
        return NextResponse.json(
          { success: false, error: "Case not found or permission denied" },
          { status: 404 }
        );
      }

      const [updatedCase] = await pgDb
        .update(pgSchema.cases)
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
          updated_at: new Date(),
        })
        .where(
          and(
            eq(pgSchema.cases.id, caseId),
            eq(pgSchema.cases.chamber_id, authUser.chamberId)
          )
        )
        .returning();

      return NextResponse.json({
        success: true,
        source: "cloud_postgres",
        case: updatedCase,
        message: "Case successfully updated",
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. ISOLATED DEMO SANDBOX
    // ─────────────────────────────────────────────────────────────────────────
    const existingCase = sqliteDb
      .select()
      .from(sqliteSchema.Cases)
      .where(and(eq(sqliteSchema.Cases.id, caseId), eq(sqliteSchema.Cases.user_id, 1)))
      .get();

    if (!existingCase) {
      return NextResponse.json(
        { success: false, error: "Case not found in demo sandbox" },
        { status: 404 }
      );
    }

    const updatedCase = sqliteDb
      .update(sqliteSchema.Cases)
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
        updated_at: sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`,
      })
      .where(and(eq(sqliteSchema.Cases.id, caseId), eq(sqliteSchema.Cases.user_id, 1)))
      .returning()
      .get();

    return NextResponse.json({
      success: true,
      source: "demo_sandbox",
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
    const authUser = getAuthUser(request);
    const { id } = await params;
    const caseId = Number(id);

    // Permission Enforcement: Only Senior Advocates / Chamber Heads can delete cases
    if (authUser && !isSeniorAdvocate(authUser)) {
      return NextResponse.json(
        {
          success: false,
          error: "Permission Denied: Only Senior Advocates have permission to delete or archive chamber dossiers.",
        },
        { status: 403 }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. CLOUD POSTGRESQL (Authenticated Chamber)
    // ─────────────────────────────────────────────────────────────────────────
    if (authUser && authUser.chamberId && authUser.chamberId !== "demo-chamber-id") {
      await pgDb
        .update(pgSchema.cases)
        .set({ is_deleted: true, updated_at: new Date() })
        .where(
          and(
            eq(pgSchema.cases.id, caseId),
            eq(pgSchema.cases.chamber_id, authUser.chamberId)
          )
        );

      return NextResponse.json({
        success: true,
        source: "cloud_postgres",
        message: "Case removed from chamber diary",
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. ISOLATED DEMO SANDBOX
    // ─────────────────────────────────────────────────────────────────────────
    sqliteDb
      .delete(sqliteSchema.Cases)
      .where(and(eq(sqliteSchema.Cases.id, caseId), eq(sqliteSchema.Cases.user_id, 1)))
      .run();

    return NextResponse.json({
      success: true,
      source: "demo_sandbox",
      message: "Case removed from demo sandbox",
    });
  } catch (error: any) {
    console.error("Error deleting case:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete case" },
      { status: 500 }
    );
  }
}
