import { useNavigation } from "@react-navigation/native";
import React, { useContext } from "react";
import { StyleSheet, Text, Pressable, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

import { ThemeContext } from "../../../Providers/ThemeProvider";
import { CaseDataScreen } from "../../../Types/appTypes";
import { formatDate, parseLocalDate } from "../../../utils/commonFunctions";

interface NewCaseCardProps {
  caseDetails: CaseDataScreen;
  onUpdateHearingPress?: (caseDetails: CaseDataScreen) => void;
}

const statusColors = {
  Active: "#10B981", // Green
  Pending: "#F59E0B", // Amber
  Closed: "#64748B", // Slate Grey
};

const statusBgColors = {
  Active: "rgba(16, 185, 129, 0.12)",
  Pending: "rgba(245, 158, 11, 0.12)",
  Closed: "rgba(100, 116, 139, 0.12)",
};

const priorityColors = {
  High: "#EF4444", // Crimson/Red
  Medium: "#F59E0B", // Amber/Orange
  Low: "#10B981", // Emerald/Green
};

const priorityBgColors = {
  High: "rgba(239, 68, 68, 0.12)",
  Medium: "rgba(245, 158, 11, 0.12)",
  Low: "rgba(16, 185, 129, 0.12)",
};

const NewCaseCard: React.FC<NewCaseCardProps> = ({
  caseDetails,
  onUpdateHearingPress,
}) => {
  const { theme } = useContext(ThemeContext);
  const {
    title,
    client,
    status,
    nextHearing,
    lastUpdate,
    previousHearing,
    id,
    priority,
  } = caseDetails;
  const navigation = useNavigation();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handleUpdatePress = () => {
    if (onUpdateHearingPress) {
      onUpdateHearingPress(caseDetails);
    } else {
      console.log("Update Hearing pressed for case ID:", id);
    }
  };

  const casePriority = priority || "Low";

  // 1. Calculate Overdue / Undated status (Strictly past due or undated)
  const isHearingOverdueOrUndated = () => {
    const rawDateStr = caseDetails.NextDate || caseDetails.nextHearing;
    if (
      !rawDateStr ||
      rawDateStr === "N/A" ||
      rawDateStr === "Undated" ||
      rawDateStr === "Invalid Date"
    )
      return true;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let hDate: Date | null = parseLocalDate(rawDateStr);
      if (!hDate) {
        const isoPart = rawDateStr.split("T")[0];
        const parsed = new Date(isoPart);
        if (!isNaN(parsed.getTime())) {
          hDate = parsed;
        }
      }

      if (hDate) {
        hDate.setHours(0, 0, 0, 0);
        return hDate.getTime() < today.getTime(); // Strictly BEFORE today (past due)
      }
    } catch (e) {}

    return false;
  };

  const isActionNeeded = isHearingOverdueOrUndated();

  // 2. Date Hearing Fee Calculation (Default to ₹350 if not specified)
  const dtFeeAgreed =
    caseDetails.date_fee != null && caseDetails.date_fee > 0
      ? caseDetails.date_fee
      : 350;
  const dtColl = caseDetails.date_fee_collected || 0;
  const dtPaid = caseDetails.date_fee_paid || 0;
  const dtBalance = Math.max(0, dtFeeAgreed - dtColl);

  const isDateFeeFullyPaid =
    (dtColl >= dtFeeAgreed && dtFeeAgreed > 0) ||
    (dtPaid === 1 && dtColl >= dtFeeAgreed);
  const isDateFeePartial =
    !isDateFeeFullyPaid && dtColl > 0 && dtColl < dtFeeAgreed;
  const isDateFeePending = !isDateFeeFullyPaid && dtColl === 0;

  // 3. Total Retainer Fee Calculation
  const totFee = caseDetails.total_fee || 0;
  const pdFee = caseDetails.fee_paid || 0;
  const totBal = Math.max(0, totFee - pdFee);

  const isRetainerPartial = totFee > 0 && pdFee > 0 && totBal > 0;
  const isRetainerUnpaid = totFee > 0 && pdFee === 0;

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.97, {
          damping: 25,
          stiffness: 400,
          mass: 0.4,
        });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 25, stiffness: 400, mass: 0.4 });
      }}
      onPress={() => navigation.navigate("CaseDetails", { caseId: id })}
      style={{ width: "100%" }}
    >
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.cardBackground,
            borderColor: theme.colors.border,
            borderWidth: 1,
          },
          animatedStyle,
        ]}
      >
        {/* Visual Priority Indicator Accent Bar on the Left */}
        <View
          style={[
            styles.accentBar,
            {
              backgroundColor:
                priorityColors[casePriority as keyof typeof priorityColors] ||
                priorityColors.Low,
            },
          ]}
        />
        <View style={styles.cardContent}>
          <View style={styles.headerContainer}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {title}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flexWrap: "wrap",
                justifyContent: "flex-end",
                gap: 4,
              }}
            >
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor:
                      priorityBgColors[
                        casePriority as keyof typeof priorityBgColors
                      ] || priorityBgColors.Low,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color:
                        priorityColors[
                          casePriority as keyof typeof priorityColors
                        ] || priorityColors.Low,
                    },
                  ]}
                >
                  {casePriority}
                </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor:
                      statusBgColors[status as keyof typeof statusBgColors] ||
                      statusBgColors.Active,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color:
                        statusColors[status as keyof typeof statusColors] ||
                        statusColors.Active,
                    },
                  ]}
                >
                  {status}
                </Text>
              </View>
            </View>
          </View>

          {/* ACTION NEEDED & FINANCIAL STATUS BADGES ROW */}
          {(isActionNeeded ||
            isDateFeePending ||
            isDateFeePartial ||
            isRetainerUnpaid ||
            isRetainerPartial) && (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: 8,
              }}
            >
              {/* 1. Date Action Badge */}
              {isActionNeeded && (
                <View
                  style={{
                    backgroundColor: theme.isDark ? "#7F1D1D" : "#FEF2F2",
                    borderColor: theme.isDark ? "#991B1B" : "#FCA5A5",
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: theme.isDark ? "#F87171" : "#DC2626",
                    }}
                  >
                    🚨 Update Date Needed
                  </Text>
                </View>
              )}

              {/* 2. Hearing Date Fee Badges (Matching Fee & Retainer Hub Spotlight) */}
              {isDateFeePending && (
                <View
                  style={{
                    backgroundColor: theme.isDark ? "#7F1D1D" : "#FEF2F2",
                    borderColor: theme.isDark ? "#991B1B" : "#FCA5A5",
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: theme.isDark ? "#F87171" : "#DC2626",
                    }}
                  >
                    ⚠️ Date Fee Pending: ₹{dtBalance.toLocaleString("en-IN")}
                  </Text>
                </View>
              )}
              {isDateFeePartial && (
                <View
                  style={{
                    backgroundColor: theme.isDark ? "#78350F" : "#FEF3C7",
                    borderColor: theme.isDark ? "#B45309" : "#FDE68A",
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: theme.isDark ? "#FDE68A" : "#D97706",
                    }}
                  >
                    ⏳ Date Fee Partially Paid: ₹
                    {dtBalance.toLocaleString("en-IN")}
                  </Text>
                </View>
              )}

              {/* 3. Retainer Fee Status Badges */}
              {isRetainerPartial && (
                <View
                  style={{
                    backgroundColor: theme.isDark ? "#78350F" : "#FEF3C7",
                    borderColor: theme.isDark ? "#B45309" : "#FDE68A",
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: theme.isDark ? "#FDE68A" : "#D97706",
                    }}
                  >
                    ⏳ Retainer Partial (Bal: ₹{totBal.toLocaleString("en-IN")})
                  </Text>
                </View>
              )}
              {isRetainerUnpaid && (
                <View
                  style={{
                    backgroundColor: theme.isDark ? "#7F1D1D" : "#FEF2F2",
                    borderColor: theme.isDark ? "#991B1B" : "#FCA5A5",
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: theme.isDark ? "#F87171" : "#DC2626",
                    }}
                  >
                    ⚠️ Retainer Unpaid: ₹{totFee.toLocaleString("en-IN")}
                  </Text>
                </View>
              )}
            </View>
          )}

          <Text
            style={[styles.clientInfo, { color: theme.colors.textSecondary }]}
          >
            Client:{" "}
            <Text style={{ color: theme.colors.text, fontWeight: "600" }}>
              {client}
            </Text>
          </Text>

          <View
            style={[
              styles.detailsContainer,
              {
                borderTopColor: theme.colors.border,
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.detailRow}>
              <Text
                style={[
                  styles.detailLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Next Hearing:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {formatDate(nextHearing)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text
                style={[
                  styles.detailLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Last Update:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {formatDate(lastUpdate)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text
                style={[
                  styles.detailLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Previous Hearing:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {formatDate(previousHearing)}
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.updateButton,
              {
                backgroundColor: theme.colors.primary,
                transform: [{ scale: pressed ? 0.97 : 1 }],
                opacity: pressed ? 0.96 : 1,
              },
            ]}
            onPress={handleUpdatePress}
          >
            <Text style={styles.updateButtonText}>Update Hearing</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: "row",
    overflow: "hidden",
  },
  accentBar: {
    width: 5,
    height: "100%",
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
    lineHeight: 22,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  clientInfo: {
    fontSize: 14,
    marginBottom: 12,
  },
  detailsContainer: {
    marginBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    marginVertical: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  updateButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  updateButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default React.memo(NewCaseCard, (prevProps, nextProps) => {
  const p = prevProps.caseDetails as any;
  const n = nextProps.caseDetails as any;
  return (
    p.id === n.id &&
    p.title === n.title &&
    p.client === n.client &&
    p.status === n.status &&
    p.nextHearing === n.nextHearing &&
    p.lastUpdate === n.lastUpdate &&
    p.previousHearing === n.previousHearing &&
    p.priority === n.priority &&
    p.total_fee === n.total_fee &&
    p.fee_paid === n.fee_paid &&
    p.date_fee === n.date_fee &&
    p.date_fee_collected === n.date_fee_collected &&
    p.date_fee_paid === n.date_fee_paid &&
    p.totalFee === n.totalFee &&
    p.feePaid === n.feePaid &&
    p.dateFee === n.dateFee &&
    p.dateFeeCollected === n.dateFeeCollected
  );
});
