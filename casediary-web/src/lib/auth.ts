import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "advocase_casediary_super_secure_jwt_secret_key_2026";

export interface AuthTokenPayload {
  userId: string;
  email?: string;
  phone?: string;
  name: string;
  role: string;
  chamberId: string;
  planTier: string;
  isDemo?: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signAuthToken(
  payload: AuthTokenPayload,
  expiresIn: string = "30d"
): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch (err) {
    return null;
  }
}

export function isSeniorAdvocate(userOrRole?: string | AuthTokenPayload | null): boolean {
  if (!userOrRole) return false;
  const roleStr = typeof userOrRole === "string" ? userOrRole : userOrRole.role;
  if (!roleStr) return false;
  const norm = roleStr.toLowerCase().replace(/[^a-z]/g, "");
  return norm.includes("senior") || norm.includes("admin") || norm.includes("partner") || norm.includes("managing");
}

export function signDemoToken(role: "Senior" | "Junior"): string {
  const roleNames = {
    Senior: "Senior Advocate",
    Junior: "Associate Advocate",
  };
  const profileNames = {
    Senior: "Adv. Rajesh Sharma",
    Junior: "Adv. Vikram Mehra",
  };
  const emails = {
    Senior: "rajesh.sharma@delhibar.org",
    Junior: "vikram.mehra@delhibar.org",
  };

  return signAuthToken({
    userId: `demo-${role.toLowerCase()}-id`,
    email: emails[role],
    name: profileNames[role],
    role: roleNames[role],
    chamberId: "demo-chamber-id",
    planTier: "chamber_pro",
    isDemo: true,
  });
}

export function getAuthUser(req: Request): AuthTokenPayload | null {
  // 1. Try Authorization header: Bearer <token>
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    const payload = verifyAuthToken(token);
    if (payload) return payload;
  }

  // 2. Try Cookie header: advocase_token=<token>
  const cookieHeader = req.headers.get("cookie") || req.headers.get("Cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").map((c) => c.trim());
    for (const c of cookies) {
      if (c.startsWith("advocase_token=")) {
        const token = decodeURIComponent(c.substring("advocase_token=".length));
        const payload = verifyAuthToken(token);
        if (payload) return payload;
      }
    }
  }

  return null;
}

