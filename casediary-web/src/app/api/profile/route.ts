import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const profile = db.select().from(schema.LawyerProfiles).get();
    const user = db.select().from(schema.Users).get();

    return NextResponse.json({
      success: true,
      profile,
      user,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const existing = db.select().from(schema.LawyerProfiles).get();

    if (existing) {
      const updated = db
        .update(schema.LawyerProfiles)
        .set({
          name: body.name || existing.name,
          designation: body.designation || existing.designation,
          practiceAreas: body.practiceAreas || existing.practiceAreas,
          aboutMe: body.aboutMe || existing.aboutMe,
          contactInfo: body.contactInfo || existing.contactInfo,
          languages: body.languages || existing.languages,
          barCouncilNumber: body.barCouncilNumber || existing.barCouncilNumber,
          chamberAddress: body.chamberAddress || existing.chamberAddress,
          letterheadConfig: body.letterheadConfig !== undefined ? body.letterheadConfig : existing.letterheadConfig,
        })
        .where(eq(schema.LawyerProfiles.id, existing.id))
        .returning()
        .get();

      return NextResponse.json({ success: true, profile: updated });
    } else {
      const inserted = db
        .insert(schema.LawyerProfiles)
        .values({
          user_id: 1,
          name: body.name || "Advocate",
          designation: body.designation || "Counsel",
          practiceAreas: body.practiceAreas || "",
          aboutMe: body.aboutMe || "",
          contactInfo: body.contactInfo || "",
          languages: body.languages || "English, Hindi",
          barCouncilNumber: body.barCouncilNumber || "",
          chamberAddress: body.chamberAddress || "",
          letterheadConfig: body.letterheadConfig || null,
        })
        .returning()
        .get();

      return NextResponse.json({ success: true, profile: inserted });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
