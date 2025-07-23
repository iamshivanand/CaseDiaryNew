import * as SQLite from "expo-sqlite";

export const CREATE_USER_INFORMATION_TABLE = `
CREATE TABLE IF NOT EXISTS UserInformation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  fullName TEXT,
  phone TEXT,
  email TEXT,
  gender TEXT,
  professionalTitle TEXT,
  yearsOfExperience INTEGER,
  licenseNumber TEXT,
  location TEXT,
  practiceAreas TEXT,
  avatarUrl TEXT,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);`;

export const initializeUserInformationDB = async (
  db: SQLite.SQLiteDatabase
): Promise<void> => {
  await db.execAsync(CREATE_USER_INFORMATION_TABLE);
  console.log("UserInformation table initialized.");
};
