import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Chamber session closed and credentials purged successfully.",
  });

  // Explicitly invalidate authentication cookies
  response.cookies.set("advocase_token", "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    sameSite: "lax",
  });

  response.cookies.set("advocase_session", "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    sameSite: "lax",
  });

  return response;
}
