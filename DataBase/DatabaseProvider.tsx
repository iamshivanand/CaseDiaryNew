import React, { createContext, useContext, useEffect, useState } from "react";
import { getDb, closeDb } from "./index";
import { SQLiteDatabase } from "expo-sqlite";

interface DBContextType {
  db: SQLiteDatabase | null;
}

const DBContext = createContext<DBContextType>({ db: null });

export const useDB = () => useContext(DBContext);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);

  useEffect(() => {
    let dbInstance: SQLiteDatabase | null = null;
    const initializeDB = async () => {
      dbInstance = await getDb();
      setDb(dbInstance);
    };

    initializeDB();

    return () => {
      if (dbInstance) {
        closeDb(dbInstance);
      }
    };
  }, []);

  return <DBContext.Provider value={{ db }}>{children}</DBContext.Provider>;
};
