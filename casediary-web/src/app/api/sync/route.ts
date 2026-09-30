import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const cases = db.select().from(schema.Cases).orderBy(desc(schema.Cases.id)).all();
    const timeline = db.select().from(schema.CaseTimeline).all();
    const lawyer = db.select().from(schema.LawyerProfiles).get();
    const drafts = db.select().from(schema.DocumentDrafts).all();

    const backupPayload = {
      exportVersion: "2.0",
      app: "Advocase CaseDiary",
      exportedAt: new Date().toISOString(),
      lawyer,
      cases,
      timeline,
      drafts,
    };

    return NextResponse.json({
      success: true,
      backup: backupPayload,
    });
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let importedCount = 0;

    // Handle full CaseDiary backup payload
    if (body.cases && Array.isArray(body.cases)) {
      for (const item of body.cases) {
        const uniqueId = item.uniqueId || `CASE-IMP-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
        
        // Upsert or insert case
        const existing = item.uniqueId
          ? db.select().from(schema.Cases).where(eq(schema.Cases.uniqueId, item.uniqueId)).get()
          : null;

        if (!existing) {
          db.insert(schema.Cases).values({
            uniqueId,
            user_id: item.user_id || 1,
            CaseTitle: item.CaseTitle || "Imported Matter",
            ClientName: item.ClientName || "",
            OnBehalfOf: item.OnBehalfOf || "Petitioner",
            CNRNumber: item.CNRNumber || "",
            case_number: item.case_number || "",
            case_year: item.case_year ? Number(item.case_year) : new Date().getFullYear(),
            court_name: item.court_name || "",
            case_type_name: item.case_type_name || "General",
            dateFiled: item.dateFiled || null,
            NextDate: item.NextDate || null,
            PreviousDate: item.PreviousDate || null,
            crime_number: item.crime_number || "",
            Undersection: item.Undersection || "",
            FirstParty: item.FirstParty || "",
            OppositeParty: item.OppositeParty || "",
            Accussed: item.Accussed || "",
            ClientContactNumber: item.ClientContactNumber || "",
            JudgeName: item.JudgeName || "",
            OpposingCounsel: item.OpposingCounsel || "",
            CaseStatus: item.CaseStatus || "Open",
            Priority: item.Priority || "Medium",
            case_stage: item.case_stage || "Hearing",
            total_fee: item.total_fee ? Number(item.total_fee) : 0,
            fee_paid: item.fee_paid ? Number(item.fee_paid) : 0,
            CaseDescription: item.CaseDescription || "",
            CaseNotes: item.CaseNotes || "",
          }).run();
          importedCount++;
        }
      }
    } else if (Array.isArray(body)) {
      // Handle mobile simple JSON / eCourts array format
      for (const item of body) {
        const title = item.case_title || item.CaseTitle || "Untitled Case";
        const client = item.client || item.ClientName || "";
        const phone = item.phone || item.ClientContactNumber || "";
        const cnr = item.cnr_no || item.CNRNumber || "";
        const caseNumber = item.case_number || "";
        const year = item.year ? Number(item.year) : new Date().getFullYear();
        const court = item.court || item.court_name || "";
        const type = item.type || item.case_type_name || "General";
        const nextDate = item.next_date || item.NextDate || null;
        const section = item.section || item.Undersection || "";
        const notes = item.notes || item.CaseNotes || "";

        const uniqueId = `CASE-SYNC-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;

        db.insert(schema.Cases).values({
          uniqueId,
          user_id: 1,
          CaseTitle: title,
          ClientName: client,
          ClientContactNumber: phone,
          CNRNumber: cnr,
          case_number: caseNumber,
          case_year: year,
          court_name: court,
          case_type_name: type,
          NextDate: nextDate,
          Undersection: section,
          CaseNotes: notes,
          CaseStatus: "Open",
          Priority: "Medium",
          case_stage: "Notice / Scrutiny",
        }).run();

        importedCount++;
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid sync/import payload format" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      importedCount,
      message: `Successfully synchronized ${importedCount} matters into the online diary`,
    });
  } catch (error: any) {
    console.error("Sync import error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
