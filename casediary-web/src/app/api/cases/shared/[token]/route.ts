import { NextRequest, NextResponse } from "next/server";
import { pgDb } from "@/db/pgClient";
import * as schema from "@/db/pgSchema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Share token is required." },
        { status: 400 }
      );
    }

    // 1. Verify share token
    const shares = await pgDb
      .select({
        id: schema.case_shares.id,
        caseId: schema.case_shares.case_id,
        caseUniqueId: schema.case_shares.case_unique_id,
        chamberId: schema.case_shares.chamber_id,
        accessLevel: schema.case_shares.access_level,
        expiresAt: schema.case_shares.expires_at,
        isActive: schema.case_shares.is_active,
        sharedWithCounselName: schema.case_shares.shared_with_counsel_name,
        sharedByUserName: schema.users.name,
        chamberName: schema.chambers.name,
      })
      .from(schema.case_shares)
      .innerJoin(schema.chambers, eq(schema.case_shares.chamber_id, schema.chambers.id))
      .innerJoin(schema.users, eq(schema.case_shares.shared_by_user_id, schema.users.id))
      .where(eq(schema.case_shares.share_token, token))
      .limit(1);

    if (shares.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid matter brief link or link does not exist." },
        { status: 404 }
      );
    }

    const share = shares[0];

    if (!share.isActive) {
      return NextResponse.json(
        { success: false, error: "Access to this matter brief has been revoked by the advocate." },
        { status: 403 }
      );
    }

    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: "This matter brief link has expired." },
        { status: 410 }
      );
    }

    // 2. Query the single case (Strict isolation: no fee/billing data returned!)
    const caseList = await pgDb
      .select({
        id: schema.cases.id,
        uniqueId: schema.cases.uniqueId,
        CaseTitle: schema.cases.CaseTitle,
        ClientName: schema.cases.ClientName,
        OnBehalfOf: schema.cases.OnBehalfOf,
        CNRNumber: schema.cases.CNRNumber,
        case_number: schema.cases.case_number,
        case_year: schema.cases.case_year,
        court_name: schema.cases.court_name,
        case_type_name: schema.cases.case_type_name,
        JudgeName: schema.cases.JudgeName,
        CaseStage: schema.cases.case_stage,
        CaseStatus: schema.cases.CaseStatus,
        Priority: schema.cases.Priority,
        NextDate: schema.cases.NextDate,
        PreviousDate: schema.cases.PreviousDate,
        dateFiled: schema.cases.dateFiled,
        crime_number: schema.cases.crime_number,
        crime_year: schema.cases.crime_year,
        police_station_name: schema.cases.police_station_name,
        district_name: schema.cases.district_name,
        Undersection: schema.cases.Undersection,
        FirstParty: schema.cases.FirstParty,
        OppositeParty: schema.cases.OppositeParty,
        OppositeAdvocate: schema.cases.OppositeAdvocate,
        CaseNotes: schema.cases.CaseNotes,
        updated_at: schema.cases.updated_at,
      })
      .from(schema.cases)
      .where(eq(schema.cases.id, share.caseId))
      .limit(1);

    if (caseList.length === 0) {
      return NextResponse.json(
        { success: false, error: "Matter dossier could not be retrieved." },
        { status: 404 }
      );
    }

    const matter = caseList[0];

    // 3. Query Timeline (Exclude fee records from external counsel)
    const rawTimeline = await pgDb
      .select({
        id: schema.case_timeline.id,
        hearing_date: schema.case_timeline.hearing_date,
        notes: schema.case_timeline.notes,
        event_type: schema.case_timeline.event_type,
        created_at: schema.case_timeline.created_at,
      })
      .from(schema.case_timeline)
      .where(
        and(
          eq(schema.case_timeline.case_unique_id, matter.uniqueId),
          eq(schema.case_timeline.is_deleted, false)
        )
      )
      .orderBy(desc(schema.case_timeline.hearing_date));

    // Filter out fee events for strict privacy
    const timeline = rawTimeline.filter((t) => t.event_type !== "fee");

    // 4. Query Documents
    const documents = await pgDb
      .select({
        id: schema.case_documents.id,
        stored_filename: schema.case_documents.stored_filename,
        original_display_name: schema.case_documents.original_display_name,
        file_type: schema.case_documents.file_type,
        file_size: schema.case_documents.file_size,
        file_url: schema.case_documents.file_url,
        category: schema.case_documents.category,
        created_at: schema.case_documents.created_at,
      })
      .from(schema.case_documents)
      .where(
        and(
          eq(schema.case_documents.case_unique_id, matter.uniqueId),
          eq(schema.case_documents.is_deleted, false)
        )
      )
      .orderBy(desc(schema.case_documents.created_at));

    // 5. Query Drafts / Pleadings
    const drafts = await pgDb
      .select({
        id: schema.document_drafts.id,
        title: schema.document_drafts.title,
        template_type: schema.document_drafts.template_type,
        template_category: schema.document_drafts.template_category,
        html_content: schema.document_drafts.html_content,
        created_at: schema.document_drafts.created_at,
        updated_at: schema.document_drafts.updated_at,
      })
      .from(schema.document_drafts)
      .where(eq(schema.document_drafts.case_unique_id, matter.uniqueId))
      .orderBy(desc(schema.document_drafts.updated_at));

    return NextResponse.json({
      success: true,
      matter,
      timeline,
      documents,
      drafts,
      share: {
        accessLevel: share.accessLevel,
        sharedByUserName: share.sharedByUserName,
        chamberName: share.chamberName,
        sharedWithCounselName: share.sharedWithCounselName,
        expiresAt: share.expiresAt,
      },
    });
  } catch (error: any) {
    console.error("Fetch Shared Case Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve shared matter brief." },
      { status: 500 }
    );
  }
}
