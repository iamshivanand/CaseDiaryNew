import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getTodayDateString, getTomorrowDateString } from "@/lib/utils";

export async function GET() {
  try {
    const todayStr = getTodayDateString();
    const tomorrowStr = getTomorrowDateString();

    // 1. Fetch stored notifications from DB
    const storedNotifs = db
      .select()
      .from(schema.AppNotifications)
      .orderBy(desc(schema.AppNotifications.id))
      .all();

    // 2. Synthesize Real-Time Hearing Alerts
    const todayCases = db
      .select()
      .from(schema.Cases)
      .where(eq(schema.Cases.NextDate, todayStr))
      .all();

    const tomorrowCases = db
      .select()
      .from(schema.Cases)
      .where(eq(schema.Cases.NextDate, tomorrowStr))
      .all();

    // 3. Synthesize Junior Duty & Pass-Over Alerts for Today
    const todayDuties = db
      .select({
        id: schema.CaseAssignments.id,
        case_id: schema.CaseAssignments.case_id,
        duty_type: schema.CaseAssignments.duty_type,
        duty_date: schema.CaseAssignments.duty_date,
        status: schema.CaseAssignments.status,
        notes: schema.CaseAssignments.notes,
        caseTitle: schema.Cases.CaseTitle,
        courtName: schema.Cases.court_name,
        memberName: schema.ChamberMembers.name,
      })
      .from(schema.CaseAssignments)
      .leftJoin(schema.Cases, eq(schema.CaseAssignments.case_id, schema.Cases.id))
      .leftJoin(schema.ChamberMembers, eq(schema.CaseAssignments.member_id, schema.ChamberMembers.id))
      .where(eq(schema.CaseAssignments.duty_date, todayStr))
      .all();

    // 4. Synthesize Fee Collection Reminders
    const allCases = db.select().from(schema.Cases).all();
    const overdueFeeCases = allCases.filter(
      (c) => (c.total_fee || 0) > (c.fee_paid || 0) && (c.total_fee || 0) >= 15000
    );

    // 5. Synthesize Limitation Expiry Alerts (within 30 days)
    const now = new Date();
    const limitationAlerts = allCases.filter((c) => {
      if (!c.StatuteOfLimitations) return false;
      const limDate = new Date(c.StatuteOfLimitations);
      const diffDays = (limDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
      return diffDays >= 0 && diffDays <= 30;
    });

    // Compile dynamic alerts
    const dynamicAlerts = [
      ...todayCases.map((c) => ({
        id: `dynamic-today-${c.id}`,
        title: `Court Hearing Listed Today: ${c.CaseTitle}`,
        body: `${c.court_name || "Court unassigned"} • Stage: ${c.case_stage || "Hearing"} • Priority: ${c.Priority}`,
        category: "hearing",
        case_id: c.id,
        action_url: `/cases/${c.id}`,
        action_label: "Open Dossier",
        is_urgent: c.Priority === "High",
        is_read: 0,
        timestamp: "Listed Today",
      })),

      ...tomorrowCases.map((c) => ({
        id: `dynamic-tomorrow-${c.id}`,
        title: `Tomorrow's Listing: ${c.CaseTitle}`,
        body: `${c.court_name || "Court unassigned"} • Prepare briefs for ${c.JudgeName || "Hon'ble Court"}`,
        category: "hearing",
        case_id: c.id,
        action_url: `/cause-list?date=${tomorrowStr}`,
        action_label: "View Cause List",
        is_urgent: false,
        is_read: 0,
        timestamp: "Tomorrow",
      })),

      ...todayDuties.map((d) => ({
        id: `dynamic-duty-${d.id}`,
        title: `${d.duty_type || "Court Duty"}: ${d.memberName || "Junior Counsel"}`,
        body: `Status: [${d.status || "Pending"}] for ${d.caseTitle || "Case"} in ${d.courtName || "Court"}. ${d.notes || ""}`,
        category: "team",
        case_id: d.case_id,
        action_url: `/team`,
        action_label: "Live Duty Board",
        is_urgent: d.status === "Pass-Over Granted",
        is_read: 0,
        timestamp: "Today",
      })),

      ...limitationAlerts.map((c) => ({
        id: `dynamic-lim-${c.id}`,
        title: `⚠️ Limitation Expiring Soon: ${c.CaseTitle}`,
        body: `Statute of limitations deadline is ${c.StatuteOfLimitations}. Ensure filings are complete.`,
        category: "limitation",
        case_id: c.id,
        action_url: `/cases/${c.id}`,
        action_label: "View Matter",
        is_urgent: true,
        is_read: 0,
        timestamp: "Limitation Warning",
      })),

      ...overdueFeeCases.slice(0, 5).map((c) => ({
        id: `dynamic-fee-${c.id}`,
        title: `Pending Client Fee: ${c.ClientName}`,
        body: `Outstanding balance of ₹${((c.total_fee || 0) - (c.fee_paid || 0)).toLocaleString("en-IN")} on ${c.CaseTitle}`,
        category: "fee",
        case_id: c.id,
        action_url: `/finance`,
        action_label: "Fee Ledger",
        is_urgent: false,
        is_read: 0,
        timestamp: "Fee Reminder",
      })),
    ];

    // Merge stored and dynamic notifications
    const allNotifications = [
      ...dynamicAlerts,
      ...storedNotifs.map((n) => ({
        id: String(n.id),
        title: n.title,
        body: n.body,
        category: n.category || "system",
        case_id: n.case_id,
        action_url: n.case_id ? `/cases/${n.case_id}` : undefined,
        action_label: n.case_id ? "Open Dossier" : undefined,
        is_urgent: false,
        is_read: n.is_read || 0,
        timestamp: n.created_at,
      })),
    ];

    const unreadCount = allNotifications.filter((n) => !n.is_read).length;

    return NextResponse.json({
      success: true,
      unreadCount,
      count: allNotifications.length,
      notifications: allNotifications,
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

    if (body.markAllRead) {
      db.update(schema.AppNotifications)
        .set({ is_read: 1 })
        .run();

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    }

    if (body.id) {
      const numericId = Number(body.id);
      if (!isNaN(numericId)) {
        db.update(schema.AppNotifications)
          .set({ is_read: 1 })
          .where(eq(schema.AppNotifications.id, numericId))
          .run();
      }
      return NextResponse.json({
        success: true,
        message: "Notification updated",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid payload" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.title || !body.body) {
      return NextResponse.json(
        { success: false, error: "Title and body are required" },
        { status: 400 }
      );
    }

    const created = db
      .insert(schema.AppNotifications)
      .values({
        title: body.title,
        body: body.body,
        category: body.category || "system",
        case_id: body.case_id ? Number(body.case_id) : null,
        is_read: 0,
      })
      .returning()
      .get();

    return NextResponse.json({
      success: true,
      notification: created,
    });
  } catch (error: any) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
