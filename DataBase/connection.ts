// DataBase/connection.ts
import * as SQLite from 'expo-sqlite';
import { initializeSchema, seedInitialData } from './schema'; // Assuming schema.ts is in the same directory

const DATABASE_NAME = "CaseDiary.db";
let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * ONLY FOR TEST ENVIRONMENTS. Clears the singleton dbInstance.
 */
export const __TEST_ONLY_resetDbInstance = () => {
  if (process.env.NODE_ENV === 'test') {
    console.log("Resetting DB instance from connection.ts for test environment.");
    dbInstance = null;
  } else {
    console.warn("__TEST_ONLY_resetDbInstance called outside of test environment. This is not allowed.");
  }
};

export const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (dbInstance === null) {
    console.log("DataBase/connection.ts: dbInstance is null, opening new DB connection.");
    try {
      const instance = await SQLite.openDatabaseAsync(DATABASE_NAME);
      console.log("DataBase/connection.ts: Database opened successfully.");
      dbInstance = instance;
      // It's crucial that initializeSchema and seedInitialData are awaited.
      await initializeSchema(dbInstance);
      await seedInitialData(dbInstance);
      console.log("DataBase/connection.ts: Schema initialized and initial data seeded.");
    } catch (error) {
      console.error("DataBase/connection.ts: Failed to open or initialize database:", error);
      // If dbInstance was set before error in init/seed, nullify it
      dbInstance = null;
      throw error; // Re-throw error so caller knows setup failed
    }
  }
  if (!dbInstance) {
    // This should ideally not be reached if the above try/catch correctly handles errors
    // and throws, or if dbInstance is successfully set.
    throw new Error("DataBase/connection.ts: Database instance is critically null after attempting to open.");
  }
  return dbInstance;
};
