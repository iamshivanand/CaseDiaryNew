import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { StyleSheet } from "react-native";

import Appro from "../Apppro"; // Appro is now the TabNavigator with nested Stacks
import withResponsiveDimensions from "../Screens/CommonComponents/WithScreenDimenions";
import { RootStackParamList } from "../Types/navigationtypes";
// Screens like AddCaseDetails, CaseDetail, CasesList, SettingsScreen, ManageLookupCategoryScreen
// are now part of stacks defined in Appro.tsx (via HomeStack, ProfileStack, etc.)
// So they should not be defined here at the root level if they are intended to be within tabs.

const Stack = createNativeStackNavigator<RootStackParamList>();
const MainAppWithScreenDimensions = withResponsiveDimensions(Appro);

const Routes = () => {
  return (
    // This Root Stack Navigator now primarily manages the MainApp (Tab Navigator)
    // and any screens that should appear OVER the tabs (e.g., global modals).
    // For now, we only have MainApp.
    <Stack.Navigator initialRouteName="MainApp">
      <Stack.Screen
        name="MainApp"
        component={MainAppWithScreenDimensions}
        options={{ headerShown: false }} // The TabNavigator (Appro) and its internal stacks manage their own headers.
      />
      {/*
        If you had global modal screens that should appear on top of everything,
        you would define them here, outside of 'MainApp'. For example:
        <Stack.Screen
          name="GlobalModalScreen"
          component={GlobalModalScreenComponent}
          options={{ presentation: 'modal', headerShown: false }}
        />
      */}
    </Stack.Navigator>
  );
};

export default Routes;

const styles = StyleSheet.create({});
