import { NextRequest, NextResponse } from "next/server";
import { signDemoToken } from "@/lib/auth";

export const DEMO_PROFILES: Record<
  "Senior" | "Junior",
  {
    id: string;
    name: string;
    enrollment: string;
    court: string;
    role: string;
    plan: string;
    email: string;
    chamber: {
      id: string;
      name: string;
      plan_tier: string;
      max_seats: number;
    };
  }
> = {
  Senior: {
    id: "demo-senior-id",
    name: "Adv. Rajesh Sharma",
    enrollment: "D/1248/2012",
    court: "High Court of Delhi",
    role: "Senior Advocate",
    plan: "PRO CHAMBER",
    email: "rajesh.sharma@delhibar.org",
    chamber: {
      id: "demo-chamber-id",
      name: "Rajesh Sharma Law Chambers",
      plan_tier: "chamber_pro",
      max_seats: 5,
    },
  },
  Junior: {
    id: "demo-junior-id",
    name: "Adv. Vikram Mehra",
    enrollment: "D/4590/2021",
    court: "Tis Hazari Courts",
    role: "Associate Advocate",
    plan: "PRO CHAMBER",
    email: "vikram.mehra@delhibar.org",
    chamber: {
      id: "demo-chamber-id",
      name: "Rajesh Sharma Law Chambers",
      plan_tier: "chamber_pro",
      max_seats: 5,
    },
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const role: "Senior" | "Junior" = body.role === "Junior" ? "Junior" : "Senior";

    const profile = DEMO_PROFILES[role];
    const token = signDemoToken(role);

    const res = NextResponse.json({
      success: true,
      token,
      user: {
        ...profile,
        token,
      },
      chamber: profile.chamber,
    });

    // Set cookie on response for seamless server and client authentication
    res.cookies.set("advocase_token", token, {
      path: "/",
      maxAge: 2592000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    res.cookies.set("advocase_session", "true", {
      path: "/",
      maxAge: 2592000,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to initialize demo session" },
      { status: 500 }
    );
  }
}
