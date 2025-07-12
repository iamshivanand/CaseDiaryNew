// Screens/CaseDetailsScreen/CaseDetailsScreen.tsx
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useContext, useLayoutEffect } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native"; // Removed ScrollView
import { ThemeContext } from "../../Providers/ThemeProvider";
import { CaseDataScreen } from "../../Types/appTypes";
import { HomeStackParamList } from "../../Types/navigationtypes";
import ActionButton from "../CommonComponents/ActionButton";
import SectionHeader from "../CommonComponents/SectionHeader";
import DateRow from "./components/DateRow";
import StatusBadge from "./components/StatusBadge";

type CaseDetailsScreenRouteProp = RouteProp<HomeStackParamList, "CaseDetails">;

const CaseDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<CaseDetailsScreenRouteProp>();
  const { theme } = useContext(ThemeContext);
  const { caseDetails } = route.params;

  useLayoutEffect(() => {
    navigation.setOptions({ title: caseDetails.title });
  }, [navigation, caseDetails]);

  const handleEditCase = () => {
    // Navigate to an EditCase screen, passing the case details
    // @ts-ignore
    navigation.navigate("EditCase", { caseDetails });
  };

  const handleAddNewDocument = () => {
    // Navigate to a screen for adding documents
    // @ts-ignore
    navigation.navigate("AddDocument", { caseId: caseDetails.id });
  };

  const listData = [
    { type: "summary", data: caseDetails },
    // Add other sections like description, documents, timeline as needed
  ];

  const renderListItem = ({ item }: { item: { type: string; data: any } }) => {
    switch (item.type) {
      case "summary":
        return (
          <View style={styles.summarySection}>
            <Text style={styles.mainCaseTitle}>{item.data.title}</Text>
            <Text style={styles.clientName}>Client: {item.data.client}</Text>
            <StatusBadge status={item.data.status} />
            <DateRow
              label="Next Hearing"
              dateString={item.data.nextHearing}
              iconName="gavel"
            />
            <DateRow
              label="Previous Hearing"
              dateString={item.data.previousHearing}
              iconName="history"
            />
            <DateRow
              label="Last Update"
              dateString={item.data.lastUpdate}
              iconName="update"
            />
          </View>
        );
      // Add cases for other list item types here
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={listData}
        renderItem={renderListItem}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      />
      <View style={styles.bottomActionsContainer}>
        <ActionButton
          title="Edit Case"
          onPress={handleEditCase}
          type="primary"
          style={styles.bottomActionPrimary}
        />
        <ActionButton
          title="Add New Document"
          onPress={handleAddNewDocument}
          type="secondary"
          style={styles.bottomActionSecondary}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100, // Ensure content is not hidden by bottom actions
  },
  summarySection: {
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  mainCaseTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  clientName: {
    fontSize: 16,
    marginBottom: 12,
  },
  bottomActionsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  bottomActionPrimary: {
    flex: 1,
    marginRight: 8,
  },
  bottomActionSecondary: {
    flex: 1,
    marginLeft: 8,
  },
});

export default CaseDetailsScreen;
