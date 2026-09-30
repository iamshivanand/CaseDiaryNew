import { NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, sql, and, or, isNull } from "drizzle-orm";
import { getTodayDateString, getTomorrowDateString, getYesterdayDateString } from "@/lib/utils";

export async function GET() {
  try {
    const todayStr = getTodayDateString();
    const tomorrowStr = getTomorrowDateString();
    const yesterdayStr = getYesterdayDateString();

    const todayCases = db
      .select({ count: sql<number>`count(*)` })
      .from(schema.Cases)
      .where(eq(schema.Cases.NextDate, todayStr))
      .get()?.count || 0;

    const tomorrowCases = db
      .select({ count: sql<number>`count(*)` })
      .from(schema.Cases)
      .where(eq(schema.Cases.NextDate, tomorrowStr))
      .get()?.count || 0;

    const yesterdayPending = db
      .select({ count: sql<number>`count(*)` })
      .from(schema.Cases)
      .where(
        and(
          sql`${schema.Cases.NextDate} <= ${yesterdayStr}`,
          sql`(${schema.Cases.CaseStatus} IS NULL OR ${schema.Cases.CaseStatus} != 'Disposed')`
        )
      )
      .get()?.count || 0;

    const undatedCases = db
      .select({ count: sql<number>`count(*)` })
      .from(schema.Cases)
      .where(or(isNull(schema.Cases.NextDate), eq(schema.Cases.NextDate, "")))
      .get()?.count || 0;

    const totalActive = db
      .select({ count: sql<number>`count(*)` })
      .from(schema.Cases)
      .where(sql`(${schema.Cases.CaseStatus} IS NULL OR ${schema.Cases.CaseStatus} != 'Disposed')`)
      .get()?.count || 0;

    const totalDisposed = db
      .select({ count: sql<number>`count(*)` })
      .from(schema.Cases)
      .where(eq(schema.Cases.CaseStatus, "Disposed"))
      .get()?.count || 0;

    const feeStats = db
      .select({
        totalAgreed: sql<number>`COALESCE(sum(${schema.Cases.total_fee}), 0)`,
        totalPaid: sql<number>`COALESCE(sum(${schema.Cases.fee_paid}), 0)`,
        totalDateFee: sql<number>`COALESCE(sum(${schema.Cases.date_fee_collected}), 0)`,
      })
      .from(schema.Cases)
      .get();

    const lawyer = db.select().from(schema.LawyerProfiles).get();

    return NextResponse.json({
      success: true,
      stats: {
        todayCount: todayCases,
        tomorrowCount: tomorrowCases,
        yesterdayPendingCount: yesterdayPending,
        undatedCount: undatedCases,
        totalActiveCount: totalActive,
        totalDisposedCount: totalDisposed,
        totalFeeAgreed: feeStats?.totalAgreed || 0,
        totalFeeCollected: feeStats?.totalPaid || 0,
        totalOutstanding: (feeStats?.totalAgreed || 0) - (feeStats?.totalPaid || 0),
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
