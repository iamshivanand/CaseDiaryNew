// Screens/CaseDetailsScreenV2/components/DocumentCardV2Style.ts
import { StyleSheet } from 'react-native';

const PRIMARY_BLUE = '#3B82F6';    // Tailwind blue-500
const SOFT_GRAY_TEXT = '#6B7280';  // Tailwind gray-500
const DARK_TEXT = '#1F2937';      // Tailwind gray-800
const CARD_BACKGROUND = '#FFFFFF'; // Use white for cards for cleaner look, or #F9FAFB (gray-50)
const ICON_BACKGROUND_BLUE = '#DBEAFE'; // Tailwind blue-100 for icon background

export const DocumentCardV2Styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 10, // Slightly more rounded
    padding: 16, // Increased padding
    // marginHorizontal: 20, // Main screen will have padding, card itself not
    marginBottom: 12, // Space between cards
    elevation: 2,
    shadowColor: '#4B5563', // gray-600 for shadow, more subtle than black
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, // Softer shadow
    shadowRadius: 4,   // Softer shadow
  },
  documentIconContainer: {
    marginRight: 16, // Increased spacing
    padding: 0, // IconOnlyButton will have padding, or direct Icon here
    backgroundColor: ICON_BACKGROUND_BLUE,
    borderRadius: 22, // To make it circular for a 44x44 container
    width: 44, // Standard touch target size
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentIcon: {
    color: PRIMARY_BLUE,
  },
  textInfoContainer: {
    flex: 1,
    marginRight: 12,
  },
  documentName: {
    fontSize: 15,
    fontWeight: '600', // Semibold
    color: DARK_TEXT,
    marginBottom: 3, // Slightly more space
  },
  documentDate: {
    fontSize: 13, // Slightly larger date
    color: SOFT_GRAY_TEXT,
    marginBottom: 2, // Add some space if template type is below
  },
  documentMeta: { // Style for template_type or other metadata
    fontSize: 12,
    color: SOFT_GRAY_TEXT, // Same as date for consistency
    fontStyle: 'italic', // Differentiate it a bit
  },
  downloadIconContainer: { // For the IconOnlyButton wrapper of download icon
    // IconOnlyButton already has padding. Add margin if needed.
    // marginLeft: 8,
  }
});
