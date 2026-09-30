import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { generateWhatsAppHearingUpdate } from "@/lib/whatsapp";
import { getTodayDateString } from "@/lib/utils";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const caseId = Number(id);

    const timeline = db
      .select()
      .from(schema.CaseTimeline)
      .where(eq(schema.CaseTimeline.case_id, caseId))
      .orderBy(desc(schema.CaseTimeline.hearing_date), desc(schema.CaseTimeline.id))
      .all();

    return NextResponse.json({ success: true, timeline });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const caseId = Number(id);
    const body = await request.json();

    const targetCase = db
      .select()
      .from(schema.Cases)
      .where(eq(schema.Cases.id, caseId))
      .get();

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

    // 1. Insert Timeline Entry
    const timelineEntry = db
      .insert(schema.CaseTimeline)
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

    // 2. Advance Case Dates & Financials
    const newFeePaid = (targetCase.fee_paid || 0) + amount;
    const newDateFeeCollected = (targetCase.date_fee_collected || 0) + amount;

    const updatedCase = db
      .update(schema.Cases)
      .set({
        PreviousDate: hearingDate,
        NextDate: nextDate,
        case_stage: stage,
        fee_paid: newFeePaid,
        date_fee_collected: newDateFeeCollected,
        updated_at: sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`,
      })
      .where(eq(schema.Cases.id, caseId))
      .returning()
      .get();

    // 3. Generate WhatsApp Hearing Update
    const lawyerProfile = db.select().from(schema.LawyerProfiles).get();
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
