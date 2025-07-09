// Screens/CaseDetailsScreenV2/components/TimelineEventItemV2Style.ts
import { StyleSheet } from 'react-native';

const PRIMARY_BLUE = '#3B82F6';    // Tailwind blue-500
const SOFT_GRAY_TEXT = '#6B7280';  // Tailwind gray-500
const DARK_TEXT = '#1F2937';      // Tailwind gray-800
const BORDER_GRAY = '#E5E7EB';     // Tailwind gray-200
const CONTENT_BOX_BG = '#FFFFFF'; // White background for content, or F9FAFB (gray-50)

export const TimelineEventItemV2Styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    marginBottom: 16, // Consistent spacing
  },
  indicatorContainer: {
    alignItems: 'center',
    marginRight: 12,
    width: 20,
  },
  dot: {
    width: 10, // Slightly smaller dot for a cleaner look
    height: 10,
    borderRadius: 5,
    backgroundColor: PRIMARY_BLUE,
    zIndex: 1,
    marginTop: 4, // Align dot with first line of text a bit better
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: BORDER_GRAY,
  },
  contentBox: {
    flex: 1,
    padding: 14, // Good padding
    backgroundColor: CONTENT_BOX_BG,
    borderRadius: 8,
    // Optional: add subtle border to content box
    // borderWidth: 1,
    // borderColor: BORDER_GRAY,
    // Or subtle shadow for a card-like feel
    elevation: 1,
    shadowColor: '#4B5563',
    shadowOffset: {width:0, height:1},
    shadowOpacity:0.06,
    shadowRadius:2,
  },
  dateText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: DARK_TEXT,
    marginBottom: 6, // More space
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 21,
    color: SOFT_GRAY_TEXT,
  },
});
