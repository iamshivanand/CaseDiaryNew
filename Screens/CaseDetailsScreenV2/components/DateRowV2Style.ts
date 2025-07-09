// Screens/CaseDetailsScreenV2/components/DateRowV2Style.ts
import { StyleSheet } from 'react-native';

const SOFT_GRAY_TEXT = '#6B7280'; // Tailwind gray-500
const DARK_TEXT = '#1F2937';     // Tailwind gray-800

export const DateRowV2Styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    marginRight: 8, // Adjusted spacing
    color: SOFT_GRAY_TEXT,
  },
  label: {
    fontSize: 14,
    color: SOFT_GRAY_TEXT,
    fontWeight: '500', // Medium weight for label
    marginRight: 4, // Slightly less space after colon
  },
  value: {
    fontSize: 14,
    color: DARK_TEXT,
    fontWeight: '500', // Consistent weight
  },
  valueNotSet: {
    fontSize: 14,
    color: SOFT_GRAY_TEXT, // Same as label for N/A
    fontStyle: 'italic',
    fontWeight: '500',
  }
});
