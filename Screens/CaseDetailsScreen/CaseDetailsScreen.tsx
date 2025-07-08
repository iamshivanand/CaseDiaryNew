import { Feather } from "@expo/vector-icons";
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
// Import the more comprehensive CaseData type for mapping
import { CaseData } from "../../Types/appTypes"; // Adjust path if necessary
import { RootStackParamList } from "../../Types/navigationtypes"; // For StackNavigationProp

export interface CaseDetails { // This is the type this screen currently receives
  uniqueId: string;
  id?: number | string;
  caseNumber?: string; // Often used as a title or primary identifier
  court?: string;
  dateFiled?: Date; // Note: This is a Date object
  caseType?: string;
  // Potentially other summary fields
}

// RootStackParamList is now imported from navigationtypes
// type RootStackParamList = {
//   CaseDetail: { caseDetails: CaseDetails }; // Changed from caseDetailScreen for consistency
//   EditCase: { initialCaseData?: Partial<CaseData> };
//   AddCaseDetails?: { update?: boolean; initialValues?: CaseDetails }; // Keeping for now if used elsewhere
// };

type CaseDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  "CaseDetail" // Assuming 'CaseDetail' is the route name for this screen in navigationtypes.ts
>;

type CaseDetailScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "CaseDetail" // Assuming 'CaseDetail' is the route name
>;

type Props = {
  route: CaseDetailScreenRouteProp;
  navigation: CaseDetailScreenNavigationProp;
};

const CaseDetail: React.FC<Props> = ({ route, navigation }) => {
  const { caseDetails } = route.params;

  return (
    <ScrollView
      style={styles.container}
      scrollEventThrottle={16}
      decelerationRate="fast"
    >
      <View style={styles.HeadingContainer}>
        <Text style={styles.title}>Case Details</Text>
        <TouchableOpacity
          onPress={() => {
            // Map local caseDetails to the more comprehensive CaseData structure
            const initialEditData: Partial<CaseData> = {
              uniqueId: caseDetails.uniqueId,
              id: caseDetails.id,
              // Assuming caseDetails.caseNumber is the main identifiable string/title
              CaseTitle: caseDetails.caseNumber,
              // case_number: caseDetails.caseNumber, // Or if it's strictly a number/code
              court_name: caseDetails.court, // For display; EditCaseScreen uses court_id for dropdown
              FiledDate: caseDetails.dateFiled?.toISOString(), // Convert Date to ISO string
              case_type_name: caseDetails.caseType, // For display; EditCaseScreen uses case_type_id
              // Documents and TimelineEvents are not available in this simplified CaseDetails object
              // EditCaseScreen will use its defaults or fetch them if it's enhanced to do so.
            };
            navigation.navigate("EditCase", {
              initialCaseData: initialEditData,
            });
          }}
        >
          <View style={styles.EditButton}>
            <Text style={styles.EditButtonText}>Edit</Text>
            <Feather name="edit" size={20} color="#ebebeb" />
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.DetailsTextContainer}>
        {Object.entries(caseDetails).map(
          ([key, value]: [string, string], index) => (
            <View key={index} style={styles.detail}>
              <Text style={styles.DetailsText}>
                {key}: {value}
              </Text>
            </View>
          )
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 0,
  },
  HeadingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  EditButton: {
    flexDirection: "row",
    height: 40,
    width: 100,
    justifyContent: "space-evenly",
    alignItems: "center",
    backgroundColor: "#44d637",
    borderRadius: 5,
    color: "white",
    elevation: 5,
    shadowColor: "#7a7474",
    shadowOffset: { width: 5, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    margin: 4,
  },
  EditButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  detail: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    padding: 5,
    fontSize: 18,
    marginBottom: 10,
    borderRadius: 5,
  },
  DetailsTextContainer: {
    marginBottom: 30,
  },
  DetailsText: {
    fontSize: 20,
  },
});

export default CaseDetail;
