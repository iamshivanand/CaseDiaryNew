// DataBase/userProfileDB.ts
import * as SQLite from "expo-sqlite";
import { LawyerProfileData } from "../Types/appTypes";

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
    return {
      ...result,
      practiceAreas: JSON.parse(result.practiceAreas || "[]"),
      contactInfo: JSON.parse(result.contactInfo || "{}"),
      languages: JSON.parse(result.languages || "[]"),
      stats: JSON.parse(result.stats || "{}"),
      recentActivity: JSON.parse(result.recentActivity || "[]"),
    };
  }
  return null;
};

export const updateUserProfile = async (
  db: SQLite.SQLiteDatabase,
  userId: number,
  profileData: any
): Promise<void> => {
  const {
    avatarUrl,
    fullName,
    designation,
    practiceAreas,
    aboutMe,
    email,
    phone,
    address,
    languages,
    experience,
    license,
    location,
  } = profileData;

  const stats = {
    yearsOfPractice: experience || 0,
    yearsOfPracticeLastUpdated: new Date().toISOString(),
  };

  const contactInfo = {
    email,
    phone,
    address,
  };

  await db.runAsync(
    `INSERT OR REPLACE INTO LawyerProfiles (
      user_id, name, avatarUrl, designation, practiceAreas, aboutMe, contactInfo, languages, stats
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      fullName,
      avatarUrl,
      designation,
      JSON.stringify(practiceAreas),
      aboutMe,
      JSON.stringify(contactInfo),
      JSON.stringify(languages),
      JSON.stringify(stats),
    ]
  );
};
