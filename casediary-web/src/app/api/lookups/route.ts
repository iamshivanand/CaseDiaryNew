import { NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const courts = db.select().from(schema.Courts).orderBy(asc(schema.Courts.name)).all();
    const caseTypes = db.select().from(schema.CaseTypes).orderBy(asc(schema.CaseTypes.name)).all();
    const districts = db.select().from(schema.Districts).orderBy(asc(schema.Districts.name)).all();
    const policeStations = db.select().from(schema.PoliceStations).orderBy(asc(schema.PoliceStations.name)).all();

    const stages = [
      "Filing / Initial Scrutiny",
      "Notice / Summons",
      "Appearance of Parties",
      "Written Statement / Reply",
      "Framing of Charges / Issues",
      "Complainant / Prosecution Evidence",
      "Cross-Examination",
      "Defense Evidence",
      "Arguments on Bail / Injunction",
      "Final Arguments",
      "Order / Judgment Reserved",
      "Disposed / Decided",
      "Execution of Decree",
    ];

    return NextResponse.json({
      success: true,
      courts,
      caseTypes,
      districts,
      policeStations,
      stages,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
