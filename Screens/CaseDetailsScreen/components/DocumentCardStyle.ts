// Screens/CaseDetailsScreen/components/DocumentCardStyle.ts
import { StyleSheet } from 'react-native';

import { Theme } from '../../../Providers/ThemeProvider'; // Adjust path as needed

// const PRIMARY_BLUE = '#3B82F6';
// const SOFT_GRAY_TEXT = '#6B7280';
// const DARK_TEXT = '#1F2937';
// const CARD_BACKGROUND = '#FFFFFF';
// const ICON_BACKGROUND_BLUE = '#DBEAFE';

export const getDocumentCardStyles = (theme: Theme) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground || theme.colors.background, // Assuming a cardBackground in theme or fallback
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: theme.colors.shadow || '#4B5563',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  documentIconContainer: {
    marginRight: 16,
    padding: 0,
    backgroundColor: theme.colors.primaryLight || '#DBEAFE', // A lighter version of primary
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentIcon: {
    color: theme.colors.primary,
  },
  textInfoContainer: {
    flex: 1,
    marginRight: 12,
  },
  documentName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 3,
  },
  documentDate: {
    fontSize: 13,
    color: theme.colors.textSecondary || '#6B7280',
  },
  downloadIconContainer: {
    // Styles for the IconOnlyButton wrapper if needed
  }
});
