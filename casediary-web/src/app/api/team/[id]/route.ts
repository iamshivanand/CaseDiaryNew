import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, isSeniorAdvocate } from "@/lib/auth";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { pgDb } from "@/db/pgClient";
import * as pgSchema from "@/db/pgSchema";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const authUser = getAuthUser(request);

    if (authUser && authUser.chamberId) {
      const [pgMember] = await pgDb
        .select()
        .from(pgSchema.chamber_members)
        .where(
          and(
            eq(pgSchema.chamber_members.id, id),
            eq(pgSchema.chamber_members.chamber_id, authUser.chamberId)
          )
        )
        .limit(1);

      if (pgMember) {
        return NextResponse.json({ success: true, member: pgMember });
      }
    }

    const member = db
      .select()
      .from(schema.ChamberMembers)
      .where(eq(schema.ChamberMembers.id, Number(id)))
      .get();

    if (!member) {
      return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, member });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const authUser = getAuthUser(request);
    if (authUser && !isSeniorAdvocate(authUser)) {
      return NextResponse.json(
        {
          success: false,
          error: "Permission Denied: Only Senior Advocates / Chamber Heads have permission to update chamber member details.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    if (authUser && authUser.chamberId) {
      const [updatedPg] = await pgDb
        .update(pgSchema.chamber_members)
        .set({
          name: body.name,
          role: body.role,
          barCouncilNumber: body.barCouncilNumber,
          phone: body.phone,
          email: body.email,
          assigned_courts: body.assigned_courts,
          status: body.status,
        })
        .where(
          and(
            eq(pgSchema.chamber_members.id, id),
            eq(pgSchema.chamber_members.chamber_id, authUser.chamberId)
          )
        )
        .returning();

      if (updatedPg) {
        return NextResponse.json({ success: true, member: updatedPg });
      }
    }

    const memberId = Number(id);
    const existing = db
      .select()
      .from(schema.ChamberMembers)
      .where(eq(schema.ChamberMembers.id, memberId))
      .get();

    if (!existing) {
      return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 });
    }

    const updated = db
      .update(schema.ChamberMembers)
      .set({
        name: body.name !== undefined ? body.name : existing.name,
        role: body.role !== undefined ? body.role : existing.role,
        barCouncilNumber: body.barCouncilNumber !== undefined ? body.barCouncilNumber : existing.barCouncilNumber,
        phone: body.phone !== undefined ? body.phone : existing.phone,
        email: body.email !== undefined ? body.email : existing.email,
        assigned_courts: body.assigned_courts !== undefined ? body.assigned_courts : existing.assigned_courts,
        status: body.status !== undefined ? body.status : existing.status,
      })
      .where(eq(schema.ChamberMembers.id, memberId))
      .returning()
      .get();

    return NextResponse.json({ success: true, member: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const authUser = getAuthUser(request);
    if (authUser && !isSeniorAdvocate(authUser)) {
      return NextResponse.json(
        {
          success: false,
          error: "Permission Denied: Only Senior Advocates / Chamber Heads have permission to remove members from the chamber roster.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (authUser && authUser.chamberId) {
      await pgDb
        .delete(pgSchema.chamber_members)
        .where(
          and(
            eq(pgSchema.chamber_members.id, id),
            eq(pgSchema.chamber_members.chamber_id, authUser.chamberId)
          )
        );
      return NextResponse.json({ success: true, message: "Team member removed from chamber roster" });
    }

    const memberId = Number(id);
    db.delete(schema.ChamberMembers).where(eq(schema.ChamberMembers.id, memberId)).run();

    return NextResponse.json({ success: true, message: "Team member removed from chamber roster" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
