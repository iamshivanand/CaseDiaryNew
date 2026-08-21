// Screens/CaseDetailsScreen/components/TimelineEventItem.tsx
import { Ionicons } from "@expo/vector-icons";
import { parseISO, isValid, format } from "date-fns";
import React, { useContext } from "react";
import { View, Text, TouchableOpacity } from "react-native";

import { getTimelineEventItemStyles } from "./TimelineEventItemStyle";
import { useTranslation } from "../../../Providers/LanguageProvider";
import { ThemeContext } from "../../../Providers/ThemeProvider";
import { TimelineEvent } from "../../../Types/appTypes";

interface TimelineEventItemProps {
  event: TimelineEvent;
  isLastItem?: boolean;
  onEditNotes?: (event: TimelineEvent) => void;
  onDeleteNotes?: (event: TimelineEvent) => void;
}

const TimelineEventItem: React.FC<TimelineEventItemProps> = ({
  event,
  isLastItem = false,
  onEditNotes,
  onDeleteNotes,
}) => {
  const { theme } = useContext(ThemeContext);
  const { t, locale } = useTranslation();
  const styles = getTimelineEventItemStyles(theme);

  const formattedHearingDate = () => {
    if (typeof event.date !== "string" || !event.date) {
      return t("timeline_date_na");
    }
    try {
      const dateObj = parseISO(event.date);
      return isValid(dateObj)
        ? dateObj.toLocaleDateString(locale === "hi" ? "hi-IN" : "en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : event.date;
    } catch (e) {
      return event.date;
    }
  };

  const formattedCreatedAtTime = () => {
    if (!event.created_at) return null;
    try {
      const dateObj = parseISO(event.created_at);
      if (isValid(dateObj)) {
        return format(dateObj, "hh:mm a");
      }
    } catch (e) {
      // ignore
    }
    return null;
  };

  const desc = event.description || "";
  const evType = event.event_type || "";

  const isDateFeePayment =
    evType === "date_fee_payment" || desc.includes("(Date Fee)");
  const isTotalFeePayment =
    evType === "total_fee_payment" ||
    desc.includes("(Total Retainer)") ||
    Boolean(desc.match(/(Fee Payment Received|Recorded Payment|Fee Received)/i));
  const isDateFeeAgreed =
    evType === "date_fee_agreed" || desc.includes("Date Hearing Fee Agreed");
  const isTotalFeeAgreed =
    evType === "total_fee_agreed" ||
    desc.includes("Total Retainer Fee Agreed") ||
    desc.includes("Total agreed retainer");
  const isHearingScheduled =
    evType === "hearing_scheduled" ||
    desc.startsWith("Initial hearing scheduled") ||
    desc.startsWith("Next hearing scheduled");
  const isHearingAdjourned =
    evType === "hearing_adjourned" ||
    desc.includes("Hearing adjourned") ||
    desc.includes("rescheduled");
  const isStatusChange =
    evType === "status_change" || desc.includes("Case status changed");
  const isJudgeChange =
    evType === "judge_change" || desc.includes("Presiding Judge");
  const isCourtChange =
    evType === "court_change" ||
    desc.includes("Court / Establishment") ||
    desc.includes("Court transferred");
  const isStageChange =
    evType === "stage_change" || desc.includes("Case stage");
  const isCaseCreated =
    evType === "case_created" || desc.includes("Case registered");

  const isPaymentOrFee =
    isDateFeePayment || isTotalFeePayment || isDateFeeAgreed || isTotalFeeAgreed;

  const getBadgeDetails = () => {
    if (isCaseCreated) {
      return {
        label: "📁 Registered",
        bg: theme.isDark ? "#134E4A" : "#F0FDFA",
        border: theme.isDark ? "#0D9488" : "#99F6E4",
        text: theme.isDark ? "#5EEAD4" : "#0D9488",
        dotColor: "#0D9488",
      };
    }
    if (isHearingScheduled) {
      return {
        label: "📅 Hearing Set",
        bg: theme.isDark ? "#1E3A8A" : "#EFF6FF",
        border: theme.isDark ? "#2563EB" : "#BFDBFE",
        text: theme.isDark ? "#93C5FD" : "#1D4ED8",
        dotColor: "#2563EB",
      };
    }
    if (isHearingAdjourned) {
      return {
        label: "📅 Adjourned",
        bg: theme.isDark ? "#0C4A6E" : "#F0F9FF",
        border: theme.isDark ? "#0284C7" : "#BAE6FD",
        text: theme.isDark ? "#7DD3FC" : "#0369A1",
        dotColor: "#0284C7",
      };
    }
    if (isStatusChange) {
      return {
        label: "🔄 Status",
        bg: theme.isDark ? "#3B0764" : "#FAF5FF",
        border: theme.isDark ? "#7C3AED" : "#E9D5FF",
        text: theme.isDark ? "#C084FC" : "#6D28D9",
        dotColor: "#7C3AED",
      };
    }
    if (isJudgeChange) {
      return {
        label: "⚖️ Judge Update",
        bg: theme.isDark ? "#78350F" : "#FFFBEB",
        border: theme.isDark ? "#D97706" : "#FDE68A",
        text: theme.isDark ? "#FCD34D" : "#B45309",
        dotColor: "#D97706",
      };
    }
    if (isCourtChange) {
      return {
        label: "🏛️ Court Transfer",
        bg: theme.isDark ? "#164E63" : "#ECFEFF",
        border: theme.isDark ? "#0891B2" : "#A5F3FC",
        text: theme.isDark ? "#67E8F9" : "#0E7490",
        dotColor: "#0891B2",
      };
    }
    if (isStageChange) {
      return {
        label: "🎯 Stage Progress",
        bg: theme.isDark ? "#4C1D95" : "#F5F3FF",
        border: theme.isDark ? "#8B5CF6" : "#DDD6FE",
        text: theme.isDark ? "#C4B5FD" : "#7C3AED",
        dotColor: "#8B5CF6",
      };
    }
    if (isDateFeeAgreed) {
      return {
        label: "🏷️ Date Fee Set",
        bg: theme.isDark ? "#311B92" : "#F3E8FF",
        border: theme.isDark ? "#6B21A8" : "#D8B4FE",
        text: theme.isDark ? "#D8B4FE" : "#7E22CE",
        dotColor: "#A855F7",
      };
    }
    if (isTotalFeeAgreed) {
      return {
        label: "🏷️ Retainer Agreed",
        bg: theme.isDark ? "#1E1B4B" : "#EEF2FF",
        border: theme.isDark ? "#4338CA" : "#C7D2FE",
        text: theme.isDark ? "#A5B4FC" : "#4338CA",
        dotColor: "#4F46E5",
      };
    }
    if (isDateFeePayment) {
      return {
        label: "💰 Date Fee Paid",
        bg: theme.isDark ? "#064E3B" : "#ECFDF5",
        border: theme.isDark ? "#059669" : "#A7F3D0",
        text: theme.isDark ? "#6EE7B7" : "#047857",
        dotColor: "#059669",
      };
    }
    if (isTotalFeePayment) {
      return {
        label: "💵 Retainer Paid",
        bg: theme.isDark ? "#14532D" : "#F0FDF4",
        border: theme.isDark ? "#16A34A" : "#BBF7D0",
        text: theme.isDark ? "#86EFAC" : "#15803D",
        dotColor: "#16A34A",
      };
    }
    return {
      label: "📋 Proceeding",
      bg: theme.isDark ? "#334155" : "#F8FAFC",
      border: theme.colors.border || "#E2E8F0",
      text: theme.colors.textSecondary || "#64748B",
      dotColor: theme.colors.primary,
    };
  };

  const badge = getBadgeDetails();
  const createdTime = formattedCreatedAtTime();

  return (
    <View style={styles.rowContainer}>
      <View style={styles.indicatorContainer}>
        <View style={[styles.dot, { backgroundColor: badge.dotColor }]} />
        {!isLastItem && <View style={styles.line} />}
      </View>
      <View
        style={[
          styles.contentBox,
          isPaymentOrFee ? { borderColor: badge.border, borderWidth: 1 } : {},
        ]}
      >
        {/* Top Header: Date, Time & Event Badge */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              flex: 1,
              flexWrap: "wrap",
            }}
          >
            <Text style={[styles.dateText, { marginBottom: 0 }]}>
              {formattedHearingDate()}
            </Text>
            {createdTime && (
              <Text
                style={{
                  fontSize: 11,
                  color: theme.colors.textSecondary,
                  fontWeight: "500",
                }}
              >
                • {createdTime}
              </Text>
            )}
            <View
              style={{
                backgroundColor: badge.bg,
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: badge.border,
              }}
            >
              <Text
                style={{ fontSize: 10, fontWeight: "700", color: badge.text }}
              >
                {badge.label}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {onEditNotes && (
              <TouchableOpacity
                onPress={() => onEditNotes(event)}
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 4 }}
              >
                <Ionicons
                  name="pencil-sharp"
                  size={16}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            )}
            {onDeleteNotes && (
              <TouchableOpacity
                onPress={() => onDeleteNotes(event)}
                hitSlop={{ top: 10, bottom: 10, left: 4, right: 8 }}
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Amount & Payment Mode Badges */}
        {((event.amount != null && event.amount > 0) ||
          Boolean(event.payment_mode)) && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
            }}
          >
            {event.amount != null && event.amount > 0 && (
              <View
                style={{
                  backgroundColor: theme.isDark ? "#064E3B" : "#ECFDF5",
                  borderWidth: 1,
                  borderColor: theme.isDark ? "#059669" : "#A7F3D0",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "800",
                    color: theme.isDark ? "#6EE7B7" : "#059669",
                  }}
                >
                  ₹{event.amount.toLocaleString("en-IN")}
                </Text>
              </View>
            )}
            {Boolean(event.payment_mode) && (
              <View
                style={{
                  backgroundColor: theme.isDark ? "#1E293B" : "#F1F5F9",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: theme.colors.textSecondary,
                  }}
                >
                  Mode: {event.payment_mode}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Description / Notes text */}
        <Text style={styles.descriptionText}>
          {desc || t("timeline_no_desc")}
        </Text>
      </View>
    </View>
  );
};

export default TimelineEventItem;
