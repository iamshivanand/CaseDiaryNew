import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as pgSchema from "./pgSchema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://casediary_admin:casediary_secure_password@localhost:5432/casediary_db";

// Connection pool configured for server and high concurrency
export const sql = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const pgDb = drizzle(sql, { schema: pgSchema });
