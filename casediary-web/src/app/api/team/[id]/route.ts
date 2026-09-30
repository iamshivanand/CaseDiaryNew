import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
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
    const { id } = await params;
    const memberId = Number(id);
    const body = await request.json();

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
    const { id } = await params;
    const memberId = Number(id);

    db.delete(schema.ChamberMembers).where(eq(schema.ChamberMembers.id, memberId)).run();

    return NextResponse.json({ success: true, message: "Team member removed" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
