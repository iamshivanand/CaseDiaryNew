// Screens/CaseDetailsScreen/components/DateRowStyle.ts
import { StyleSheet } from 'react-native';
import { Theme } from '../../../Providers/ThemeProvider'; // Adjust path as needed

// const SOFT_GRAY_TEXT = '#6B7280';
// const DARK_TEXT = '#1F2937';

export const getDateRowStyles = (theme: Theme) => StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    marginRight: 8,
    color: theme.colors.textSecondary || '#6B7280', // Use theme secondary text or fallback
  },
  label: {
    fontSize: 14,
    color: theme.colors.textSecondary || '#6B7280', // Use theme secondary text or fallback
    fontWeight: '500',
    marginRight: 4,
  },
  value: {
    fontSize: 14,
    color: theme.colors.text, // Use theme text color
    fontWeight: '500',
  },
  valueNotSet: {
    fontSize: 14,
    color: theme.colors.textSecondary || '#6B7280',
    fontStyle: 'italic',
    fontWeight: '500',
  }
});
