import { formatDate } from '../commonFunctions';

describe('commonFunctions', () => {
  describe('formatDate', () => {
    it('should format a valid ISO-like date string correctly', () => {
      expect(formatDate('2023-01-15T10:00:00.000Z')).toBe('2023-01-15');
    });

    it('should format a date string with single digit month and day with padding', () => {
      expect(formatDate('2023-03-05T10:00:00.000Z')).toBe('2023-03-05');
    });

    it('should handle a full date string like "YYYY-MM-DD HH:MM:SS" correctly', () => {
      expect(formatDate('2024-07-26 14:30:00')).toBe('2024-07-26');
    });

    it('should handle a date string with only YYYY-MM-DD', () => {
      expect(formatDate('2023-11-20')).toBe('2023-11-20');
    });

    it('should return "NaN-NaN-NaN" for an invalid date string', () => {
      // The default behavior of new Date() with invalid string
      expect(formatDate('not a real date')).toBe('NaN-NaN-NaN');
    });

    it('should handle a Date object input correctly', () => {
      const dateObj = new Date(2022, 11, 25); // Month is 0-indexed, so 11 is December
      expect(formatDate(dateObj.toISOString())).toBe('2022-12-25');
    });

    it('should handle dates at the beginning of a month', () => {
      expect(formatDate('2023-12-01T00:00:00.000Z')).toBe('2023-12-01');
    });

    it('should handle dates at the end of a month', () => {
      expect(formatDate('2023-01-31T23:59:59.999Z')).toBe('2023-01-31');
    });

    // Example of how new Date() parses slightly different formats
    it('should handle date string in "MM/DD/YYYY" format if parsable by Date constructor', () => {
      // Note: Date constructor parsing of non-ISO strings is implementation-dependent
      // This test might be fragile if the environment's Date parser is strict.
      // For "MM/DD/YYYY", it often works.
      const date = new Date('04/08/2023');
      if (!isNaN(date.getTime())) { // Check if Date constructor parsed it successfully
          expect(formatDate('04/08/2023')).toBe('2023-04-08');
      } else {
          console.warn('Skipping MM/DD/YYYY test as Date constructor could not parse it in this environment.');
          expect(true).toBe(true); // Avoid test failure if not parsable
      }
    });

  });
});
