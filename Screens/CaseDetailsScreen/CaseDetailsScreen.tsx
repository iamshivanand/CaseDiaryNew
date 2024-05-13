import { Feather } from "@expo/vector-icons";
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export interface CaseDetails {
  id?: number | string;
  caseNumber?: string;
  court?: string;
  dateFiled?: Date;
  caseType?: string;
  // Add more properties if needed
}

type RootStackParamList = {
  caseDetailScreen: { caseDetails: CaseDetails };
  AddCase?: { update?: boolean; initialValues?: CaseDetails };
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
    <View style={styles.container}>
      <Text style={styles.title}>Case Details</Text>
      {Object.entries(caseDetails).map(
        ([key, value]: [string, string], index) => (
          <View key={index} style={styles.detail}>
            <Text>
              {key}: {value}
            </Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("AddCase", {
                  update: true,
                  initialValues: caseDetails,
                })
              }
            >
              <Feather name="edit" size={24} color="#4bf308" />
            </TouchableOpacity>
          </View>
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  detail: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    padding: 5,
    fontSize: 18,
    marginBottom: 10,
    borderRadius: 5,
  },
});

export default CaseDetail;
