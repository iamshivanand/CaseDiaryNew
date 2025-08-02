// import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs"; // No longer a TabNavigator
import * as React from "react";
import "react-native-get-random-values"; // For uuid
// import { Text, View } from "react-native"; // View and Text might not be needed if just rendering AddCase
import { v4 as uuidv4 } from "uuid"; // Still needed for uniqueId generation
import { RouteProp } from "@react-navigation/native";
// import { StackNavigationProp } from "@react-navigation/stack"; // Not directly used by this simplified component

// Screens
import AddCase from "./AddCase"; // The actual form component
// DocumentUpload and AddFees are removed from this flow
// import { getTableColumnsAsync } from "../../DataBase"; // Seems like an old debug/utility call
import { HomeStackParamList } from "../../Types/navigationtypes"; // Changed from RootStackParamList
import { CaseDetails } from "../CaseDetailsScreen/CaseDetailsScreen"; // Summary type for initialValues
import { useEffect } from 'react';

// const Tab = createMaterialTopTabNavigator(); // No longer using Tabs here

// Define Prop types for AddCaseDetails screen itself, as it's a screen in HomeStack
type AddCaseDetailsScreenRouteProp = RouteProp<
  HomeStackParamList, // Use HomeStackParamList as AddCaseDetails is in HomeStack
  "AddCaseDetails"
>;

interface Props {
  route: AddCaseDetailsScreenRouteProp;
  // navigation prop is implicitly available if this is registered as a screen component
}

const AddCaseDetailsScreen: React.FC<Props> = ({ route }) => { // Renamed component for clarity
  useEffect(() => {
    console.log("AddCaseDetailsScreen rendered");
  }, []);
  // Params for AddCaseDetails screen are 'update', 'initialValues', 'uniqueId'
  const { update, initialValues, uniqueId: routeUniqueId } = route.params ?? {};

  // Determine the uniqueId: use from route params if provided (e.g., for an update flow starting point),
  // or from initialValues if present (editing), otherwise generate a new one for a brand new case.
  const uniqueIdToPass = routeUniqueId || initialValues?.uniqueId || uuidv4();

  // The AddCase component itself handles the logic of whether it's an update or new,
  // based on the 'update' and 'initialValues' props.
  // It also internally handles its own state now, not relying on isLoading from here.

  // Simply render the AddCase component, passing the necessary parameters.
  // The AddCase component itself now contains the full form UI and logic.
  return (
    <AddCase
      route={{
        key: "AddCaseScreenKey", // Dummy key, actual key provided by navigator
        name: "AddCase", // This 'name' matches the route name AddCase expects if it were a standalone screen
        params: {
          update: !!update, // Ensure boolean
          initialValues: initialValues,
          uniqueId: uniqueIdToPass,
          // caseId could also be passed if available: initialValues?.id
        },
      }}
      // fields prop is optional in AddCase and defaults to SamplefieldsData
      // onSubmit prop is also optional as AddCase has its own handleFinalSubmit
    />
  );
};

export default AddCaseDetailsScreen; // Export with new name
