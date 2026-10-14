import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pgDb } from "@/db/pgClient";
import * as pgSchema from "@/db/pgSchema";
import { db as sqliteDb } from "@/db";
import * as sqliteSchema from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { generateWhatsAppHearingUpdate } from "@/lib/whatsapp";
import { getTodayDateString } from "@/lib/utils";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const authUser = getAuthUser(request);
    const { id } = await params;
    const caseId = Number(id);

    // ─────────────────────────────────────────────────────────────────────────
    // 1. CLOUD POSTGRESQL (Authenticated Chamber)
    // ─────────────────────────────────────────────────────────────────────────
    if (authUser && authUser.chamberId && authUser.chamberId !== "demo-chamber-id") {
      const [targetCase] = await pgDb
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

      if (!targetCase) {
        return NextResponse.json(
          { success: false, error: "Case not found" },
          { status: 404 }
        );
      }

      const timeline = await pgDb
        .select()
        .from(pgSchema.case_timeline)
        .where(
          and(
            eq(pgSchema.case_timeline.case_unique_id, targetCase.uniqueId),
            eq(pgSchema.case_timeline.is_deleted, false)
          )
        )
        .orderBy(
          desc(pgSchema.case_timeline.hearing_date),
          desc(pgSchema.case_timeline.id)
        );

      return NextResponse.json({ success: true, source: "cloud_postgres", timeline });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. ISOLATED DEMO SANDBOX
    // ─────────────────────────────────────────────────────────────────────────
    const timeline = sqliteDb
      .select()
      .from(sqliteSchema.CaseTimeline)
      .where(eq(sqliteSchema.CaseTimeline.case_id, caseId))
      .orderBy(desc(sqliteSchema.CaseTimeline.hearing_date), desc(sqliteSchema.CaseTimeline.id))
      .all();

    return NextResponse.json({ success: true, source: "demo_sandbox", timeline });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const authUser = getAuthUser(request);
    const { id } = await params;
    const caseId = Number(id);
    const body = await request.json();

    // ─────────────────────────────────────────────────────────────────────────
    // 1. CLOUD POSTGRESQL (Authenticated Chamber)
    // ─────────────────────────────────────────────────────────────────────────
    if (authUser && authUser.chamberId && authUser.chamberId !== "demo-chamber-id") {
      const [targetCase] = await pgDb
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

      if (!targetCase) {
        return NextResponse.json(
          { success: false, error: "Case not found" },
          { status: 404 }
        );
      }

      const hearingDate = body.hearingDate || targetCase.NextDate || getTodayDateString();
      const nextDate = body.nextDate || null;
      const notes = body.notes || "Hearing conducted";
      const stage = body.stage || targetCase.case_stage;
      const amount = body.amount ? Number(body.amount) : 0;
      const payment_mode = body.payment_mode || null;
      const event_type = body.event_type || "hearing";

      const [timelineEntry] = await pgDb
        .insert(pgSchema.case_timeline)
        .values({
          uniqueId: `timeline-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
          case_unique_id: targetCase.uniqueId,
          hearing_date: hearingDate,
          notes,
          event_type,
          amount: amount > 0 ? amount : null,
          payment_mode,
        })
        .returning();

      const newFeePaid = (targetCase.fee_paid || 0) + amount;
      const newDateFeeCollected = (targetCase.date_fee_collected || 0) + amount;

      const [updatedCase] = await pgDb
        .update(pgSchema.cases)
        .set({
          PreviousDate: hearingDate,
          NextDate: nextDate,
          case_stage: stage,
          fee_paid: newFeePaid,
          date_fee_collected: newDateFeeCollected,
          updated_at: new Date(),
        })
        .where(eq(pgSchema.cases.id, caseId))
        .returning();

      const advocateName = authUser.name || "Advocate";

      const whatsappMessage = generateWhatsAppHearingUpdate({
        clientName: targetCase.ClientName,
        caseTitle: targetCase.CaseTitle,
        caseNumber: targetCase.case_number,
        cnrNumber: targetCase.CNRNumber,
        courtName: targetCase.court_name,
        judgeName: targetCase.JudgeName,
        nextDate: nextDate || "To be notified",
        stage,
        notes,
        advocateName,
        phone: targetCase.ClientContactNumber,
      });

      return NextResponse.json({
        success: true,
        source: "cloud_postgres",
        case: updatedCase,
        timelineEntry,
        whatsappMessage,
        whatsappUrl: targetCase.ClientContactNumber
          ? `https://api.whatsapp.com/send?phone=${targetCase.ClientContactNumber.replace(/[^0-9]/g, "")}&text=${encodeURIComponent(whatsappMessage)}`
          : null,
        message: "Hearing update recorded successfully",
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. ISOLATED DEMO SANDBOX
    // ─────────────────────────────────────────────────────────────────────────
    const targetCase = sqliteDb
      .select()
      .from(sqliteSchema.Cases)
      .where(and(eq(sqliteSchema.Cases.id, caseId), eq(sqliteSchema.Cases.user_id, 1)))
      .get();

    if (!targetCase) {
      return NextResponse.json(
        { success: false, error: "Case not found in demo sandbox" },
        { status: 404 }
      );
    }

    const hearingDate = body.hearingDate || targetCase.NextDate || getTodayDateString();
    const nextDate = body.nextDate || null;
    const notes = body.notes || "Hearing conducted";
    const stage = body.stage || targetCase.case_stage;
    const amount = body.amount ? Number(body.amount) : 0;
    const payment_mode = body.payment_mode || null;
    const event_type = body.event_type || "hearing";

    const timelineEntry = sqliteDb
      .insert(sqliteSchema.CaseTimeline)
      .values({
        case_id: caseId,
        hearing_date: hearingDate,
        notes,
        event_type,
        amount: amount > 0 ? amount : null,
        payment_mode,
      })
      .returning()
      .get();

    const newFeePaid = (targetCase.fee_paid || 0) + amount;
    const newDateFeeCollected = (targetCase.date_fee_collected || 0) + amount;

    const updatedCase = sqliteDb
      .update(sqliteSchema.Cases)
      .set({
        PreviousDate: hearingDate,
        NextDate: nextDate,
        case_stage: stage,
        fee_paid: newFeePaid,
        date_fee_collected: newDateFeeCollected,
        updated_at: sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`,
      })
      .where(eq(sqliteSchema.Cases.id, caseId))
      .returning()
      .get();

    const lawyerProfile = sqliteDb.select().from(sqliteSchema.LawyerProfiles).get();
    const advocateName = lawyerProfile?.name || "Adv. Rajesh Sharma";

    const whatsappMessage = generateWhatsAppHearingUpdate({
      clientName: targetCase.ClientName,
      caseTitle: targetCase.CaseTitle,
      caseNumber: targetCase.case_number,
      cnrNumber: targetCase.CNRNumber,
      courtName: targetCase.court_name,
      judgeName: targetCase.JudgeName,
      nextDate: nextDate || "To be notified",
      stage,
      notes,
      advocateName,
      phone: targetCase.ClientContactNumber,
    });

    return NextResponse.json({
      success: true,
      source: "demo_sandbox",
      case: updatedCase,
      timelineEntry,
      whatsappMessage,
      whatsappUrl: targetCase.ClientContactNumber
        ? `https://api.whatsapp.com/send?phone=${targetCase.ClientContactNumber.replace(/[^0-9]/g, "")}&text=${encodeURIComponent(whatsappMessage)}`
        : null,
      message: "Hearing update recorded successfully",
    });
  } catch (error: any) {
    console.error("Error recording hearing update:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record hearing" },
      { status: 500 }
    );
  }
}
