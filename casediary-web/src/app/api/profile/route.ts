import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pgDb } from "@/db/pgClient";
import * as pgSchema from "@/db/pgSchema";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);

    // 1. Authenticated Cloud User
    if (authUser && authUser.userId && !authUser.isDemo) {
      const [pgUser] = await pgDb
        .select()
        .from(pgSchema.users)
        .where(eq(pgSchema.users.id, authUser.userId))
        .limit(1);

      if (pgUser) {
        return NextResponse.json({
          success: true,
          user: pgUser,
          profile: {
            name: pgUser.name,
            barCouncilNumber: pgUser.barCouncilNumber,
            chamberAddress: pgUser.chamberAddress,
            role: pgUser.role,
            email: pgUser.email,
            phone: pgUser.phone,
          },
        });
      }
    }

    // 2. Demo Sandbox Profile
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
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Authentication required to update advocate profile." },
        { status: 401 }
      );
    }

    const body = await request.json();

    // 1. Authenticated Cloud User
    if (authUser.userId && !authUser.isDemo) {
      const [updatedUser] = await pgDb
        .update(pgSchema.users)
        .set({
          name: body.name || undefined,
          barCouncilNumber: body.barCouncilNumber || undefined,
          chamberAddress: body.chamberAddress || undefined,
          phone: body.phone || undefined,
          updated_at: new Date(),
        })
        .where(eq(pgSchema.users.id, authUser.userId))
        .returning();

      return NextResponse.json({
        success: true,
        user: updatedUser,
        profile: {
          name: updatedUser.name,
          barCouncilNumber: updatedUser.barCouncilNumber,
          chamberAddress: updatedUser.chamberAddress,
        },
      });
    }

    // 2. Demo Sandbox
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
