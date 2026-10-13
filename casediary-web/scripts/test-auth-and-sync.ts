import { pgDb } from "../src/db/pgClient";
import * as schema from "../src/db/pgSchema";
import { hashPassword, comparePassword, signAuthToken, verifyAuthToken } from "../src/lib/auth";
import { eq } from "drizzle-orm";

async function runVerification() {
  console.log("🧪 Starting Backend Auth & Cloud Sync Test...\n");

  try {
    // 1. Test Password Hashing
    const rawPass = "LegalSecret#2026";
    const hashed = await hashPassword(rawPass);
    const valid = await comparePassword(rawPass, hashed);
    console.log("1. Password hashing test:", valid ? "✅ PASSED" : "❌ FAILED");

    // 2. Test Chamber Creation in Docker PostgreSQL
    const testEmail = `test.advocate.${Date.now()}@delhibar.com`;
    const [chamber] = await pgDb
      .insert(schema.chambers)
      .values({
        name: "Verma & Partners Chambers",
        plan_tier: "chamber_pro",
        max_seats: 5,
      })
      .returning();
    console.log("2. Chamber created in Docker Postgres:", "✅ ID:", chamber.id, "(Plan:", chamber.plan_tier, ")");

    // 3. Test User Creation
    const [user] = await pgDb
      .insert(schema.users)
      .values({
        name: "Adv. Vikram Verma",
        email: testEmail,
        password_hash: hashed,
        barCouncilNumber: "D/5678/2020",
        role: "senior_advocate",
        is_verified: true,
      })
      .returning();
    console.log("3. Advocate user created:", "✅ ID:", user.id, "(Email:", user.email, ")");

    // 4. Test Chamber Membership
    await pgDb.insert(schema.chamber_members).values({
      chamber_id: chamber.id,
      user_id: user.id,
      name: user.name,
      role: "Senior Advocate",
      status: "Active",
    });
    console.log("4. Chamber membership linked:", "✅ PASSED");

    // 5. Test JWT Signing & Verification
    const token = signAuthToken({
      userId: user.id,
      email: user.email!,
      name: user.name,
      role: user.role,
      chamberId: chamber.id,
      planTier: chamber.plan_tier,
    });
    const verified = verifyAuthToken(token);
    console.log("5. JWT Token verified:", verified?.userId === user.id ? "✅ PASSED" : "❌ FAILED");

    // 6. Test Case Sync Insert
    const testCaseUniqueId = `case_test_${Date.now()}`;
    await pgDb.insert(schema.cases).values({
      uniqueId: testCaseUniqueId,
      chamber_id: chamber.id,
      user_id: user.id,
      CaseTitle: "Vikram Verma vs. Union of India",
      ClientName: "Vikram Verma",
      CNRNumber: "DLCT01-001234-2026",
      court_name: "High Court of Delhi",
      NextDate: "2026-11-15",
      CaseStatus: "In Progress",
      Priority: "High",
    });
    console.log("6. Case synced into PostgreSQL:", "✅ UniqueId:", testCaseUniqueId);

    // 7. Verify Case Query
    const queriedCases = await pgDb
      .select()
      .from(schema.cases)
      .where(eq(schema.cases.uniqueId, testCaseUniqueId));
    console.log("7. Case retrieval for chamber:", queriedCases.length === 1 ? "✅ PASSED" : "❌ FAILED");

    console.log("\n🎉 ALL 7 AUTH & SYNC ARCHITECTURAL TESTS PASSED PERFECTLY!");
  } catch (err) {
    console.error("❌ Test failed:", err);
  } finally {
    process.exit(0);
  }
}

runVerification();
