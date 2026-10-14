import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Safely parses a date/time string from SQLite or API into a JavaScript Date.
 * Handles SQLite's UTC timestamps (e.g. "2026-08-24 21:32:00" or "2026-08-24T21:32:00")
 * which lack the trailing 'Z', ensuring they are properly parsed as UTC and converted
 * to the user's local timezone.
 */
export function parseUtcDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

  if (typeof val !== "string") return null;
  let str = val.trim();
  if (!str) return null;

  // If it's a pure date "YYYY-MM-DD" or "DD-MM-YYYY", parse as local calendar date
  if (/^\d{4}-\d{2}-\d{2}$/.test(str) || /^\d{2}-\d{2}-\d{4}$/.test(str)) {
    return parseLocalDate(str);
  }

  // If it's SQLite datetime "YYYY-MM-DD HH:MM:SS(.SSS)"
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/.test(str)) {
    str = str.replace(" ", "T") + "Z";
  } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(str)) {
    // ISO string missing trailing Z or timezone offset
    str = str + "Z";
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(dateString: any): string {
  if (!dateString) {
    return "N/A";
  }
  try {
    if (dateString instanceof Date) {
      if (isNaN(dateString.getTime())) return "Invalid Date";
      const year = dateString.getFullYear();
      const month = String(dateString.getMonth() + 1).padStart(2, "0");
      const day = String(dateString.getDate()).padStart(2, "0");
      return `${day}-${month}-${year}`;
    }
    const str = String(dateString).trim();
    // If it's already in DD-MM-YYYY format, return as is
    if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
      return str;
    }
    // If it's pure YYYY-MM-DD date without time (e.g. "2026-08-25")
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [year, month, day] = str.split("-");
      return `${day}-${month}-${year}`;
    }
    const date = parseUtcDate(str);
    if (!date || isNaN(date.getTime())) {
      return "Invalid Date";
    }
    // Use device local calendar fields
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return "Invalid Date";
  }
}

/**
 * Formats a timestamp/date to device local time (e.g., "02:30 PM")
 */
export function formatTime(dateStringOrDate: any): string {
  if (!dateStringOrDate) return "";
  try {
    const d =
      dateStringOrDate instanceof Date
        ? dateStringOrDate
        : parseUtcDate(dateStringOrDate);
    if (!d || isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return "";
  }
}

/**
 * Formats a timestamp/date to device local date and time (e.g., "25-08-2026 • 02:30 PM")
 */
export function formatDateTime(dateStringOrDate: any): string {
  if (!dateStringOrDate) return "N/A";
  try {
    const d = parseUtcDate(dateStringOrDate);
    if (!d || isNaN(d.getTime())) return "Invalid Date";
    const datePart = formatDate(d);
    const timePart = formatTime(d);
    return timePart ? `${datePart} • ${timePart}` : datePart;
  } catch (e) {
    return "Invalid Date";
  }
}

export const getCurrentUserId = async (): Promise<number> => {
  const id = await AsyncStorage.getItem("@user_id");
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
    return trimmed.split("T")[0];
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
