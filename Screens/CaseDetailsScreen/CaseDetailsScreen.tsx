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

export interface CaseDetails {
  uniqueId: string;
  id?: number | string;
  caseNumber?: string;
  court?: string;
  dateFiled?: Date;
  caseType?: string;
  // Add more properties if needed
}

type RootStackParamList = {
  caseDetailScreen: { caseDetails: CaseDetails };
  AddCaseDetails?: { update?: boolean; initialValues?: CaseDetails };
};

type CaseDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  "caseDetailScreen"
>;

type CaseDetailScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "caseDetailScreen"
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
          onPress={() =>
            navigation.navigate("AddCaseDetails", {
              update: true,
              initialValues: caseDetails,
            })
          }
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
