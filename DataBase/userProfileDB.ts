// DataBase/userProfileDB.ts
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
  const avatarUrl = profileData.avatarUrl;
  const designation = profileData.designation;
  const practiceAreas = profileData.practiceAreas;
  const aboutMe = profileData.aboutMe;
  const languages = profileData.languages;

  const fullName = profileData.fullName || profileData.name;
  const email = profileData.email || (profileData.contactInfo ? profileData.contactInfo.email : "");
  const phone = profileData.phone || (profileData.contactInfo ? profileData.contactInfo.phone : "");
  const address = profileData.address || profileData.location || (profileData.contactInfo ? profileData.contactInfo.address : "");
  const experience = profileData.experience !== undefined 
    ? profileData.experience 
    : (profileData.stats && profileData.stats.yearsOfPractice !== undefined ? profileData.stats.yearsOfPractice : 0);

  // Retrieve existing stats to compare yearsOfPractice
  const existing = await db.getFirstAsync<{ stats: string }>(
    "SELECT stats FROM LawyerProfiles WHERE user_id = ?",
    [userId]
  );
  const oldStats = safeJsonParse<any>(existing?.stats || null, {});

  const newYears = typeof experience === 'string' ? parseInt(experience, 10) : (experience || 0);
  const oldYears = oldStats.yearsOfPractice !== undefined ? oldStats.yearsOfPractice : -1;

  const stats = {
    yearsOfPractice: newYears,
    yearsOfPracticeLastUpdated: newYears === oldYears 
      ? (oldStats.yearsOfPracticeLastUpdated || new Date().toISOString())
      : new Date().toISOString(),
  };

  const contactInfo = {
    email,
    phone,
    address,
  };

  const practiceAreasStr = Array.isArray(practiceAreas) ? JSON.stringify(practiceAreas) : JSON.stringify([]);
  const contactInfoStr = JSON.stringify(contactInfo);
  const languagesStr = Array.isArray(languages) ? JSON.stringify(languages) : JSON.stringify([]);
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
