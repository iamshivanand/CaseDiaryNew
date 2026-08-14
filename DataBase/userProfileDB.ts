import * as FileSystem from "expo-file-system";
import * as SQLite from "expo-sqlite";

import { LawyerProfileData } from "../Types/appTypes";
import { safeJsonParse } from "../utils/jsonUtils";

export const CREATE_LAWYER_PROFILES_TABLE = `
CREATE TABLE IF NOT EXISTS LawyerProfiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT,
  avatarUrl TEXT,
  designation TEXT,
  practiceAreas TEXT,
  aboutMe TEXT,
  contactInfo TEXT,
  languages TEXT,
  stats TEXT,
  recentActivity TEXT,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);`;

export const initializeUserProfileDB = async (
  db: SQLite.SQLiteDatabase
): Promise<void> => {
  await db.execAsync(CREATE_LAWYER_PROFILES_TABLE);
  console.log("LawyerProfiles table initialized.");
};

/**
 * Persists an avatar file into non-volatile FileSystem.documentDirectory storage.
 * Handles cache paths from ImagePicker, camera, and cleans up superseded avatars.
 */
export const persistAvatarFile = async (
  sourceUri: string | null | undefined,
  userId: number,
  oldAvatarUri?: string | null
): Promise<string | null> => {
  if (!sourceUri || typeof sourceUri !== "string" || !sourceUri.trim()) {
    return null;
  }

  const trimmed = sourceUri.trim();

  // If it's a remote web URL, placeholder, or data URI, keep as is
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  try {
    const docDir = FileSystem.documentDirectory;
    if (!docDir) {
      return trimmed;
    }

    const avatarsDir = `${docDir}avatars/`;

    // If it is already stored permanently in the avatars directory and exists, retain it
    if (trimmed.startsWith(avatarsDir)) {
      return trimmed;
    }

    // Ensure the permanent avatars directory exists
    const dirInfo = await FileSystem.getInfoAsync(avatarsDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(avatarsDir, { intermediates: true });
    }

    // Determine clean file extension
    const cleanUri = trimmed.split("?")[0].split("#")[0];
    const rawExt = cleanUri.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = /^[a-z0-9]{2,5}$/.test(rawExt) ? rawExt : "jpg";

    const targetFilename = `avatar_${userId}_${Date.now()}.${safeExt}`;
    const targetUri = `${avatarsDir}${targetFilename}`;

    await FileSystem.copyAsync({
      from: trimmed,
      to: targetUri,
    });

    // Delete the previous permanent avatar to conserve device storage
    if (
      oldAvatarUri &&
      typeof oldAvatarUri === "string" &&
      oldAvatarUri.startsWith(avatarsDir) &&
      oldAvatarUri !== targetUri
    ) {
      try {
        await FileSystem.deleteAsync(oldAvatarUri, { idempotent: true });
      } catch (delErr) {
        console.warn("Failed to delete superseded avatar file:", delErr);
      }
    }

    return targetUri;
  } catch (error) {
    console.warn("Error persisting avatar file, falling back to source URI:", error);
    return trimmed;
  }
};

export const getUserProfile = async (
  db: SQLite.SQLiteDatabase,
  userId: number
): Promise<LawyerProfileData | null> => {
  const result = await db.getFirstAsync<any>(
    "SELECT * FROM LawyerProfiles WHERE user_id = ?",
    [userId]
  );
  if (result) {
    const parseJSON = (str: string | null, fallback: any) => {
      if (!str) return fallback;
      try {
        return JSON.parse(str);
      } catch (e) {
        console.error("JSON parsing error in userProfileDB:", e);
        return fallback;
      }
    };
    return {
      ...result,
      practiceAreas: parseJSON(result.practiceAreas, []),
      contactInfo: parseJSON(result.contactInfo, {}),
      languages: parseJSON(result.languages, []),
      stats: parseJSON(result.stats, {}),
      recentActivity: parseJSON(result.recentActivity, []),
    };
  }
  return null;
};

export const updateUserProfile = async (
  db: SQLite.SQLiteDatabase,
  userId: number,
  profileData: any
): Promise<void> => {
  if (userId === undefined || userId === null || isNaN(userId)) {
    throw new Error("Cannot update profile: invalid userId.");
  }

  // Retrieve existing stats and old avatar for persistence & change detection
  const existing = await db.getFirstAsync<{ stats: string; avatarUrl: string }>(
    "SELECT stats, avatarUrl FROM LawyerProfiles WHERE user_id = ?",
    [userId]
  );
  const oldStats = safeJsonParse<any>(existing?.stats || null, {});
  const oldAvatar = existing?.avatarUrl || null;

  // Persist avatar into permanent non-volatile app storage
  const avatarUrl = await persistAvatarFile(
    profileData.avatarUrl,
    userId,
    oldAvatar
  );

  // Sync back to in-memory object so caller has the permanent path
  if (profileData && typeof profileData === "object") {
    profileData.avatarUrl = avatarUrl;
  }

  const designation = profileData.designation;
  const practiceAreas = profileData.practiceAreas;
  const aboutMe = profileData.aboutMe;
  const languages = profileData.languages;

  const fullName = profileData.fullName || profileData.name;
  const email =
    profileData.email ||
    (profileData.contactInfo ? profileData.contactInfo.email : "");
  const phone =
    profileData.phone ||
    (profileData.contactInfo ? profileData.contactInfo.phone : "");
  const address =
    profileData.address ||
    profileData.location ||
    (profileData.contactInfo ? profileData.contactInfo.address : "");
  const experience =
    profileData.experience !== undefined
      ? profileData.experience
      : profileData.stats && profileData.stats.yearsOfPractice !== undefined
        ? profileData.stats.yearsOfPractice
        : 0;

  const newYears =
    typeof experience === "string" ? parseInt(experience, 10) : experience || 0;
  const oldYears =
    oldStats.yearsOfPractice !== undefined ? oldStats.yearsOfPractice : -1;

  const stats = {
    yearsOfPractice: newYears,
    yearsOfPracticeLastUpdated:
      newYears === oldYears
        ? oldStats.yearsOfPracticeLastUpdated || new Date().toISOString()
        : new Date().toISOString(),
  };

  const contactInfo = {
    email,
    phone,
    address,
  };

  const practiceAreasStr = Array.isArray(practiceAreas)
    ? JSON.stringify(practiceAreas)
    : JSON.stringify([]);
  const contactInfoStr = JSON.stringify(contactInfo);
  const languagesStr = Array.isArray(languages)
    ? JSON.stringify(languages)
    : JSON.stringify([]);
  const statsStr = JSON.stringify(stats);

  if (existing) {
    await db.runAsync(
      `UPDATE LawyerProfiles SET 
        avatarUrl = ?, 
        designation = ?, 
        practiceAreas = ?, 
        aboutMe = ?, 
        contactInfo = ?, 
        languages = ?, 
        stats = ?, 
        name = ?
      WHERE user_id = ?`,
      [
        avatarUrl,
        designation,
        practiceAreasStr,
        aboutMe,
        contactInfoStr,
        languagesStr,
        statsStr,
        fullName,
        userId,
      ]
    );
  } else {
    await db.runAsync(
      `INSERT INTO LawyerProfiles (
        user_id, avatarUrl, designation, practiceAreas, aboutMe, contactInfo, languages, stats, name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        avatarUrl,
        designation,
        practiceAreasStr,
        aboutMe,
        contactInfoStr,
        languagesStr,
        statsStr,
        fullName,
      ]
    );
  }
};
