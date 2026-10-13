import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { getDb } from "../DataBase/connection";
import { getCases } from "../DataBase";

// Auto-detect host URL for Android Emulator (10.0.2.2) vs Web/iOS (localhost)
const DEFAULT_API_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:3000"
    : "http://localhost:3000";

export const getApiBaseUrl = async (): Promise<string> => {
  const customUrl = await AsyncStorage.getItem("@custom_api_url");
  return customUrl || DEFAULT_API_URL;
};

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    role: string;
  };
  chamber?: {
    id: string;
    name: string;
    plan_tier: string;
    max_seats: number;
  };
  error?: string;
}

/**
 * 1. Log in advocate and connect device to Chamber Cloud
 */
export async function loginAdvocate(
  identifier: string,
  password: string
): Promise<AuthResponse> {
  const baseUrl = await getApiBaseUrl();
  try {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });

    const data: AuthResponse = await response.json();

    if (data.success && data.token && data.user) {
      await AsyncStorage.setItem("@auth_token", data.token);
      await AsyncStorage.setItem("@user_id", data.user.id);
      await AsyncStorage.setItem("@user_name", data.user.name);

      if (data.chamber) {
        await AsyncStorage.setItem("@chamber_id", data.chamber.id);
        await AsyncStorage.setItem("@chamber_name", data.chamber.name);
        await AsyncStorage.setItem("@plan_tier", data.chamber.plan_tier);
      }

      // Automatically link offline local cases to this user
      await claimUnassignedLocalCases(data.user.id);

      // Trigger first cloud sync
      syncCasesToCloud().catch((err) =>
        console.warn("Background initial sync skipped:", err)
      );
    }

    return data;
  } catch (error: any) {
    console.error("Login request failed:", error);
    return {
      success: false,
      error: "Unable to connect to server. Check network connection.",
    };
  }
}

/**
 * 2. Log in advocate via verified Google OAuth Token
 */
export async function loginAdvocateWithGoogle(
  idToken: string
): Promise<AuthResponse> {
  const baseUrl = await getApiBaseUrl();
  try {
    const response = await fetch(`${baseUrl}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    const data: AuthResponse = await response.json();

    if (data.success && data.token && data.user) {
      await AsyncStorage.setItem("@auth_token", data.token);
      await AsyncStorage.setItem("@user_id", data.user.id);
      await AsyncStorage.setItem("@user_name", data.user.name);

      if (data.chamber) {
        await AsyncStorage.setItem("@chamber_id", data.chamber.id);
        await AsyncStorage.setItem("@chamber_name", data.chamber.name);
        await AsyncStorage.setItem("@plan_tier", data.chamber.plan_tier);
      }

      await claimUnassignedLocalCases(data.user.id);
      syncCasesToCloud().catch((err) =>
        console.warn("Background initial sync skipped:", err)
      );
    }

    return data;
  } catch (error: any) {
    console.error("Google login request failed:", error);
    return {
      success: false,
      error: "Unable to connect to server. Check network connection.",
    };
  }
}

/**
 * 3. Register advocate and initialize new Chamber
 */
export async function registerAdvocate(payload: {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  chamberName?: string;
  barCouncilNumber?: string;
  planTier?: string;
}): Promise<AuthResponse> {
  const baseUrl = await getApiBaseUrl();
  try {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data: AuthResponse = await response.json();

    if (data.success && data.token && data.user) {
      await AsyncStorage.setItem("@auth_token", data.token);
      await AsyncStorage.setItem("@user_id", data.user.id);
      await AsyncStorage.setItem("@user_name", data.user.name);

      if (data.chamber) {
        await AsyncStorage.setItem("@chamber_id", data.chamber.id);
        await AsyncStorage.setItem("@chamber_name", data.chamber.name);
        await AsyncStorage.setItem("@plan_tier", data.chamber.plan_tier);
      }

      // Link any existing offline cases created before registration
      await claimUnassignedLocalCases(data.user.id);

      // Push cases to cloud
      syncCasesToCloud().catch((err) =>
        console.warn("Background initial sync skipped:", err)
      );
    }

    return data;
  } catch (error: any) {
    console.error("Register request failed:", error);
    return {
      success: false,
      error: "Unable to connect to server. Check network connection.",
    };
  }
}

/**
 * 3. Safe Migration: Claim all local unassigned cases in SQLite
 * Ensures existing cases are linked to the newly logged-in advocate
 */
export async function claimUnassignedLocalCases(userId: string): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync("UPDATE Cases SET user_id = ? WHERE user_id IS NULL;", [
      userId,
    ]);
    console.log("Successfully linked unassigned local cases to user:", userId);
  } catch (error) {
    console.error("Failed to claim unassigned local cases:", error);
  }
}

/**
 * 4. Two-Way Sync: Push local cases to Cloud (PostgreSQL in Docker)
 */
export async function syncCasesToCloud(): Promise<{
  success: boolean;
  insertedCount?: number;
  updatedCount?: number;
  error?: string;
}> {
  const token = await AsyncStorage.getItem("@auth_token");
  if (!token) {
    return { success: false, error: "Not logged in" };
  }

  const baseUrl = await getApiBaseUrl();

  try {
    // 1. Get all local cases from SQLite
    const localCases = await getCases();

    // 2. Push to /api/sync
    const response = await fetch(`${baseUrl}/api/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ cases: localCases }),
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error("Sync to cloud error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * 5. Log out advocate from device
 */
export async function logoutAdvocate(): Promise<void> {
  await AsyncStorage.multiRemove([
    "@auth_token",
    "@user_id",
    "@user_name",
    "@chamber_id",
    "@chamber_name",
    "@plan_tier",
  ]);
}
