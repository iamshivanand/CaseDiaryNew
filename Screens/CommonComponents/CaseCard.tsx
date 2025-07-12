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
import { Menu, Provider, Button } from "react-native-paper";

import GenericModal from "./GenericFieldPopup";
import ConfirmationPopup from "./Popup";
import { deleteFormAsync, updateFormAsync } from "../../DataBase";

const windowWidth = Dimensions.get("window").width;
interface CaseDetails {
  uniqueId: string;
  id: number;
  caseNumber: string;
  caseType: string;
  court: string;
  dateFiled: string;
  // Add more properties if needed
}
import { HomeStackParamList } from "../../Types/navigationtypes"; // Import HomeStackParamList

// CaseDetails interface remains the same for this component's props
export interface CaseDetails { // Renamed to avoid conflict if CaseDetails is imported from elsewhere for other purposes
  uniqueId: string;
  id: number;
  caseNumber: string; // This is usually the title or main display number
  caseType?: string;  // Optional: case_type_name
  court?: string;     // Optional: court_name
  dateFiled?: string; // Optional: dateFiled (ISO string)
  // Add more properties if needed by the card display itself
}

const CaseCard: React.FC<{
  caseDetails: CaseDetails; // This is the prop type
  onDelete?: () => void;
}> = ({ caseDetails, onDelete }) => {
  const navigation = useNavigation();

  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  const [showUpdateField, setShowUpdateField] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
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
    deleteFormAsync(global.db, caseDetails?.uniqueId);
    onDelete();
  };
  const handleEdit = () => {
    console.log("Edit button pressed, navigating to CaseDetails with id:", caseDetails.id);
    navigation.navigate("CaseDetails", {
      caseDetails: caseDetails,
    });
  };
  const handleUpdateDate = (values: { [key: string]: any }) => {
    console.log("Next Date value:", values.NextDate);
    updateFormAsync(global.db, caseDetails?.uniqueId, values);
  };
  return (
    <Provider>
      <TouchableOpacity onPress={handleEdit} activeOpacity={1}>
        <View style={styles.cardContainer}>
          <View style={styles.menuContainer}>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <TouchableOpacity onPress={() => setMenuVisible(true)}>
                  <Feather name="more-vertical" size={24} color="white" />
                </TouchableOpacity>
              }
              anchorPosition="bottom"
              style={styles.menu}
            >
              <Menu.Item onPress={handleEdit} title="Edit" />
              <Menu.Item
                onPress={() => setIsConfirmationVisible(true)}
                title="Delete"
              />
            </Menu>
          </View>
          <View style={styles.DetailsContainer}>
            {Object.entries(caseDetails).map(
              ([key, value], index) =>
                (key === "CourtName" ||
                  key === "OnBehalfOf" ||
                  key === "FirstParty" ||
                  key === "Undersection" ||
                  key === "PoliceStation"||
                  key === "NextDate") && (
                  <Text key={index} style={styles.cardText}>
                    {key} : {value}
                  </Text>
                )
            )}
            {/* //need to show only few things */}
          </View>
          <View style={styles.cardButtonContainer}>
            {/* <TouchableOpacity onPress={handleEdit}>
          <View style={styles.primarybuttons}>
            <Text style={styles.buttonText}>Edit</Text>
            <Feather name="edit" size={20} color="white" />
          </View>
        </TouchableOpacity> */}
            <TouchableOpacity onPress={() => setShowUpdateField(true)}>
              <View style={styles.primarybuttons}>
                <Text style={styles.buttonText}>Update</Text>
                <Feather name="edit" size={20} color="white" />
              </View>
            </TouchableOpacity>
            {/* <TouchableOpacity onPress={() => setIsConfirmationVisible(true)}>
          <View style={{ ...styles.primarybuttons, backgroundColor: "red" }}>
            <Text style={styles.buttonText}>Delete</Text>
            <AntDesign name="delete" size={20} color="white" />
          </View>
        </TouchableOpacity> */}
          </View>
          <ConfirmationPopup
            isVisible={isConfirmationVisible}
            message="Are you sure you want to delete?"
            onCancel={handleDeleteCancel}
            onConfirm={handleDeleteConfirm}
          />
          <GenericModal
            visible={showUpdateField}
            onClose={() => setShowUpdateField(false)}
            onSubmit={handleUpdateDate}
            fields={[{ name: "NextDate", type: "date", label: "Next Date" }]}
          />
        </View>
      </TouchableOpacity>
    </Provider>
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
  menuContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
    // flexDirection: "row",
    // justifyContent: "flex-end",
  },
  menu: {
    zIndex: 1,
    top: 10, // Adjust this value to position the menu correctly
  },
  DetailsContainer: {
    flex: 1,
    justifyContent: "flex-start",
  },
  cardButtonContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
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
