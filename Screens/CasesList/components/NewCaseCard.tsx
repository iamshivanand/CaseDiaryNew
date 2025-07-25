import { useNavigation } from "@react-navigation/native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"; // Removed Dimensions
import { CaseDataScreen } from "../../../Types/appTypes"; // Adjust path as necessary
import { formatDate } from "../../../utils/commonFunctions";

interface NewCaseCardProps {
  caseDetails: CaseDataScreen;
  onUpdateHearingPress?: (caseDetails: CaseDataScreen) => void;
}

import { ThemeContext } from "../../../Providers/ThemeProvider";
import { useContext } from "react";

const NewCaseCard: React.FC<NewCaseCardProps> = ({
  caseDetails,
  onUpdateHearingPress,
}) => {
  const { theme } = useContext(ThemeContext);
  const { title, client, status, nextHearing, lastUpdate, previousHearing, id } =
    caseDetails;
  const navigation = useNavigation();
  const handleUpdatePress = () => {
    if (onUpdateHearingPress) {
      onUpdateHearingPress(caseDetails);
    } else {
      console.log("Update Hearing pressed for case ID:", id);
    }
  };

  const statusColors = {
    Active: theme.colors.primary,
    Pending: theme.colors.secondary,
    Closed: "#9E9E9E",
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: 16,
      marginVertical: 8,
      marginHorizontal: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    headerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    title: {
      fontSize: theme.fontSizes.heading,
      fontFamily: theme.fontStyles.bold,
      color: theme.colors.text,
      flexShrink: 1,
    },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 8,
    },
    badgeText: {
      color: theme.colors.background,
      fontSize: theme.fontSizes.caption,
      fontFamily: theme.fontStyles.semiBold,
    },
    clientInfo: {
      fontSize: theme.fontSizes.body,
      fontFamily: theme.fontStyles.regular,
      color: theme.colors.secondary,
      marginBottom: 12,
    },
    detailsContainer: {
      marginBottom: 12,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    detailLabel: {
      fontSize: theme.fontSizes.caption,
      fontFamily: theme.fontStyles.regular,
      color: theme.colors.secondary,
    },
    detailValue: {
      fontSize: theme.fontSizes.caption,
      fontFamily: theme.fontStyles.semiBold,
      color: theme.colors.text,
    },
    updateButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 6,
      alignItems: "center",
      marginTop: 8,
    },
    updateButtonText: {
      color: theme.colors.background,
      fontSize: theme.fontSizes.body,
      fontFamily: theme.fontStyles.bold,
    },
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate("CaseDetails", { caseId: id })
      }
    >
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{title}</Text>
        <View
          style={[styles.badge, { backgroundColor: statusColors[status] }]}
        >
          <Text style={styles.badgeText}>{status}</Text>
        </View>
      </View>
      <Text style={styles.clientInfo}>Client: {client}</Text>
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Next Hearing:</Text>
          <Text style={styles.detailValue}>{formatDate(nextHearing)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Last Update:</Text>
          <Text style={styles.detailValue}>{formatDate(lastUpdate)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Previous Hearing:</Text>
          <Text style={styles.detailValue}>{formatDate(previousHearing)}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.updateButton} onPress={handleUpdatePress}>
        <Text style={styles.updateButtonText}>Update Hearing</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default NewCaseCard;
