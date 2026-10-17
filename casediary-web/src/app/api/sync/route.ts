import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pgDb } from "@/db/pgClient";
import * as pgSchema from "@/db/pgSchema";
import { eq, and, gt, desc } from "drizzle-orm";
import { db as sqliteDb } from "@/db";
import * as sqliteSchema from "@/db/schema";

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Authentication token required for sync." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const since = searchParams.get("since"); // ISO date string

    // 1. CLOUD SYNC (PostgreSQL in Docker for Authenticated Advocates)
    if (authUser.chamberId && authUser.chamberId !== "demo-chamber-id") {
      const conditions: any[] = [
        eq(pgSchema.cases.chamber_id, authUser.chamberId),
      ];
      if (since) {
        conditions.push(gt(pgSchema.cases.updated_at, new Date(since)));
      }

      const cloudCases = await pgDb
        .select()
        .from(pgSchema.cases)
        .where(and(...conditions))
        .orderBy(desc(pgSchema.cases.id));

      // Strictly isolate timeline records to cases belonging to this chamber
      const cloudTimeline = await pgDb
        .select({
          id: pgSchema.case_timeline.id,
          uniqueId: pgSchema.case_timeline.uniqueId,
          case_unique_id: pgSchema.case_timeline.case_unique_id,
          hearing_date: pgSchema.case_timeline.hearing_date,
          notes: pgSchema.case_timeline.notes,
          event_type: pgSchema.case_timeline.event_type,
          amount: pgSchema.case_timeline.amount,
          payment_mode: pgSchema.case_timeline.payment_mode,
          created_at: pgSchema.case_timeline.created_at,
        })
        .from(pgSchema.case_timeline)
        .innerJoin(
          pgSchema.cases,
          eq(pgSchema.case_timeline.case_unique_id, pgSchema.cases.uniqueId)
        )
        .where(
          and(
            eq(pgSchema.cases.chamber_id, authUser.chamberId),
            eq(pgSchema.case_timeline.is_deleted, false)
          )
        )
        .orderBy(desc(pgSchema.case_timeline.id));

      const cloudDrafts = await pgDb
        .select()
        .from(pgSchema.document_drafts)
        .where(eq(pgSchema.document_drafts.chamber_id, authUser.chamberId));

      return NextResponse.json({
        success: true,
        source: "cloud_postgres",
        chamberId: authUser.chamberId,
        syncedAt: new Date().toISOString(),
        cases: cloudCases,
        timeline: cloudTimeline,
        drafts: cloudDrafts,
      });
    }

    // 2. ISOLATED DEMO SANDBOX (Demo Profiles Only)
    const cases = sqliteDb
      .select()
      .from(sqliteSchema.Cases)
      .where(eq(sqliteSchema.Cases.user_id, 1))
      .orderBy(desc(sqliteSchema.Cases.id))
      .all();
    const timeline = sqliteDb.select().from(sqliteSchema.CaseTimeline).all();
    const drafts = sqliteDb
      .select()
      .from(sqliteSchema.DocumentDrafts)
      .where(eq(sqliteSchema.DocumentDrafts.chamber_id, "demo-chamber-id"))
      .all();

    return NextResponse.json({
      success: true,
      source: "demo_sandbox",
      syncedAt: new Date().toISOString(),
      cases,
      timeline,
      drafts,
    });
  } catch (error: any) {
    console.error("Sync GET Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Authentication token required for sync." },
        { status: 401 }
      );
    }

    const body = await req.json();

    let insertedCount = 0;
    let updatedCount = 0;

    // 1. CLOUD SYNC (PostgreSQL in Docker for Authenticated Chambers)
    if (authUser.chamberId && authUser.chamberId !== "demo-chamber-id") {
      if (body.cases && Array.isArray(body.cases)) {
        for (const item of body.cases) {
          const uniqueId =
            item.uniqueId ||
            `CASE-${Date.now().toString(36)}-${Math.floor(
              Math.random() * 1000
            )}`;

          // Check if case already exists in PostgreSQL specifically within this chamber
          const existing = await pgDb
            .select()
            .from(pgSchema.cases)
            .where(
              and(
                eq(pgSchema.cases.uniqueId, uniqueId),
                eq(pgSchema.cases.chamber_id, authUser.chamberId)
              )
            )
            .limit(1);

          if (existing.length > 0) {
            // Update existing case strictly within the user's chamber
            await pgDb
              .update(pgSchema.cases)
              .set({
                CaseTitle: item.CaseTitle || existing[0].CaseTitle,
                ClientName: item.ClientName || existing[0].ClientName,
                court_name: item.court_name || existing[0].court_name,
                NextDate: item.NextDate || existing[0].NextDate,
                PreviousDate: item.PreviousDate || existing[0].PreviousDate,
                CaseStatus: item.CaseStatus || existing[0].CaseStatus,
                Priority: item.Priority || existing[0].Priority,
                case_stage: item.case_stage || existing[0].case_stage,
                CaseNotes: item.CaseNotes || existing[0].CaseNotes,
                fee_paid:
                  item.fee_paid !== undefined
                    ? Number(item.fee_paid)
                    : existing[0].fee_paid,
                total_fee:
                  item.total_fee !== undefined
                    ? Number(item.total_fee)
                    : existing[0].total_fee,
                updated_at: new Date(),
              })
              .where(
                and(
                  eq(pgSchema.cases.uniqueId, uniqueId),
                  eq(pgSchema.cases.chamber_id, authUser.chamberId)
                )
              );
            updatedCount++;
          } else {
            // Insert new case into PostgreSQL scoped to this chamber
            await pgDb.insert(pgSchema.cases).values({
              uniqueId,
              chamber_id: authUser.chamberId,
              user_id: authUser.userId,
              CaseTitle: item.CaseTitle || "Imported Matter",
              ClientName: item.ClientName || "",
              OnBehalfOf: item.OnBehalfOf || "Petitioner",
              CNRNumber: item.CNRNumber || "",
              case_number: item.case_number || "",
              case_year: item.case_year
                ? Number(item.case_year)
                : new Date().getFullYear(),
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
            });
            insertedCount++;
          }
        }
      }

      return NextResponse.json({
        success: true,
        source: "cloud_postgres",
        insertedCount,
        updatedCount,
        message: `Cloud sync complete. ${insertedCount} inserted, ${updatedCount} updated.`,
      });
    }

    // 2. ISOLATED DEMO SANDBOX (Demo Profiles Only)
    if (body.cases && Array.isArray(body.cases)) {
      for (const item of body.cases) {
        const uniqueId =
          item.uniqueId ||
          `CASE-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
        const existing = sqliteDb
          .select()
          .from(sqliteSchema.Cases)
          .where(
            and(
              eq(sqliteSchema.Cases.uniqueId, uniqueId),
              eq(sqliteSchema.Cases.user_id, 1)
            )
          )
          .get();

        if (existing) {
          sqliteDb
            .update(sqliteSchema.Cases)
            .set({
              NextDate: item.NextDate || existing.NextDate,
              CaseStatus: item.CaseStatus || existing.CaseStatus,
              updated_at: new Date().toISOString(),
            })
            .where(
              and(
                eq(sqliteSchema.Cases.uniqueId, uniqueId),
                eq(sqliteSchema.Cases.user_id, 1)
              )
            )
            .run();
          updatedCount++;
        } else {
          sqliteDb
            .insert(sqliteSchema.Cases)
            .values({
              uniqueId,
              user_id: 1,
              CaseTitle: item.CaseTitle || "Imported Case",
              ClientName: item.ClientName || "",
              case_number: item.case_number || "",
              court_name: item.court_name || "",
              NextDate: item.NextDate || null,
            })
            .run();
          insertedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      source: "local_sqlite",
      insertedCount,
      updatedCount,
    });
  } catch (error: any) {
    console.error("Sync POST Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
