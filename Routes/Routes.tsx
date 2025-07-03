import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { StyleSheet } from "react-native";

import Appro from "../Apppro";
import AddCase from "../Screens/Addcase/AddCase";
import AddCaseDetails from "../Screens/Addcase/AddCaseDetails";
import CaseDetail from "../Screens/CaseDetailsScreen/CaseDetailsScreen";
import CasesList from "../Screens/CasesList/CasesList";
import withResponsiveDimensions from "../Screens/CommonComponents/WithScreenDimenions";
import SettingsScreen from "../Screens/Settings/SettingsScreen"; // Added
import ManageLookupCategoryScreen from "../Screens/Settings/ManageLookupCategoryScreen"; // Added
import { RootStackParamList } from "../Types/navigationtypes"; // Added for type safety

const Stack = createNativeStackNavigator<RootStackParamList>(); // Typed StackNavigator
const MainAppWithScreenDimensions = withResponsiveDimensions(Appro); // Assuming Appro is a component
const Routes = () => {
  return (
    <Stack.Navigator initialRouteName="MainApp">
      {/* <Stack.Screen
              name="Login"
              component={Login}
              options={{ headerShown: false }}
            /> */}
      <Stack.Screen
        name="MainApp"
        component={MainAppWithScreenDimensions}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddCaseDetails"
        component={AddCaseDetails}
        options={{ title: "Add/Edit Case Details" }} // Example of setting a specific title
      />
      <Stack.Screen
        name="AllCases"
        component={CasesList}
        options={{ title: "All Cases" }}
      />
      <Stack.Screen
        name="CaseDetail"
        component={CaseDetail}
        options={{ title: "Case Details" }}
      />
      <Stack.Screen
        name="SettingsScreen"
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
      <Stack.Screen
        name="ManageLookupCategoryScreen"
        component={ManageLookupCategoryScreen}
        options={({ route }) => ({ title: route.params.title || "Manage Category" })} // Dynamic title
      />
    </Stack.Navigator>
  );
};

export default Routes;

const styles = StyleSheet.create({});
