import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import * as React from "react";
import "react-native-get-random-values";
import { Text, View } from "react-native";
import { v4 as uuidv4 } from "uuid";

// Screens
import AddCase from "./AddCase";
import AddFees from "./AddFees";
import DocumentUpload from "./DocumentUpload";
import { getTableColumnsAsync } from "../../DataBase";

const Tab = createMaterialTopTabNavigator();

export default function AddCaseDetails() {
  const [uniqueId, setUniqueId] = React.useState<string>();
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  console.log("unique Id in ADDCaseDetails", uniqueId);
  React.useEffect(() => {
    getTableColumnsAsync(global.db);
    setUniqueId(uuidv4());
  }, []);
  React.useEffect(() => {
    // Set isLoading to false when uniqueId is set
    if (uniqueId) {
      setIsLoading(false);
    }
  }, [uniqueId]);

  if (isLoading) {
    return (
      <View>
        <Text>Loading....</Text>
      </View>
    );
  }
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="AddCase"
        component={AddCase}
        initialParams={{ update: false, uniqueId }}
      />
      <Tab.Screen
        name="Documents"
        component={DocumentUpload}
        initialParams={{ update: false, uniqueId }}
      />
      <Tab.Screen
        name="Fees"
        component={AddFees}
        initialParams={{ update: false, uniqueId }}
      />
    </Tab.Navigator>
  );
}
