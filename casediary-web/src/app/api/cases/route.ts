import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pgDb } from "@/db/pgClient";
import * as pgSchema from "@/db/pgSchema";
import { db as sqliteDb } from "@/db";
import * as sqliteSchema from "@/db/schema";
import { and, desc, eq, isNull, or, sql, ilike, like } from "drizzle-orm";
import { getTodayDateString, getTomorrowDateString, getYesterdayDateString } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter");
    const search = searchParams.get("search")?.trim();
    const court = searchParams.get("court");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const todayStr = getTodayDateString();
    const tomorrowStr = getTomorrowDateString();
    const yesterdayStr = getYesterdayDateString();

    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    // ─────────────────────────────────────────────────────────────────────────────
    // 1. CLOUD POSTGRESQL (Authenticated Chamber - Full Data Protection & Scoping)
    // ─────────────────────────────────────────────────────────────────────────────
    if (authUser && authUser.chamberId && authUser.chamberId !== "demo-chamber-id") {
      const conditions: any[] = [
        eq(pgSchema.cases.chamber_id, authUser.chamberId),
        eq(pgSchema.cases.is_deleted, false),
      ];

      if (filter === "today") {
        conditions.push(eq(pgSchema.cases.NextDate, todayStr));
      } else if (filter === "tomorrow") {
        conditions.push(eq(pgSchema.cases.NextDate, tomorrowStr));
      } else if (filter === "yesterday") {
        conditions.push(
          and(
            sql`${pgSchema.cases.NextDate} <= ${yesterdayStr}`,
            sql`(${pgSchema.cases.CaseStatus} IS NULL OR ${pgSchema.cases.CaseStatus} != 'Disposed')`
          )
        );
      } else if (filter === "undated") {
        conditions.push(
          or(isNull(pgSchema.cases.NextDate), eq(pgSchema.cases.NextDate, ""))
        );
      } else if (filter === "active") {
        conditions.push(
          sql`(${pgSchema.cases.CaseStatus} IS NULL OR ${pgSchema.cases.CaseStatus} != 'Disposed')`
        );
      } else if (filter === "disposed") {
        conditions.push(eq(pgSchema.cases.CaseStatus, "Disposed"));
      }

      if (court) {
        conditions.push(ilike(pgSchema.cases.court_name, `%${court}%`));
      }
      if (status) {
        conditions.push(eq(pgSchema.cases.CaseStatus, status));
      }
      if (priority) {
        conditions.push(eq(pgSchema.cases.Priority, priority));
      }

      if (search) {
        const pattern = `%${search}%`;
        conditions.push(
          or(
            ilike(pgSchema.cases.CaseTitle, pattern),
            ilike(pgSchema.cases.ClientName, pattern),
            ilike(pgSchema.cases.CNRNumber, pattern),
            ilike(pgSchema.cases.case_number, pattern),
            ilike(pgSchema.cases.JudgeName, pattern),
            ilike(pgSchema.cases.OpposingCounsel, pattern),
            ilike(pgSchema.cases.Accussed, pattern),
            ilike(pgSchema.cases.FirstParty, pattern),
            ilike(pgSchema.cases.OppositeParty, pattern)
          )
        );
      }

      const whereClause = and(...conditions);

      const [countResult] = await pgDb
        .select({ count: sql<number>`count(*)::int` })
        .from(pgSchema.cases)
        .where(whereClause);

      const totalCount = Number(countResult?.count || 0);
      const isAll = limitParam === "all";
      const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
      const limit = isAll
        ? totalCount
        : limitParam
        ? Math.max(1, parseInt(limitParam, 10) || 25)
        : 25;
      const offset = isAll ? 0 : (page - 1) * limit;

      let query = pgDb
        .select()
        .from(pgSchema.cases)
        .where(whereClause)
        .orderBy(desc(pgSchema.cases.updated_at));

      if (!isAll) {
        query = query.limit(limit).offset(offset) as any;
      }

      const casesList = await query;

      return NextResponse.json({
        success: true,
        source: "cloud_postgres",
        chamberId: authUser.chamberId,
        count: totalCount,
        page: isAll ? 1 : page,
        limit: isAll ? totalCount : limit,
        totalPages: isAll ? 1 : Math.ceil(totalCount / limit) || 1,
        cases: casesList,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 2. ISOLATED DEMO SANDBOX (Demo Profiles / Unauthenticated Preview)
    // ─────────────────────────────────────────────────────────────────────────────
    const conditions: any[] = [
      eq(sqliteSchema.Cases.user_id, 1), // Strict isolation: only sandbox demo seed records
    ];

    if (filter === "today") {
      conditions.push(eq(sqliteSchema.Cases.NextDate, todayStr));
    } else if (filter === "tomorrow") {
      conditions.push(eq(sqliteSchema.Cases.NextDate, tomorrowStr));
    } else if (filter === "yesterday") {
      conditions.push(
        and(
          sql`${sqliteSchema.Cases.NextDate} <= ${yesterdayStr}`,
          sql`(${sqliteSchema.Cases.CaseStatus} IS NULL OR ${sqliteSchema.Cases.CaseStatus} != 'Disposed')`
        )
      );
    } else if (filter === "undated") {
      conditions.push(
        or(isNull(sqliteSchema.Cases.NextDate), eq(sqliteSchema.Cases.NextDate, ""))
      );
    } else if (filter === "active") {
      conditions.push(
        sql`(${sqliteSchema.Cases.CaseStatus} IS NULL OR ${sqliteSchema.Cases.CaseStatus} != 'Disposed')`
      );
    } else if (filter === "disposed") {
      conditions.push(eq(sqliteSchema.Cases.CaseStatus, "Disposed"));
    }

    if (court) {
      conditions.push(like(sqliteSchema.Cases.court_name, `%${court}%`));
    }
    if (status) {
      conditions.push(eq(sqliteSchema.Cases.CaseStatus, status));
    }
    if (priority) {
      conditions.push(eq(sqliteSchema.Cases.Priority, priority));
    }

    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          like(sqliteSchema.Cases.CaseTitle, pattern),
          like(sqliteSchema.Cases.ClientName, pattern),
          like(sqliteSchema.Cases.CNRNumber, pattern),
          like(sqliteSchema.Cases.case_number, pattern),
          like(sqliteSchema.Cases.JudgeName, pattern),
          like(sqliteSchema.Cases.OpposingCounsel, pattern),
          like(sqliteSchema.Cases.Accussed, pattern),
          like(sqliteSchema.Cases.FirstParty, pattern),
          like(sqliteSchema.Cases.OppositeParty, pattern)
        )
      );
    }

    const whereClause = and(...conditions);

    const totalCount =
      sqliteDb
        .select({ count: sql<number>`count(*)` })
        .from(sqliteSchema.Cases)
        .where(whereClause)
        .get()?.count || 0;

    const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
    const isAll = limitParam === "all";
    const limit = isAll
      ? totalCount
      : limitParam
      ? Math.max(1, parseInt(limitParam, 10) || 25)
      : 25;
    const offset = isAll ? 0 : (page - 1) * limit;

    let dbQuery = sqliteDb
      .select()
      .from(sqliteSchema.Cases)
      .where(whereClause)
      .orderBy(desc(sqliteSchema.Cases.updated_at));

    if (!isAll) {
      dbQuery = dbQuery.limit(limit).offset(offset) as any;
    }

    const casesList = dbQuery.all();

    return NextResponse.json({
      success: true,
      source: "demo_sandbox",
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
    const authUser = getAuthUser(request);
    const body = await request.json();

    const uniqueId =
      body.uniqueId ||
      `CASE-${Date.now().toString(36).toUpperCase()}-${Math.floor(
        Math.random() * 1000
      )}`;

    // ─────────────────────────────────────────────────────────────────────────────
    // 1. CLOUD POSTGRESQL (Authenticated Chamber)
    // ─────────────────────────────────────────────────────────────────────────────
    if (authUser && authUser.chamberId && authUser.chamberId !== "demo-chamber-id") {
      const [newCase] = await pgDb
        .insert(pgSchema.cases)
        .values({
          uniqueId,
          chamber_id: authUser.chamberId,
          user_id: authUser.userId,
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
          police_station_name: body.police_station_name || body.police_station_id || null,
          district_name: body.district_name || body.district_id || null,
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
          is_deleted: false,
        })
        .returning();

      // Timeline entry for filing or hearing
      if (newCase.NextDate || newCase.dateFiled) {
        await pgDb.insert(pgSchema.case_timeline).values({
          uniqueId: `timeline-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
          case_unique_id: newCase.uniqueId,
          hearing_date: newCase.NextDate || newCase.dateFiled || getTodayDateString(),
          notes: `Case registered in digital diary: ${newCase.case_stage || "Initial Filing"}`,
          event_type: "filing",
        });
      }

      return NextResponse.json({
        success: true,
        source: "cloud_postgres",
        case: newCase,
        message: "Case successfully added to your chamber diary",
      });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 2. ISOLATED DEMO SANDBOX (Demo Profiles)
    // ─────────────────────────────────────────────────────────────────────────────
    const newCase = sqliteDb
      .insert(sqliteSchema.Cases)
      .values({
        uniqueId,
        user_id: 1, // Demo user partition
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

    if (newCase.NextDate || newCase.dateFiled) {
      sqliteDb
        .insert(sqliteSchema.CaseTimeline)
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
      source: "demo_sandbox",
      case: newCase,
      message: "Case added to demo sandbox",
    });
  } catch (error: any) {
    console.error("Error creating case:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create case" },
      { status: 500 }
    );
  }
}
