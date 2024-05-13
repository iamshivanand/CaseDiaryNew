import { Feather, AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import ConfirmationPopup from "./Popup";
import { deleteFormAsync } from "../../DataBase";

const windowWidth = Dimensions.get("window").width;
interface CaseDetails {
  id: number;
  caseNumber: string;
  caseType: string;
  court: string;
  dateFiled: string;
  // Add more properties if needed
}
type RootStackParamList = {
  CaseDetail: { caseDetails: CaseDetails };
};

type CaseDetailScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "CaseDetail"
>;

const CaseCard: React.FC<{
  caseDetails: CaseDetails;
  onDelete?: () => void;
}> = ({ caseDetails, onDelete }) => {
  const navigation = useNavigation<CaseDetailScreenNavigationProp>();

  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);

  const handleDeleteConfirm = () => {
    // Logic for delete action
    handleDelete();
    setIsConfirmationVisible(false);
  };

  const handleDeleteCancel = () => {
    setIsConfirmationVisible(false);
  };

  const handleDelete = () => {
    console.log("need to delete the ID", caseDetails.id);
    deleteFormAsync(global.db, caseDetails?.id);
    onDelete();
  };
  const handleEdit = () => {
    console.log("Edit button pressed");
    navigation.navigate("CaseDetail", { caseDetails });
  };
  return (
    <View style={styles.cardContainer}>
      <View style={styles.DetailsContainer}>
        {Object.entries(caseDetails).map(
          ([key, value], index) =>
            key !== "id" && (
              <Text key={index} style={styles.cardText}>
                {key} : {value}
              </Text>
            )
        )}
      </View>
      <View style={styles.cardButtonContainer}>
        <TouchableOpacity onPress={handleEdit}>
          <View style={styles.primarybuttons}>
            <Text style={styles.buttonText}>Edit</Text>
            <Feather name="edit" size={20} color="white" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsConfirmationVisible(true)}>
          <View style={{ ...styles.primarybuttons, backgroundColor: "red" }}>
            <Text style={styles.buttonText}>Delete</Text>
            <AntDesign name="delete" size={20} color="white" />
          </View>
        </TouchableOpacity>
      </View>
      <ConfirmationPopup
        isVisible={isConfirmationVisible}
        message="Are you sure you want to delete?"
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </View>
  );
};

export default CaseCard;

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: "column",
    justifyContent: "space-between",
    padding: 15,
    width: windowWidth - 40,
    height: 200,
    backgroundColor: "#376061",
    marginTop: 10,
    borderRadius: 7,
    elevation: 3,
  },
  DetailsContainer: {
    flex: 1,
    justifyContent: "flex-start",
  },
  cardButtonContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  cardText: {
    color: "#d3c1b4",
    fontSize: Dimensions.get("window").width * 0.04,
    fontWeight: "bold",
  },
  primarybuttons: {
    flexDirection: "row",
    height: 40,
    width: (windowWidth - 120) / 2,
    justifyContent: "space-evenly",
    alignItems: "center",
    backgroundColor: "#37d6c1",
    borderRadius: 5,
    color: "white",
    elevation: 5,
    shadowColor: "#7a7474",
    shadowOffset: { width: 5, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    margin: 4,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
});
