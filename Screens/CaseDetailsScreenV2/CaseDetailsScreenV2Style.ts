// Screens/CaseDetailsScreenV2/CaseDetailsScreenV2Style.ts
import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const PRIMARY_BLUE = '#3B82F6'; // Tailwind blue-500
const SOFT_GRAY_TEXT = '#6B7280'; // Tailwind gray-500
const DARK_TEXT = '#1F2937'; // Tailwind gray-800
const BORDER_GRAY = '#E5E7EB'; // Tailwind gray-200
const BACKGROUND_WHITE = '#FFFFFF';
const PILL_BACKGROUND_GRAY = '#E5E7EB'; // For status badge

export const CaseDetailsScreenV2Styles = StyleSheet.create({
  // Overall container
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_WHITE,
  },
  contentContainer: {
    paddingBottom: 80, // Space for fixed bottom actions + nav bar
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  // Case Summary Section
  summarySection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_GRAY,
  },
  mainCaseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: DARK_TEXT,
    marginBottom: 8,
  },
  clientName: {
    fontSize: 16,
    color: SOFT_GRAY_TEXT,
    marginBottom: 12,
  },
  statusBadge: { // Placeholder style for StatusBadgeV2 component
    alignSelf: 'flex-start',
    backgroundColor: PILL_BACKGROUND_GRAY,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  statusBadgeText: { // Placeholder style
    fontSize: 12,
    fontWeight: '500',
    color: DARK_TEXT,
  },
  dateRow: { // Placeholder style for DateRowV2 component
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateIcon: {
    marginRight: 8,
  },
  dateLabel: {
    fontSize: 14,
    color: SOFT_GRAY_TEXT,
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 14,
    color: DARK_TEXT,
  },

  // Case Description Section
  descriptionSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_GRAY,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: DARK_TEXT,
  },

  // Documents Section
  documentsSection: {
    paddingVertical: 20,
    // No horizontal padding here if cards have their own or FlatList handles it
  },
  documentCard: { // Placeholder style for DocumentCardV2
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB', // Tailwind gray-50
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 20, // Margin for the card itself
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  documentIcon: {
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
    marginRight: 8,
  },
  documentName: {
    fontSize: 15,
    fontWeight: '600',
    color: DARK_TEXT,
  },
  documentDate: {
    fontSize: 12,
    color: SOFT_GRAY_TEXT,
    marginTop: 2,
  },
  // Download icon would be part of DocumentCardV2, styled via ActionButton or IconOnlyButton

  // Case Timeline Section
  timelineSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  timelineRow: { // Placeholder for TimelineEventItemV2
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineIndicator: {
    alignItems: 'center',
    marginRight: 12,
    width: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: PRIMARY_BLUE,
    marginTop: 3, // Align with text
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: BORDER_GRAY,
  },
  timelineContent: {
    flex: 1,
  },
  timelineDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: DARK_TEXT,
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: SOFT_GRAY_TEXT,
  },
  noItemsText: {
      textAlign: 'center',
      color: SOFT_GRAY_TEXT,
      marginTop: 10,
      fontStyle: 'italic',
  },

  // Bottom Actions Footer
  bottomActionsContainer: {
    position: 'absolute',
    bottom: 0, // Adjust if there's a persistent BottomTabNavigator
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: BACKGROUND_WHITE,
    borderTopWidth: 1,
    borderTopColor: BORDER_GRAY,
    elevation: 4, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  bottomActionPrimary: {
    flex: 1,
    marginRight: 8, // Space between buttons
  },
  bottomActionSecondary: {
    flex: 1,
    marginLeft: 8, // Space between buttons
    // For ghost/light blue, ActionButton type="secondary" might need style tweaks
    // Or use a custom style prop for ActionButton
  },
});
