// Screens/CaseDetailsScreen/components/StatusBadgeStyle.ts
import { StyleSheet } from "react-native";
import { theme as appTheme } from "../../../styles/theme";

export const getStatusBadgeStyles = (theme: typeof appTheme) =>
  StyleSheet.create({
    badge: {
      alignSelf: "flex-start",
      borderRadius: 16,
      paddingVertical: 4,
      paddingHorizontal: 12,
      marginBottom: 16,
    },
    badgeText: {
      fontSize: theme.fontSizes.caption,
      fontFamily: theme.fontStyles.semiBold,
    },
    open: {
      backgroundColor: theme.colors.primary,
    },
    openText: {
      color: theme.colors.background,
    },
    inProgress: {
      backgroundColor: theme.colors.secondary,
    },
    inProgressText: {
      color: theme.colors.background,
    },
    closed: {
      backgroundColor: "#dc3545",
    },
    closedText: {
      color: theme.colors.background,
    },
    onHold: {
      backgroundColor: "#ffc107",
    },
    onHoldText: {
      color: theme.colors.background,
    },
    appealed: {
      backgroundColor: "#17a2b8",
    },
    appealedText: {
      color: theme.colors.background,
    },
    defaultStatus: {
      backgroundColor: theme.colors.secondary,
    },
    defaultStatusText: {
      color: theme.colors.background,
    },
  });

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
