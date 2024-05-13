import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { StyleSheet } from "react-native";

import Appro from "../Apppro";
import AddCase from "../Screens/Addcase/AddCase";
import AddCaseDetails from "../Screens/Addcase/AddCaseDetails";
import CaseDetail from "../Screens/CaseDetailsScreen/CaseDetailsScreen";
import CasesList from "../Screens/CasesList/CasesList";
import withResponsiveDimensions from "../Screens/CommonComponents/WithScreenDimenions";

const Stack = createNativeStackNavigator();
const MainAppWithScreenDimensions = withResponsiveDimensions(Appro);
const Routes = () => {
  return (
    <Stack.Navigator>
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
        options={{ headerShown: true }}
      />
      <Stack.Screen
        name="AllCases"
        component={CasesList}
        options={{ headerShown: true }}
      />
      <Stack.Screen
        name="CaseDetail"
        component={CaseDetail}
        options={{ headerShown: true }}
      />
    </Stack.Navigator>
  );
};

export default Routes;

const styles = StyleSheet.create({});
