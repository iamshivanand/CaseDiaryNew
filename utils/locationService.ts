import { getDb, getUserProfile } from '../DataBase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const fetchWithTimeout = async (url: string, timeoutMs: number = 3000): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

export const getGeolocatedState = async (): Promise<string | null> => {
  try {
    const res = await fetchWithTimeout("http://ip-api.com/json", 3000);
    const data = await res.json();
    if (data?.status === "success" && data?.regionName) {
      return data.regionName;
    }
  } catch (e) {
    console.warn("ip-api.com failed, trying ipapi.co...", e);
  }

  try {
    const res = await fetchWithTimeout("https://ipapi.co/json/", 3000);
    const data = await res.json();
    if (data?.region) {
      return data.region;
    }
  } catch (e) {
    console.warn("ipapi.co failed", e);
  }

  return null;
};

const getUniqueStatesFromDb = async (db: any): Promise<string[]> => {
  try {
    const rows = await db.getAllAsync("SELECT DISTINCT state FROM Districts WHERE state IS NOT NULL AND state != ''");
    return rows.map((r: any) => r.state);
  } catch (error) {
    console.error("Error fetching unique states:", error);
    return [];
  }
};

export const getUserState = async (): Promise<string | null> => {
  try {
    const db = await getDb();
    const userIdVal = await AsyncStorage.getItem('@user_id');
    if (userIdVal) {
      const userId = parseInt(userIdVal, 10);
      const profile = await getUserProfile(db, userId);
      if (profile && profile.contactInfo && profile.contactInfo.address) {
        const address = profile.contactInfo.address.trim();
        const dbStates = await getUniqueStatesFromDb(db);
        for (const state of dbStates) {
          if (address.toLowerCase().includes(state.toLowerCase())) {
            console.log("Found matching state in user profile address:", state);
            return state;
          }
        }
      }
    }
  } catch (error) {
    console.error("Error reading state from user profile:", error);
  }

  const geolocatedState = await getGeolocatedState();
  if (geolocatedState) {
    try {
      const db = await getDb();
      const dbStates = await getUniqueStatesFromDb(db);
      for (const state of dbStates) {
        if (geolocatedState.toLowerCase().includes(state.toLowerCase()) || state.toLowerCase().includes(geolocatedState.toLowerCase())) {
          return state;
        }
      }
    } catch (e) {
      console.error("Error validating geolocated state against DB states:", e);
    }
    return geolocatedState;
  }

  return null;
};
