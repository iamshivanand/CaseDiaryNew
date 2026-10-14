import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, isSeniorAdvocate } from "@/lib/auth";
import { pgDb } from "@/db/pgClient";
import * as pgSchema from "@/db/pgSchema";
import { db as sqliteDb } from "@/db";
import * as sqliteSchema from "@/db/schema";
import { eq, sql, and, or, isNull } from "drizzle-orm";
import { getTodayDateString, getTomorrowDateString, getYesterdayDateString } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    const isSenior = isSeniorAdvocate(authUser);
    const todayStr = getTodayDateString();
    const tomorrowStr = getTomorrowDateString();
    const yesterdayStr = getYesterdayDateString();

    // ─────────────────────────────────────────────────────────────────────────
    // 1. CLOUD POSTGRESQL (Authenticated Chamber)
    // ─────────────────────────────────────────────────────────────────────────
    if (authUser && authUser.chamberId && authUser.chamberId !== "demo-chamber-id") {
      const chamberCond = and(
        eq(pgSchema.cases.chamber_id, authUser.chamberId),
        eq(pgSchema.cases.is_deleted, false)
      );

      const [todayRes] = await pgDb
        .select({ count: sql<number>`count(*)::int` })
        .from(pgSchema.cases)
        .where(and(chamberCond, eq(pgSchema.cases.NextDate, todayStr)));

      const [tomorrowRes] = await pgDb
        .select({ count: sql<number>`count(*)::int` })
        .from(pgSchema.cases)
        .where(and(chamberCond, eq(pgSchema.cases.NextDate, tomorrowStr)));

      const [yesterdayRes] = await pgDb
        .select({ count: sql<number>`count(*)::int` })
        .from(pgSchema.cases)
        .where(
          and(
            chamberCond,
            sql`${pgSchema.cases.NextDate} <= ${yesterdayStr}`,
            sql`(${pgSchema.cases.CaseStatus} IS NULL OR ${pgSchema.cases.CaseStatus} != 'Disposed')`
          )
        );

      const [undatedRes] = await pgDb
        .select({ count: sql<number>`count(*)::int` })
        .from(pgSchema.cases)
        .where(
          and(
            chamberCond,
            or(isNull(pgSchema.cases.NextDate), eq(pgSchema.cases.NextDate, ""))
          )
        );

      const [activeRes] = await pgDb
        .select({ count: sql<number>`count(*)::int` })
        .from(pgSchema.cases)
        .where(
          and(
            chamberCond,
            sql`(${pgSchema.cases.CaseStatus} IS NULL OR ${pgSchema.cases.CaseStatus} != 'Disposed')`
          )
        );

      const [disposedRes] = await pgDb
        .select({ count: sql<number>`count(*)::int` })
        .from(pgSchema.cases)
        .where(and(chamberCond, eq(pgSchema.cases.CaseStatus, "Disposed")));

      const [feeStats] = await pgDb
        .select({
          totalAgreed: sql<number>`COALESCE(sum(${pgSchema.cases.total_fee}), 0)::int`,
          totalPaid: sql<number>`COALESCE(sum(${pgSchema.cases.fee_paid}), 0)::int`,
          totalDateFee: sql<number>`COALESCE(sum(${pgSchema.cases.date_fee_collected}), 0)::float`,
        })
        .from(pgSchema.cases)
        .where(chamberCond);

      return NextResponse.json({
        success: true,
        source: "cloud_postgres",
        stats: {
          todayCount: Number(todayRes?.count || 0),
          tomorrowCount: Number(tomorrowRes?.count || 0),
          yesterdayPendingCount: Number(yesterdayRes?.count || 0),
          undatedCount: Number(undatedRes?.count || 0),
          totalActiveCount: Number(activeRes?.count || 0),
          totalDisposedCount: Number(disposedRes?.count || 0),
          totalFeeAgreed: isSenior ? Number(feeStats?.totalAgreed || 0) : 0,
          totalFeeCollected: isSenior ? Number(feeStats?.totalPaid || 0) : 0,
          totalOutstanding: isSenior
            ? Number(feeStats?.totalAgreed || 0) - Number(feeStats?.totalPaid || 0)
            : 0,
        },
        lawyer: {
          name: authUser.name,
          email: authUser.email,
        },
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. ISOLATED DEMO SANDBOX
    // ─────────────────────────────────────────────────────────────────────────
    const sandboxCond = eq(sqliteSchema.Cases.user_id, 1);

    const todayCases = sqliteDb
      .select({ count: sql<number>`count(*)` })
      .from(sqliteSchema.Cases)
      .where(and(sandboxCond, eq(sqliteSchema.Cases.NextDate, todayStr)))
      .get()?.count || 0;

    const tomorrowCases = sqliteDb
      .select({ count: sql<number>`count(*)` })
      .from(sqliteSchema.Cases)
      .where(and(sandboxCond, eq(sqliteSchema.Cases.NextDate, tomorrowStr)))
      .get()?.count || 0;

    const yesterdayPending = sqliteDb
      .select({ count: sql<number>`count(*)` })
      .from(sqliteSchema.Cases)
      .where(
        and(
          sandboxCond,
          sql`${sqliteSchema.Cases.NextDate} <= ${yesterdayStr}`,
          sql`(${sqliteSchema.Cases.CaseStatus} IS NULL OR ${sqliteSchema.Cases.CaseStatus} != 'Disposed')`
        )
      )
      .get()?.count || 0;

    const undatedCases = sqliteDb
      .select({ count: sql<number>`count(*)` })
      .from(sqliteSchema.Cases)
      .where(and(sandboxCond, or(isNull(sqliteSchema.Cases.NextDate), eq(sqliteSchema.Cases.NextDate, ""))))
      .get()?.count || 0;

    const totalActive = sqliteDb
      .select({ count: sql<number>`count(*)` })
      .from(sqliteSchema.Cases)
      .where(and(sandboxCond, sql`(${sqliteSchema.Cases.CaseStatus} IS NULL OR ${sqliteSchema.Cases.CaseStatus} != 'Disposed')`))
      .get()?.count || 0;

    const totalDisposed = sqliteDb
      .select({ count: sql<number>`count(*)` })
      .from(sqliteSchema.Cases)
      .where(and(sandboxCond, eq(sqliteSchema.Cases.CaseStatus, "Disposed")))
      .get()?.count || 0;

    const feeStats = sqliteDb
      .select({
        totalAgreed: sql<number>`COALESCE(sum(${sqliteSchema.Cases.total_fee}), 0)`,
        totalPaid: sql<number>`COALESCE(sum(${sqliteSchema.Cases.fee_paid}), 0)`,
        totalDateFee: sql<number>`COALESCE(sum(${sqliteSchema.Cases.date_fee_collected}), 0)`,
      })
      .from(sqliteSchema.Cases)
      .where(sandboxCond)
      .get();

    const lawyer = sqliteDb.select().from(sqliteSchema.LawyerProfiles).get();

    return NextResponse.json({
      success: true,
      source: "demo_sandbox",
      stats: {
        todayCount: todayCases,
        tomorrowCount: tomorrowCases,
        yesterdayPendingCount: yesterdayPending,
        undatedCount: undatedCases,
        totalActiveCount: totalActive,
        totalDisposedCount: totalDisposed,
        totalFeeAgreed: isSenior ? (feeStats?.totalAgreed || 0) : 0,
        totalFeeCollected: isSenior ? (feeStats?.totalPaid || 0) : 0,
        totalOutstanding: isSenior ? ((feeStats?.totalAgreed || 0) - (feeStats?.totalPaid || 0)) : 0,
      },
      lawyer,
    });
  } catch (error: any) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
