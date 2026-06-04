import { useNavigation } from "@react-navigation/native";
import React, { useContext } from "react";
import { StyleSheet, Text, Pressable, View } from "react-native";
import { CaseDataScreen } from "../../../Types/appTypes";
import { formatDate } from "../../../utils/commonFunctions";
import { ThemeContext } from "../../../Providers/ThemeProvider";

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
  const { title, client, status, nextHearing, lastUpdate, previousHearing, id, priority } =
    caseDetails;
  const navigation = useNavigation();
  const handleUpdatePress = () => {
    if (onUpdateHearingPress) {
      onUpdateHearingPress(caseDetails);
    } else {
      console.log("Update Hearing pressed for case ID:", id);
    }
  };

  const casePriority = priority || "Low";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.cardBackground,
          borderColor: theme.colors.border,
          borderWidth: 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          opacity: pressed ? 0.98 : 1,
        },
      ]}
      onPress={() =>
        navigation.navigate("CaseDetails", { caseId: id })
      }
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
          <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>
            {title}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    priorityBgColors[casePriority as keyof typeof priorityBgColors] ||
                    priorityBgColors.Low,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color:
                      priorityColors[casePriority as keyof typeof priorityColors] ||
                      priorityColors.Low,
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
                  marginLeft: 6,
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
        
        <Text style={[styles.clientInfo, { color: theme.colors.textSecondary }]}>
          Client: <Text style={{ color: theme.colors.text, fontWeight: "600" }}>{client}</Text>
        </Text>
        
        <View style={[styles.detailsContainer, { borderTopColor: theme.colors.border, borderBottomColor: theme.colors.border }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Next Hearing:</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>{formatDate(nextHearing)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Last Update:</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>{formatDate(lastUpdate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Previous Hearing:</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>{formatDate(previousHearing)}</Text>
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
  return (
    prevProps.caseDetails.id === nextProps.caseDetails.id &&
    prevProps.caseDetails.title === nextProps.caseDetails.title &&
    prevProps.caseDetails.client === nextProps.caseDetails.client &&
    prevProps.caseDetails.status === nextProps.caseDetails.status &&
    prevProps.caseDetails.nextHearing === nextProps.caseDetails.nextHearing &&
    prevProps.caseDetails.lastUpdate === nextProps.caseDetails.lastUpdate &&
    prevProps.caseDetails.previousHearing === nextProps.caseDetails.previousHearing &&
    prevProps.caseDetails.priority === nextProps.caseDetails.priority
  );
});

