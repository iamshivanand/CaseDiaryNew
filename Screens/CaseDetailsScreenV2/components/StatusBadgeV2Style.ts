// Screens/CaseDetailsScreenV2/components/StatusBadgeV2Style.ts
import { StyleSheet } from 'react-native';

// Using Tailwind color palette names for reference
const DARK_TEXT = '#1F2937';         // gray-800
const LIGHT_GRAY_BG = '#F3F4F6';     // gray-100 (alternative pill background)
const DEFAULT_PILL_BG = '#E5E7EB';   // gray-200 (current pill background)
const WHITE_TEXT = '#FFFFFF';

// Status specific colors (examples, can be themed)
const STATUS_GREEN_BG = '#D1FAE5';     // green-100
const STATUS_GREEN_TEXT = '#065F46';   // green-800

const STATUS_BLUE_BG = '#DBEAFE';      // blue-100
const STATUS_BLUE_TEXT = '#1E40AF';    // blue-800

const STATUS_YELLOW_BG = '#FEF3C7';    // yellow-100
const STATUS_YELLOW_TEXT = '#92400E';  // yellow-800

const STATUS_RED_BG = '#FEE2E2';        // red-100
const STATUS_RED_TEXT = '#991B1B';      // red-800

const STATUS_GRAY_BG = DEFAULT_PILL_BG; // gray-200
const STATUS_GRAY_TEXT = DARK_TEXT;     // gray-800


export const StatusBadgeV2Styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12, // Increased horizontal padding for better look
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600', // Medium-bold
  },
  // Specific styles per status for better visual distinction
  open: {
    backgroundColor: STATUS_GREEN_BG,
  },
  openText: {
    color: STATUS_GREEN_TEXT,
  },
  inProgress: {
    backgroundColor: STATUS_BLUE_BG,
  },
  inProgressText: {
    color: STATUS_BLUE_TEXT,
  },
  closed: {
    backgroundColor: STATUS_RED_BG,
  },
  closedText: {
    color: STATUS_RED_TEXT,
  },
  onHold: {
    backgroundColor: STATUS_YELLOW_BG,
  },
  onHoldText: {
    color: STATUS_YELLOW_TEXT,
  },
  appealed: {
    backgroundColor: STATUS_BLUE_BG, // Same as In Progress or choose another
  },
  appealedText: {
    color: STATUS_BLUE_TEXT,
  },
  defaultStatus: {
    backgroundColor: STATUS_GRAY_BG,
  },
  defaultStatusText: {
    color: STATUS_GRAY_TEXT,
  },
});
