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

  const stats = {
    yearsOfPractice: typeof experience === 'string' ? parseInt(experience, 10) : (experience || 0),
    yearsOfPracticeLastUpdated: (profileData.stats && profileData.stats.yearsOfPracticeLastUpdated) 
      || new Date().toISOString(),
  };

  const contactInfo = {
    email,
    phone,
    address,
  };

  await db.runAsync(
    `INSERT OR REPLACE INTO LawyerProfiles (
      user_id, avatarUrl, designation, practiceAreas, aboutMe, contactInfo, languages, stats, name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      avatarUrl,
      designation,
      JSON.stringify(practiceAreas),
      aboutMe,
      JSON.stringify(contactInfo),
      JSON.stringify(languages),
      JSON.stringify(stats),
      fullName,
    ]
  );
};
