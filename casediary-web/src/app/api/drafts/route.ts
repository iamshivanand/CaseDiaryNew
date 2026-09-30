import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { desc, eq, and, like, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const caseId = searchParams.get("case_id");
    const isTemplate = searchParams.get("is_template");
    const chamberId = searchParams.get("chamber_id");
    const search = searchParams.get("search");

    // Single draft lookup
    if (id) {
      const draft = db
        .select()
        .from(schema.DocumentDrafts)
        .where(eq(schema.DocumentDrafts.id, id))
        .get();

      if (!draft) {
        return NextResponse.json({ success: false, error: "Draft not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, draft });
    }

    // List query with filters
    const conditions = [];

    if (caseId) {
      conditions.push(eq(schema.DocumentDrafts.case_id, Number(caseId)));
    }

    if (isTemplate !== null) {
      conditions.push(eq(schema.DocumentDrafts.is_custom_template, Number(isTemplate)));
    }

    if (chamberId) {
      conditions.push(eq(schema.DocumentDrafts.chamber_id, chamberId));
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push(
        or(
          like(schema.DocumentDrafts.title, q),
          like(schema.DocumentDrafts.case_title, q),
          like(schema.DocumentDrafts.client_name, q),
          like(schema.DocumentDrafts.template_category, q)
        )
      );
    }

    const query = db.select().from(schema.DocumentDrafts);
    const drafts = (
      conditions.length > 0
        ? query.where(and(...conditions)).orderBy(desc(schema.DocumentDrafts.updated_at))
        : query.orderBy(desc(schema.DocumentDrafts.updated_at))
    ).all();

    return NextResponse.json({ success: true, drafts, total: drafts.length });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body.id || `draft-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    // Check if draft already exists
    const existing = db
      .select()
      .from(schema.DocumentDrafts)
      .where(eq(schema.DocumentDrafts.id, id))
      .get();

    if (existing) {
      const updated = db
        .update(schema.DocumentDrafts)
        .set({
          title: body.title || existing.title,
          html_content: body.html_content !== undefined ? body.html_content : existing.html_content,
          template_type: body.template_type || existing.template_type,
          template_category: body.template_category !== undefined ? body.template_category : existing.template_category,
          template_description: body.template_description !== undefined ? body.template_description : existing.template_description,
          is_custom_template: body.is_custom_template !== undefined ? Number(body.is_custom_template) : existing.is_custom_template,
          case_id: body.case_id !== undefined ? (body.case_id ? Number(body.case_id) : null) : existing.case_id,
          case_title: body.case_title !== undefined ? body.case_title : existing.case_title,
          client_name: body.client_name !== undefined ? body.client_name : existing.client_name,
          case_number: body.case_number !== undefined ? body.case_number : existing.case_number,
          user_id: body.user_id !== undefined ? (body.user_id ? Number(body.user_id) : null) : existing.user_id,
          chamber_id: body.chamber_id !== undefined ? body.chamber_id : existing.chamber_id,
          author_name: body.author_name !== undefined ? body.author_name : existing.author_name,
          author_role: body.author_role !== undefined ? body.author_role : existing.author_role,
        })
        .where(eq(schema.DocumentDrafts.id, id))
        .returning()
        .get();

      return NextResponse.json({ success: true, draft: updated, isNew: false });
    }

    const newDraft = db
      .insert(schema.DocumentDrafts)
      .values({
        id,
        user_id: body.user_id ? Number(body.user_id) : null,
        chamber_id: body.chamber_id || "delhi_main_chamber",
        author_name: body.author_name || "Adv. Rajesh Sharma",
        author_role: body.author_role || "Senior Advocate",
        case_id: body.case_id ? Number(body.case_id) : null,
        case_title: body.case_title || null,
        client_name: body.client_name || null,
        case_number: body.case_number || null,
        title: body.title || "Untitled Draft",
        template_type: body.template_type || "custom",
        template_category: body.template_category || "general",
        template_description: body.template_description || null,
        html_content: body.html_content || "<p>Start typing your legal petition here...</p>",
        is_custom_template: body.is_custom_template ? 1 : 0,
      })
      .returning()
      .get();

    return NextResponse.json({ success: true, draft: newDraft, isNew: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Draft ID is required" }, { status: 400 });
    }

    const deleted = db
      .delete(schema.DocumentDrafts)
      .where(eq(schema.DocumentDrafts.id, id))
      .returning()
      .get();

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Draft not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Draft deleted successfully", deleted });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
