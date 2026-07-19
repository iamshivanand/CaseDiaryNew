export function formatDate(dateString) {
  if (!dateString) {
    return "N/A";
  }
  try {
    // If it's already in DD-MM-YYYY format, return as is
    if (typeof dateString === "string" && /^\d{2}-\d{2}-\d{4}$/.test(dateString.trim())) {
      return dateString.trim();
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return "Invalid Date";
  }
}

import AsyncStorage from '@react-native-async-storage/async-storage';

export const getCurrentUserId = async (): Promise<number> => {
  const id = await AsyncStorage.getItem('@user_id');
  return id ? parseInt(id, 10) : 1;
};

export function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(dateString: string): Date | null {
  if (!dateString) return null;
  const parts = dateString.split("-");
  if (parts.length !== 3) return null;
  
  if (parts[0].length === 4) {
    const [year, month, day] = parts.map(Number);
    const date = new Date(year, month - 1, day);
    return isNaN(date.getTime()) ? null : date;
  } else {
    const [day, month, year] = parts.map(Number);
    const date = new Date(year, month - 1, day);
    return isNaN(date.getTime()) ? null : date;
  }
}

export function normalizeDateToYYYYMMDD(val: any): string | null {
  if (!val) return null;
  if (val instanceof Date) {
    return getLocalDateString(val);
  }
  if (typeof val !== "string") return null;
  const trimmed = val.trim();
  if (trimmed === "" || trimmed === "N/A") return null;
  
  // If already YYYY-MM-DD (e.g. 2024-12-25)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  
  // If YYYY-MM-DD... (with ISO suffix, e.g. 2024-12-25T00:00:00)
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
    return trimmed.split('T')[0];
  }
  
  // If DD-MM-YYYY or DD/MM/YYYY
  const parts = trimmed.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      // DD-MM-YYYY
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    } else if (parts[0].length === 4) {
      // YYYY-MM-DD
      const [year, month, day] = parts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  }
  
  // Fallback to new Date parsing
  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return getLocalDateString(d);
    }
  } catch (e) {
    // Ignore
  }
  
  return trimmed;
}

