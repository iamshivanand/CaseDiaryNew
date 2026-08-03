// Screens/CaseDetailsScreen/components/StatusBadgeStyle.ts
import { StyleSheet } from "react-native";

import { Theme } from "../../../Providers/ThemeProvider"; // Adjust path as needed

// Define base colors, but prefer theme if available
const DEFAULT_DARK_TEXT = "#1F2937";
const DEFAULT_WHITE_TEXT = "#FFFFFF";
const DEFAULT_STATUS_GRAY_BG = "#E5E7EB";

// Status specific colors (can be overridden by theme or used as fallback)
const STATUS_GREEN_BG_FALLBACK = "#D1FAE5";
const STATUS_GREEN_TEXT_FALLBACK = "#065F46";
const STATUS_BLUE_BG_FALLBACK = "#DBEAFE";
const STATUS_BLUE_TEXT_FALLBACK = "#1E40AF";
const STATUS_YELLOW_BG_FALLBACK = "#FEF3C7";
const STATUS_YELLOW_TEXT_FALLBACK = "#92400E";
const STATUS_RED_BG_FALLBACK = "#FEE2E2";
const STATUS_RED_TEXT_FALLBACK = "#991B1B";

export const getStatusBadgeStyles = (theme: Theme) => {
  const isDark = theme.isDark;
  return StyleSheet.create({
    badge: {
      alignSelf: "flex-start",
      borderRadius: 16,
      paddingVertical: 4,
      paddingHorizontal: 12,
      marginBottom: 16,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: "600",
    },
    open: {
      backgroundColor: isDark
        ? "#064E3B"
        : theme.colors.statusOpenBg || STATUS_GREEN_BG_FALLBACK,
    },
    openText: {
      color: isDark
        ? "#6EE7B7"
        : theme.colors.statusOpenText || STATUS_GREEN_TEXT_FALLBACK,
    },
    inProgress: {
      backgroundColor: isDark
        ? "#1E3A8A"
        : theme.colors.statusInProgressBg || STATUS_BLUE_BG_FALLBACK,
    },
    inProgressText: {
      color: isDark
        ? "#93C5FD"
        : theme.colors.statusInProgressText || STATUS_BLUE_TEXT_FALLBACK,
    },
    closed: {
      backgroundColor: isDark
        ? "#7F1D1D"
        : theme.colors.statusClosedBg || STATUS_RED_BG_FALLBACK,
    },
    closedText: {
      color: isDark
        ? "#FCA5A5"
        : theme.colors.statusClosedText || STATUS_RED_TEXT_FALLBACK,
    },
    onHold: {
      backgroundColor: isDark
        ? "#78350F"
        : theme.colors.statusOnHoldBg || STATUS_YELLOW_BG_FALLBACK,
    },
    onHoldText: {
      color: isDark
        ? "#FDE68A"
        : theme.colors.statusOnHoldText || STATUS_YELLOW_TEXT_FALLBACK,
    },
    appealed: {
      backgroundColor: isDark
        ? "#312E81"
        : theme.colors.statusAppealedBg || STATUS_BLUE_BG_FALLBACK,
    },
    appealedText: {
      color: isDark
        ? "#C7D2FE"
        : theme.colors.statusAppealedText || STATUS_BLUE_TEXT_FALLBACK,
    },
    defaultStatus: {
      backgroundColor: isDark
        ? "#334155"
        : theme.colors.border || DEFAULT_STATUS_GRAY_BG,
    },
    defaultStatusText: {
      color: isDark
        ? "#CBD5E1"
        : theme.colors.textSecondary || DEFAULT_DARK_TEXT,
    },
  });
};

// Extend Theme interface in ThemeProvider.tsx to include these status colors for full theming:
// interface ThemeColors {
//   primary: string; secondary: string; background: string; text: string;
//   border?: string; textSecondary?: string;
//   statusOpenBg?: string; statusOpenText?: string;
//   statusInProgressBg?: string; statusInProgressText?: string;
//   statusClosedBg?: string; statusClosedText?: string;
//   statusOnHoldBg?: string; statusOnHoldText?: string;
//   statusAppealedBg?: string; statusAppealedText?: string;
// }
// export interface Theme { colors: ThemeColors; }
