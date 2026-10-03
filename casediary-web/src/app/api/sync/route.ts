import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { desc, eq, or, and } from "drizzle-orm";

export async function GET() {
  try {
    const cases = db.select().from(schema.Cases).orderBy(desc(schema.Cases.id)).all();
    const timeline = db.select().from(schema.CaseTimeline).all();
    const lawyer = db.select().from(schema.LawyerProfiles).get();
    const drafts = db.select().from(schema.DocumentDrafts).all();
    const team = db.select().from(schema.ChamberMembers).all();

    const backupPayload = {
      exportVersion: "2.0",
      app: "Advocase CaseDiary",
      exportedAt: new Date().toISOString(),
      lawyer,
      cases,
      timeline,
      drafts,
      team,
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
    let updatedCount = 0;

    // 1. Handle full CaseDiary backup payload (from mobile SQLite / JSON export)
    if (body.cases && Array.isArray(body.cases)) {
      for (const item of body.cases) {
        const uniqueId = item.uniqueId || `CASE-IMP-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
        
        // Find existing case by uniqueId or CNRNumber or (case_number AND court_name)
        let existing: any = null;
        if (item.uniqueId) {
          existing = db.select().from(schema.Cases).where(eq(schema.Cases.uniqueId, item.uniqueId)).get();
        }
        if (!existing && item.CNRNumber && item.CNRNumber.trim() !== "" && item.CNRNumber !== "N/A") {
          existing = db.select().from(schema.Cases).where(eq(schema.Cases.CNRNumber, item.CNRNumber.trim())).get();
        }
        if (!existing && item.case_number && item.court_name) {
          existing = db
            .select()
            .from(schema.Cases)
            .where(
              and(
                eq(schema.Cases.case_number, item.case_number.trim()),
                eq(schema.Cases.court_name, item.court_name.trim())
              )
            )
            .get();
        }

        if (existing) {
          // Zero data loss: Update fields if incoming has updated values
          db.update(schema.Cases)
            .set({
              NextDate: item.NextDate || existing.NextDate,
              PreviousDate: item.PreviousDate || existing.PreviousDate,
              CaseStatus: item.CaseStatus || existing.CaseStatus,
              Priority: item.Priority || existing.Priority,
              case_stage: item.case_stage || existing.case_stage,
              CaseNotes: item.CaseNotes || existing.CaseNotes,
              fee_paid: item.fee_paid !== undefined ? Number(item.fee_paid) : existing.fee_paid,
              total_fee: item.total_fee !== undefined ? Number(item.total_fee) : existing.total_fee,
              JudgeName: item.JudgeName || existing.JudgeName,
              OpposingCounsel: item.OpposingCounsel || existing.OpposingCounsel,
              updated_at: new Date().toISOString(),
            })
            .where(eq(schema.Cases.id, existing.id))
            .run();
          updatedCount++;
        } else {
          // Insert new matter
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

      // 2. Sync timeline entries if provided
      if (body.timeline && Array.isArray(body.timeline)) {
        for (const t of body.timeline) {
          if (t.case_id && t.hearing_date) {
            const existingTimeline = db
              .select()
              .from(schema.CaseTimeline)
              .where(
                and(
                  eq(schema.CaseTimeline.case_id, t.case_id),
                  eq(schema.CaseTimeline.hearing_date, t.hearing_date)
                )
              )
              .get();
            if (!existingTimeline) {
              db.insert(schema.CaseTimeline).values({
                case_id: t.case_id,
                hearing_date: t.hearing_date,
                notes: t.notes || "",
                event_type: t.event_type || "hearing",
                amount: t.amount ? Number(t.amount) : null,
                payment_mode: t.payment_mode || null,
              }).run();
            }
          }
        }
      }

      // 3. Sync drafts if provided
      if (body.drafts && Array.isArray(body.drafts)) {
        for (const d of body.drafts) {
          if (d.id && d.title) {
            const existingDraft = db
              .select()
              .from(schema.DocumentDrafts)
              .where(eq(schema.DocumentDrafts.id, d.id))
              .get();
            if (!existingDraft) {
              db.insert(schema.DocumentDrafts).values({
                id: d.id,
                user_id: 1,
                title: d.title,
                template_type: d.template_type || "general",
                template_category: d.template_category || "general",
                template_description: d.template_description || "",
                html_content: d.html_content || "",
                case_title: d.case_title || null,
                client_name: d.client_name || null,
                case_number: d.case_number || null,
                created_at: d.created_at || new Date().toISOString(),
                updated_at: d.updated_at || new Date().toISOString(),
              }).run();
            }
          }
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

        let existing: any = null;
        if (cnr && cnr.trim() !== "" && cnr !== "N/A") {
          existing = db.select().from(schema.Cases).where(eq(schema.Cases.CNRNumber, cnr.trim())).get();
        }

        if (existing) {
          db.update(schema.Cases)
            .set({
              NextDate: nextDate || existing.NextDate,
              CaseNotes: notes || existing.CaseNotes,
              updated_at: new Date().toISOString(),
            })
            .where(eq(schema.Cases.id, existing.id))
            .run();
          updatedCount++;
        } else {
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
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid sync/import payload format" },
        { status: 400 }
      );
    }

    const totalCases = db.select().from(schema.Cases).all().length;

    return NextResponse.json({
      success: true,
      importedCount,
      updatedCount,
      totalCases,
      syncedAt: new Date().toISOString(),
      message: `Sync complete: ${importedCount} new matters imported, ${updatedCount} existing matters updated without data loss. Total chamber cases: ${totalCases}`,
    });
  } catch (error: any) {
    console.error("Sync import error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
