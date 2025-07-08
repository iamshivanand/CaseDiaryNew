import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import * as React from "react";
import "react-native-get-random-values";
import { Text, View } from "react-native";
import { v4 as uuidv4 } from "uuid";
import { RouteProp, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

// Screens
import AddCase from "./AddCase";
import AddFees from "./AddFees";
import DocumentUpload from "./DocumentUpload";
import { getTableColumnsAsync } from "../../DataBase";
import { RootStackParamList } from "../../Types/navigationtypes";
import { CaseDetails } from "../CaseDetailsScreen/CaseDetailsScreen";

const Tab = createMaterialTopTabNavigator();
type AddCaseDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  "AddCaseDetails"
>;
type AddCaseScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddCase" | "CaseDetail"
>;
interface props {
  update?: boolean;
  initialValues?: CaseDetails;
  route?: AddCaseDetailsScreenRouteProp;
  navigation?: AddCaseScreenNavigationProp;
}

const AddCaseDetails: React.FC<props> = ({ route }) => {
  const { update, initialValues } = route?.params ?? {}; // Provide default empty object for params

  // Use initialValues.id as caseId if present (editing), otherwise undefined (new case)
  const caseIdFromParams = initialValues?.id;

  // uniqueId is primarily for linking parts of a NEW case before it has a database ID.
  // If we are editing, initialValues.uniqueId should be used. Otherwise, generate a new one.
  const [uniqueId, setUniqueId] = React.useState<string>(() => initialValues?.uniqueId || uuidv4());

  // This state will hold the actual database ID of the case once it's saved.
  // For existing cases, it's set from route params. For new cases, it's set after saving AddCase form.
  const [currentCaseId, setCurrentCaseId] = React.useState<number | undefined>(caseIdFromParams);

  // TODO: This isLoading logic might need refinement.
  // For example, if initialValues are passed, we might not need to generate uniqueId or show loading for it.
  // The main loading might be for fetching case details if initialValues only contains an ID.
  const [isLoading, setIsLoading] = React.useState<boolean>(!initialValues && !uniqueId);

  React.useEffect(() => {
    // If initialValues are provided (editing mode), set the currentCaseId
    if (initialValues?.id) {
      setCurrentCaseId(initialValues.id);
      if(initialValues.uniqueId) setUniqueId(initialValues.uniqueId); // Ensure uniqueId is also set from initialValues if present
    } else {
      // New case, generate uniqueId if not already set (though useState initializer should handle this)
      if (!uniqueId) setUniqueId(uuidv4());
    }
    // getTableColumnsAsync(global.db); // This was an old call, ensure it's still needed or remove. global.db is gone.
    setIsLoading(false); // Assume loading is done once IDs are sorted.
  }, [initialValues, uniqueId]);


  // This callback will be passed to AddCase screen to update the caseId after a new case is saved.
  const handleCaseSaved = (newCaseId: number, savedUniqueId: string) => {
    setCurrentCaseId(newCaseId);
    setUniqueId(savedUniqueId); // Update uniqueId if it was re-confirmed or saved with the case
    // Potentially navigate or refresh data related to documents/fees if they depend on currentCaseId
  };


  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading Case Details...</Text>
      </View>
    );
  }

  // Ensure uniqueId is available before rendering tabs
  if (!uniqueId) {
     return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Initializing...</Text>
      </View>
    );
  }

  return (
    <Tab.Navigator>
      <Tab.Screen
        name="AddCase"
        component={AddCase}
        initialParams={
          initialValues
            ? { update: true, initialValues, uniqueId: initialValues.uniqueId, caseId: initialValues.id } // Removed onCaseSaved
            : { update: false, uniqueId } // Removed onCaseSaved, pass uniqueId
        }
      />
      <Tab.Screen
        name="Documents"
        component={DocumentUpload}
        // Pass both uniqueId and currentCaseId. DocumentUpload will use caseId if available.
        initialParams={{ uniqueId, caseId: currentCaseId }}
      />
      <Tab.Screen
        name="Fees" // Assuming Fees screen also might need caseId or uniqueId
        component={AddFees}
        initialParams={{ update: false, uniqueId }}
      />
    </Tab.Navigator>
  );
};

export default AddCaseDetails;
