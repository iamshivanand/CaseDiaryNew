import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "connected";
  let dbLatencyMs = 0;

  try {
    const queryStart = Date.now();
    // Test database liveness query
    db.run(sql`SELECT 1`);
    dbLatencyMs = Date.now() - queryStart;
  } catch (err: any) {
    dbStatus = `error: ${err.message}`;
  }

  const memoryUsage = process.memoryUsage();

  return NextResponse.json(
    {
      status: dbStatus === "connected" ? "healthy" : "degraded",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        driver: "better-sqlite3 / WAL",
      },
      memory: {
        rssMb: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
        heapUsedMb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
        heapTotalMb: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
      },
      loadBalancer: {
        target: "Hostinger VPS / PM2 Cluster",
        algorithm: "least_conn",
      },
    },
    {
      status: dbStatus === "connected" ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
