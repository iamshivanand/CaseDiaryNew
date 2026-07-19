/**
 * Safely parses a JSON string, returning a fallback value if parsing throws an exception.
 */
export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch (e) {
    console.warn("JSON parsing failure, falling back to default:", e);
    return fallback;
  }
}
