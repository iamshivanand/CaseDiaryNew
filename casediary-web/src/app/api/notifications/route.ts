import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pgDb } from "@/db/pgClient";
import * as pgSchema from "@/db/pgSchema";
import { db as sqliteDb } from "@/db";
import * as sqliteSchema from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getTodayDateString, getTomorrowDateString } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    const todayStr = getTodayDateString();
    const tomorrowStr = getTomorrowDateString();
    const isDemo = !authUser || authUser.isDemo || !authUser.chamberId || authUser.chamberId === "demo-chamber-id";

    let alerts: any[] = [];

    // =========================================================================
    // 1. CLOUD POSTGRESQL (Authenticated Chamber)
    // =========================================================================
    if (!isDemo && authUser.chamberId) {
      const chamberId = authUser.chamberId;

      // A. Real cases in this chamber
      const chamberCases = await pgDb
        .select()
        .from(pgSchema.cases)
        .where(
          and(
            eq(pgSchema.cases.chamber_id, chamberId),
            eq(pgSchema.cases.is_deleted, false)
          )
        );

      // 1. Listed Today
      const todayCases = chamberCases.filter((c) => c.NextDate === todayStr);
      todayCases.forEach((c) => {
        alerts.push({
          id: `pg-today-${c.id}`,
          title: `Hearing Listed Today: ${c.CaseTitle || "Matter"}`,
          body: `${c.court_name || "Court unassigned"} • Stage: ${c.case_stage || "Hearing"} • Priority: ${c.Priority || "Medium"}`,
          category: "hearing",
          case_id: c.id,
          action_url: `/cases/${c.id}`,
          action_label: "Open Dossier",
          is_urgent: c.Priority === "High",
          is_read: 0,
          timestamp: "Listed Today",
        });
      });

      // 2. Listed Tomorrow
      const tomorrowCases = chamberCases.filter((c) => c.NextDate === tomorrowStr);
      tomorrowCases.forEach((c) => {
        alerts.push({
          id: `pg-tomorrow-${c.id}`,
          title: `Tomorrow's Listing: ${c.CaseTitle || "Matter"}`,
          body: `${c.court_name || "Court unassigned"} • Scheduled before ${c.JudgeName || "Hon'ble Court"}`,
          category: "hearing",
          case_id: c.id,
          action_url: `/cause-list?date=${tomorrowStr}`,
          action_label: "View Cause List",
          is_urgent: false,
          is_read: 0,
          timestamp: "Tomorrow",
        });
      });

      // 3. Past Un-updated Hearings (Hearing happened in past 7 days, but next date not logged)
      const pastUnupdated = chamberCases.filter((c) => {
        if (!c.NextDate || c.NextDate >= todayStr) return false;
        if (c.CaseStatus !== "Open") return false;
        const diffMs = new Date(todayStr).getTime() - new Date(c.NextDate).getTime();
        const diffDays = diffMs / (1000 * 3600 * 24);
        return diffDays >= 1 && diffDays <= 7;
      });
      pastUnupdated.forEach((c) => {
        alerts.push({
          id: `pg-overdue-${c.id}`,
          title: `Progression Update Needed: ${c.CaseTitle || "Matter"}`,
          body: `Hearing was scheduled on ${c.NextDate}. Please record the court order and next hearing date.`,
          category: "hearing",
          case_id: c.id,
          action_url: `/cases/${c.id}`,
          action_label: "Record Order",
          is_urgent: true,
          is_read: 0,
          timestamp: "Update Pending",
        });
      });

      // 4. Limitation Expiry Approaching (within 30 days)
      const now = new Date();
      const limitationAlerts = chamberCases.filter((c) => {
        if (!c.StatuteOfLimitations) return false;
        const limDate = new Date(c.StatuteOfLimitations);
        const diffDays = (limDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 30;
      });
      limitationAlerts.forEach((c) => {
        alerts.push({
          id: `pg-lim-${c.id}`,
          title: `⚠️ Limitation Expiring Soon: ${c.CaseTitle || "Matter"}`,
          body: `Statute of limitations deadline is ${c.StatuteOfLimitations}. Ensure pleadings are finalized.`,
          category: "limitation",
          case_id: c.id,
          action_url: `/cases/${c.id}`,
          action_label: "View Matter",
          is_urgent: true,
          is_read: 0,
          timestamp: "Limitation Warning",
        });
      });

      // 5. Outstanding Fee Balances
      const feeCases = chamberCases.filter(
        (c) => (c.total_fee || 0) > (c.fee_paid || 0)
      );
      feeCases.slice(0, 5).forEach((c) => {
        const balance = (c.total_fee || 0) - (c.fee_paid || 0);
        alerts.push({
          id: `pg-fee-${c.id}`,
          title: `Pending Client Fee: ${c.ClientName || "Client"}`,
          body: `Outstanding balance of ₹${balance.toLocaleString("en-IN")} on ${c.CaseTitle || "Case"}`,
          category: "fee",
          case_id: c.id,
          action_url: `/finance`,
          action_label: "Fee Ledger",
          is_urgent: false,
          is_read: 0,
          timestamp: "Fee Reminder",
        });
      });

      // 6. Real Today's Duties
      const duties = await pgDb
        .select()
        .from(pgSchema.case_assignments)
        .where(
          and(
            eq(pgSchema.case_assignments.chamber_id, chamberId),
            eq(pgSchema.case_assignments.duty_date, todayStr)
          )
        );
      duties.forEach((d) => {
        alerts.push({
          id: `pg-duty-${d.id}`,
          title: `Court Duty: ${d.duty_type || "Pass-Over Request"}`,
          body: `Status: [${d.status || "Pending"}] • ${d.notes || "Court duty scheduled for today."}`,
          category: "team",
          action_url: `/team`,
          action_label: "Duty Board",
          is_urgent: d.status === "Pass-Over Granted",
          is_read: 0,
          timestamp: "Today's Duty",
        });
      });
    }

    // =========================================================================
    // 2. DEMO SANDBOX (SQLite Dynamic Synthesis - NO Stale Static Rows)
    // =========================================================================
    else {
      const allDemoCases = sqliteDb.select().from(sqliteSchema.Cases).all();

      // Listed Today
      const todayCases = allDemoCases.filter((c) => c.NextDate === todayStr);
      todayCases.forEach((c) => {
        alerts.push({
          id: `demo-today-${c.id}`,
          title: `Court Hearing Listed Today: ${c.CaseTitle}`,
          body: `${c.court_name || "Court unassigned"} • Stage: ${c.case_stage || "Hearing"} • Priority: ${c.Priority}`,
          category: "hearing",
          case_id: c.id,
          action_url: `/cases/${c.id}`,
          action_label: "Open Dossier",
          is_urgent: c.Priority === "High",
          is_read: 0,
          timestamp: "Listed Today",
        });
      });

      // Listed Tomorrow
      const tomorrowCases = allDemoCases.filter((c) => c.NextDate === tomorrowStr);
      tomorrowCases.forEach((c) => {
        alerts.push({
          id: `demo-tomorrow-${c.id}`,
          title: `Tomorrow's Listing: ${c.CaseTitle}`,
          body: `${c.court_name || "Court unassigned"} • Prepare briefs for ${c.JudgeName || "Hon'ble Court"}`,
          category: "hearing",
          case_id: c.id,
          action_url: `/cause-list?date=${tomorrowStr}`,
          action_label: "View Cause List",
          is_urgent: false,
          is_read: 0,
          timestamp: "Tomorrow",
        });
      });

      // Today's duties from SQLite
      const todayDuties = sqliteDb
        .select({
          id: sqliteSchema.CaseAssignments.id,
          case_id: sqliteSchema.CaseAssignments.case_id,
          duty_type: sqliteSchema.CaseAssignments.duty_type,
          status: sqliteSchema.CaseAssignments.status,
          notes: sqliteSchema.CaseAssignments.notes,
          caseTitle: sqliteSchema.Cases.CaseTitle,
          courtName: sqliteSchema.Cases.court_name,
          memberName: sqliteSchema.ChamberMembers.name,
        })
        .from(sqliteSchema.CaseAssignments)
        .leftJoin(sqliteSchema.Cases, eq(sqliteSchema.CaseAssignments.case_id, sqliteSchema.Cases.id))
        .leftJoin(sqliteSchema.ChamberMembers, eq(sqliteSchema.CaseAssignments.member_id, sqliteSchema.ChamberMembers.id))
        .where(eq(sqliteSchema.CaseAssignments.duty_date, todayStr))
        .all();

      todayDuties.forEach((d) => {
        alerts.push({
          id: `demo-duty-${d.id}`,
          title: `${d.duty_type || "Court Duty"}: ${d.memberName || "Junior Counsel"}`,
          body: `Status: [${d.status || "Pending"}] for ${d.caseTitle || "Case"} in ${d.courtName || "Court"}. ${d.notes || ""}`,
          category: "team",
          case_id: d.case_id,
          action_url: `/team`,
          action_label: "Live Duty Board",
          is_urgent: d.status === "Pass-Over Granted",
          is_read: 0,
          timestamp: "Today",
        });
      });

      // Fee dues
      const overdueFeeCases = allDemoCases.filter(
        (c) => (c.total_fee || 0) > (c.fee_paid || 0) && (c.total_fee || 0) >= 15000
      );
      overdueFeeCases.slice(0, 3).forEach((c) => {
        alerts.push({
          id: `demo-fee-${c.id}`,
          title: `Pending Client Fee: ${c.ClientName}`,
          body: `Outstanding balance of ₹${((c.total_fee || 0) - (c.fee_paid || 0)).toLocaleString("en-IN")} on ${c.CaseTitle}`,
          category: "fee",
          case_id: c.id,
          action_url: `/finance`,
          action_label: "Fee Ledger",
          is_urgent: false,
          is_read: 0,
          timestamp: "Fee Reminder",
        });
      });
    }

    // Sort urgent alerts first
    alerts.sort((a, b) => (b.is_urgent ? 1 : 0) - (a.is_urgent ? 1 : 0));

    const unreadCount = alerts.filter((n) => !n.is_read).length;

    return NextResponse.json({
      success: true,
      unreadCount,
      count: alerts.length,
      notifications: alerts,
    });
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: body.markAllRead
        ? "All notifications marked as read"
        : "Notification updated",
    });
  } catch (error: any) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
