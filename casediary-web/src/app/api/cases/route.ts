import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { and, desc, eq, isNull, or, sql, like } from "drizzle-orm";
import { getTodayDateString, getTomorrowDateString, getYesterdayDateString } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter");
    const search = searchParams.get("search")?.trim();
    const court = searchParams.get("court");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const todayStr = getTodayDateString();
    const tomorrowStr = getTomorrowDateString();
    const yesterdayStr = getYesterdayDateString();

    let conditions = [];

    if (filter === "today") {
      conditions.push(eq(schema.Cases.NextDate, todayStr));
    } else if (filter === "tomorrow") {
      conditions.push(eq(schema.Cases.NextDate, tomorrowStr));
    } else if (filter === "yesterday") {
      // Cases whose hearing was yesterday or earlier but still has NextDate in the past and not disposed
      conditions.push(
        and(
          sql`${schema.Cases.NextDate} <= ${yesterdayStr}`,
          sql`(${schema.Cases.CaseStatus} IS NULL OR ${schema.Cases.CaseStatus} != 'Disposed')`
        )
      );
    } else if (filter === "undated") {
      conditions.push(
        or(isNull(schema.Cases.NextDate), eq(schema.Cases.NextDate, ""))
      );
    } else if (filter === "active") {
      conditions.push(sql`(${schema.Cases.CaseStatus} IS NULL OR ${schema.Cases.CaseStatus} != 'Disposed')`);
    } else if (filter === "disposed") {
      conditions.push(eq(schema.Cases.CaseStatus, "Disposed"));
    }

    if (court) {
      conditions.push(like(schema.Cases.court_name, `%${court}%`));
    }
    if (status) {
      conditions.push(eq(schema.Cases.CaseStatus, status));
    }
    if (priority) {
      conditions.push(eq(schema.Cases.Priority, priority));
    }

    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          like(schema.Cases.CaseTitle, searchPattern),
          like(schema.Cases.ClientName, searchPattern),
          like(schema.Cases.CNRNumber, searchPattern),
          like(schema.Cases.case_number, searchPattern),
          like(schema.Cases.JudgeName, searchPattern),
          like(schema.Cases.OpposingCounsel, searchPattern),
          like(schema.Cases.Accussed, searchPattern),
          like(schema.Cases.FirstParty, searchPattern),
          like(schema.Cases.OppositeParty, searchPattern)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Calculate total count matching filters
    const totalCount =
      db
        .select({ count: sql<number>`count(*)` })
        .from(schema.Cases)
        .where(whereClause)
        .get()?.count || 0;

    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
    const isAll = limitParam === "all";
    const limit = isAll ? totalCount : (limitParam ? Math.max(1, parseInt(limitParam, 10) || 25) : 25);
    const offset = isAll ? 0 : (page - 1) * limit;

    let dbQuery = db
      .select()
      .from(schema.Cases)
      .where(whereClause)
      .orderBy(desc(schema.Cases.updated_at));

    if (!isAll) {
      dbQuery = dbQuery.limit(limit).offset(offset) as any;
    }

    const casesList = dbQuery.all();

    return NextResponse.json({
      success: true,
      count: totalCount,
      page: isAll ? 1 : page,
      limit: isAll ? totalCount : limit,
      totalPages: isAll ? 1 : Math.ceil(totalCount / limit) || 1,
      cases: casesList,
    });
  } catch (error: any) {
    console.error("Error fetching cases:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch cases" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const uniqueId =
      body.uniqueId ||
      `CASE-${Date.now().toString(36).toUpperCase()}-${Math.floor(
        Math.random() * 1000
      )}`;

    const newCase = db
      .insert(schema.Cases)
      .values({
        uniqueId,
        user_id: body.user_id || 1,
        CaseTitle: body.CaseTitle || "Untitled Matter",
        ClientName: body.ClientName || "",
        OnBehalfOf: body.OnBehalfOf || "Petitioner",
        CNRNumber: body.CNRNumber || "",
        case_number: body.case_number || "",
        case_year: body.case_year ? Number(body.case_year) : new Date().getFullYear(),
        session_trial_number: body.session_trial_number || "",
        court_name: body.court_name || "",
        case_type_name: body.case_type_name || "General Litigation",
        dateFiled: body.dateFiled || getTodayDateString(),
        NextDate: body.NextDate || null,
        PreviousDate: body.PreviousDate || null,
        StatuteOfLimitations: body.StatuteOfLimitations || null,
        crime_number: body.crime_number || "",
        crime_year: body.crime_year ? Number(body.crime_year) : null,
        police_station_id: body.police_station_id || null,
        district_id: body.district_id || null,
        Undersection: body.Undersection || "",
        FirstParty: body.FirstParty || "",
        OppositeParty: body.OppositeParty || "",
        Accussed: body.Accussed || "",
        ClientContactNumber: body.ClientContactNumber || "",
        JudgeName: body.JudgeName || "",
        OpposingCounsel: body.OpposingCounsel || "",
        OppositeAdvocate: body.OppositeAdvocate || "",
        OppAdvocateContactNumber: body.OppAdvocateContactNumber || "",
        CaseStatus: body.CaseStatus || "Open",
        Priority: body.Priority || "Medium",
        case_stage: body.case_stage || "Filing / Initial Scrutiny",
        total_fee: body.total_fee ? Number(body.total_fee) : 0,
        fee_paid: body.fee_paid ? Number(body.fee_paid) : 0,
        date_fee: body.date_fee ? Number(body.date_fee) : 0,
        date_fee_collected: body.date_fee_collected ? Number(body.date_fee_collected) : 0,
        CaseDescription: body.CaseDescription || "",
        CaseNotes: body.CaseNotes || "",
      })
      .returning()
      .get();

    // If initial NextDate or filing date is specified, insert initial timeline item
    if (newCase.NextDate || newCase.dateFiled) {
      db.insert(schema.CaseTimeline)
        .values({
          case_id: newCase.id,
          hearing_date: newCase.NextDate || newCase.dateFiled || getTodayDateString(),
          notes: `Case registered in digital diary: ${newCase.case_stage || "Initial Filing"}`,
          event_type: "filing",
        })
        .run();
    }

    return NextResponse.json({
      success: true,
      case: newCase,
      message: "Case successfully added to diary",
    });
  } catch (error: any) {
    console.error("Error creating case:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create case" },
      { status: 500 }
    );
  }
}
