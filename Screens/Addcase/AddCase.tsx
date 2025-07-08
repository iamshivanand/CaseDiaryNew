import { Fontisto } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { RouteProp, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Formik, FormikProps } from "formik";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Button,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Autocomplete from "react-native-autocomplete-input";
import * as Yup from "yup";

import {
  addCase,
  updateCase,
  CaseInsertData,
  CaseUpdateData, // Added for update operation
  getSuggestionsForField, // Changed from getSuggestions
  // FormData, // FormData is not defined in DataBase/index.ts
} from "../../DataBase";
import { RootStackParamList } from "../../Types/navigationtypes";
import { formatDate } from "../../utils/commonFunctions";
import { CaseDetails } from "../CaseDetailsScreen/CaseDetailsScreen";
import SuggestionInput from "../CommonComponents/SuggestionsInput";

interface Field {
  name: string;
  type: string;
  placeholder?: string;
  label: string;
  options?: { label: string; value: string }[];
}

type AddCaseScreenRouteProp = RouteProp<RootStackParamList, "AddCase">;

type AddCaseScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddCase" | "CaseDetail"
>;

interface Props {
  fields: Field[];
  onSubmit: (values: { [key: string]: string }) => void;
  update?: boolean;
  initialValues?: CaseDetails;
  route?: AddCaseScreenRouteProp;
  navigation?: AddCaseScreenNavigationProp;
}

const suggestionsInputFields = [
  {
    name: "CourtName",
    type: "text",
    placeholder: "Enter Court Name",
    label: "Court Name",
    //manual add
  },
  {
    name: "OnBehalfOf",
    type: "text",
    placeholder: "On Behalf of",
    label: "On Behalf of",
    //this should contain the manual add
  },
  {
    name: "Undersection",
    type: "text",
    placeholder: "UnderSection",
    label: "UnderSection",
  },
  {
    name: "PoliceStation",
    type: "text",
    placeholder: "Enter Police Station",
    label: "Police Station",
  },
  {
    name: "CaseStatus",
    type: "text",
    label: "Case Status",
    placeholder: " Case Status",
  },
];

const Samplefields = [
  {
    name: "CNRNumber",
    type: "text",
    placeholder: "Enter CNR Number",
    label: " CNR Number",
  },
  {
    name: "CourtName",
    type: "text",
    placeholder: "Enter Court Name",
    label: "Court Name",
    //manual add
  },
  {
    name: "caseType",
    type: "select",
    label: "Case Type",
    options: [
      { label: "Civil", value: "civil" },
      { label: "Criminal", value: "criminal" },
      { label: "Family", value: "family" },
    ],
    //options should be added manually
  },
  { name: "dateFiled", type: "date", label: "Date Filed" },
  {
    name: "CaseNo",
    type: "text",
    placeholder: "Enter Case Number",
    label: "CaseNumber/STNumber",
    //this must also have year field with dropdown and search
  },
  {
    name: "CrimeNo",
    type: "text",
    placeholder: "Enter Crime Number",
    label: "Crime Number",
    //this must also have year field with dropdown and search
  },
  {
    name: "OnBehalfOf",
    type: "text",
    placeholder: "On Behalf of",
    label: "On Behalf of",
    //this should contain the manual add
  },
  {
    name: "FirstParty",
    type: "text",
    placeholder: "Enter First Party",
    label: "Enter First Party",
  },
  {
    name: "OppositeParty",
    type: "text",
    placeholder: "Enter Opposite Party",
    label: "Enter Opposite Party",
  },
  {
    name: "ClientContactNumber",
    type: "text",
    placeholder: "Enter Contact Number",
    label: "Client Contact Number",
  },
  {
    name: "Accussed",
    type: "text",
    placeholder: "Enter Accused Name",
    label: "Accused",
  },
  {
    name: "Undersection",
    type: "text",
    placeholder: "UnderSection",
    label: "UnderSection",
  },
  {
    name: "PoliceStation",
    type: "text",
    placeholder: "Enter Police Station",
    label: "Police Station",
  },
  {
    name: "District",
    type: "select",
    label: "District",
    options: [
      { label: "Bareilly", value: "Bareilly" },
      { label: "Lucknow", value: "Lucknow" },
    ],
    //List all the Districts in india with search
  },
  {
    name: "OppositeAdvocate",
    type: "text",
    label: "Opposite Advocate",
    placeholder: "Opposite Advocate",
  },
  {
    name: "OppAdvocateContactNumber",
    type: "text",
    label: "Opp. Advocate Contact No.",
    placeholder: "Contact Number",
  },
  {
    name: "CaseStatus",
    type: "text",
    label: "Case Status",
    placeholder: " Case Status",
  },
  { name: "PreviousDate", type: "date", label: "Previous Date" },
  { name: "NextDate", type: "date", label: "Next Date" },

  // Add more fields with different types as needed
];

// Sample validation schema
const validationSchema = Yup.object().shape({
  // Define your validation rules here based on your fields
});

// Define a component to render different types of form inputs
const FormField: React.FC<{
  field: Field;
  handleChange: FormikProps<{ [key: string]: string }>["handleChange"];
  handleBlur: FormikProps<{ [key: string]: string }>["handleBlur"];
  values: CaseDetails | { [key: string]: string };
  errors: { [key: string]: string | undefined };
  openDatePicker: () => void;
  suggestionArray: string[];
}> = ({
  field,
  handleChange,
  handleBlur,
  values,
  errors,
  openDatePicker,
  suggestionArray,
}) => {
  switch (field.type) {
    case "text":
      return (
        // <View>
        //   <Text style={styles.label}>{field.label}</Text>
        //   <TextInput
        //     id={field.name}
        //     style={styles.inputField}
        //     onChangeText={handleChange(field.name)}
        //     onBlur={() => handleBlur(field.name)}
        //     value={values[field.name]}
        //     placeholder={field.placeholder}
        //     data-name={field.name}
        //   />
        //   {errors[field.name] && (
        //     <Text style={{ color: "red" }}>{errors[field.name]}</Text>
        //   )}
        // </View>
        <SuggestionInput
          key={field.name}
          label={field.label}
          placeholder={field.placeholder}
          value={values[field.name]}
          suggestions={suggestionArray}
          onChangeText={handleChange(field.name)}
          onBlur={handleBlur(field.name)}
        />
      );
    case "select":
      return (
        <View>
          <Text style={styles.label}>{field.label}</Text>
          <View style={styles.dropdownContainer}>
            <Picker
              id={field.name}
              selectedValue={values[field.name]}
              onValueChange={(itemValue: string) =>
                handleChange(field.name)(itemValue)
              }
              style={styles.dropdownContainer}
            >
              {field.options!.map((option, index) => (
                <Picker.Item
                  style={styles.dropdown}
                  key={index}
                  label={option.label}
                  value={option.value}
                />
              ))}
            </Picker>
          </View>
          {errors[field.name] && (
            <Text style={{ color: "red" }}>{errors[field.name]}</Text>
          )}
        </View>
      );
    case "date":
      return (
        <View>
          <Text style={styles.label}>{field.label}</Text>
          <View style={styles.datePickerContainer}>
            <TouchableOpacity onPress={openDatePicker}>
              <Fontisto name="date" size={24} color="black" />
            </TouchableOpacity>
            {values[field.name] && (
              <Text>{new Date(values[field.name]).toDateString()}</Text>
            )}
            {errors[field.name] && (
              <Text style={{ color: "red" }}>{errors[field.name]}</Text>
            )}
          </View>
        </View>
      );
    default:
      return null;
  }
};

const AddCase: React.FC<Props> = ({ fields = Samplefields, route }) => {
  const { update = false, initialValues, uniqueId } = route?.params;
  console.log("uniqueId value inAddcase", uniqueId);
  const navigation = useNavigation();
  const [selectedDateField, setSelectedDateField] = useState<string | null>(
    null
  );
  const [suggestions, setSuggestions] = useState({});
  useEffect(() => {
    // Reset selectedDateField state when the component re-renders
    setSelectedDateField(null);
  }, []);
  useEffect(() => {
    async function FetchSuggestion() {
      try {
        // TODO: Review getSuggestionsForField usage based on its signature in DataBase/index.ts
        // It expects (fieldName, userId, districtIdForPoliceStations)
        // The current `suggestionsInputFields` might need to be iterated or handled differently.
        // For now, this part is kept as is, focusing on addCase.
        // const data = await getSuggestionsForField(global.db, suggestionsInputFields);
        // console.log("Suggestion bala data is ", data);
        // setSuggestions(data);
        console.log("Placeholder for FetchSuggestion with getSuggestionsForField");
      } catch (error) {
        console.log("error fetching the Suggestions", error);
      }
    }
    FetchSuggestion();
  }, []);

  const handleDatePickerChange = (
    fieldName: string,
    event: DateTimePickerEvent,
    selectedDate?: Date,
    setFieldValue?: (field: string, value: any) => void
  ) => {
    if (event.type === "set" && selectedDate) {
      console.log("selectedDate is :", selectedDate);
      setFieldValue(fieldName, formatDate(selectedDate.toISOString()));
    }
    setSelectedDateField(null);
  };
  const getChangedValues = (
    initialValues: CaseDetails,
    currentValues: { [key: string]: string }
  ) => {
    return Object.keys(currentValues).reduce(
      (acc, key) => {
        if (currentValues[key] !== initialValues[key]) {
          acc[key] = currentValues[key];
        }
        return acc;
      },
      {} as { [key: string]: string }
    );
  };
  const handleFinalSubmit = async (values: { [key: string]: string }) => {
    console.log("Final form values:", values); // Log the final form values

    // Ensure uniqueId is present. If not passed via route.params, generate one.
    // This is a placeholder for uniqueId generation logic if needed.
    // For now, relying on route.params.uniqueId which is used by addCase.
    const currentUniqueId = uniqueId || `UID_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;


    if (update && initialValues?.id) { // Check for initialValues.id for update
      const caseIdToUpdate = initialValues.id;
      // Perform update operation
      const changedValues = getChangedValues(
        initialValues as CaseDetails, // Assuming CaseDetails is compatible enough with CaseRow
        values
      );

      // Map changedValues to CaseUpdateData structure
      // This is a simplified mapping. Similar to addCase, name-to-ID conversions
      // would be needed here if those fields are updatable and changed.
      const caseUpdatePayload: CaseUpdateData = {};

      // Iterate over changedValues and map them to known fields in CaseUpdateData
      // This assumes form field names (keys in `changedValues`) might need mapping
      // to schema field names. For now, direct mapping where names match.
      for (const key in changedValues) {
        if (Object.prototype.hasOwnProperty.call(changedValues, key)) {
          const value = changedValues[key];
          // Example direct mappings (add more as needed, and handle ID lookups)
          if (key === "CNRNumber") caseUpdatePayload.CNRNumber = value;
          else if (key === "dateFiled") caseUpdatePayload.dateFiled = value; // Ensure "YYYY-MM-DD"
          else if (key === "CaseNo") caseUpdatePayload.case_number = value;
          // else if (key === "CaseNoYear") caseUpdatePayload.case_year = value ? parseInt(value, 10) : null;
          else if (key === "CrimeNo") caseUpdatePayload.crime_number = value;
          // else if (key === "CrimeNoYear") caseUpdatePayload.crime_year = value ? parseInt(value, 10) : null;
          else if (key === "OnBehalfOf") caseUpdatePayload.OnBehalfOf = value;
          else if (key === "FirstParty") caseUpdatePayload.FirstParty = value;
          else if (key === "OppositeParty") caseUpdatePayload.OppositeParty = value;
          else if (key === "ClientContactNumber") caseUpdatePayload.ClientContactNumber = value;
          else if (key === "Accussed") caseUpdatePayload.Accussed = value;
          else if (key === "Undersection") caseUpdatePayload.Undersection = value;
          else if (key === "OppositeAdvocate") caseUpdatePayload.OppositeAdvocate = value;
          else if (key === "OppAdvocateContactNumber") caseUpdatePayload.OppAdvocateContactNumber = value;
          else if (key === "CaseStatus") caseUpdatePayload.CaseStatus = value;
          else if (key === "PreviousDate") caseUpdatePayload.PreviousDate = value; // Ensure "YYYY-MM-DD"
          else if (key === "NextDate") caseUpdatePayload.NextDate = value; // Ensure "YYYY-MM-DD"
          // TODO: Add mappings for fields requiring ID lookups if they are changed:
          // e.g., if values.CourtName changed, you'd need to get its ID for court_id
          // if (key === "CourtName") caseUpdatePayload.court_id = await getCourtId(value);
          // if (key === "caseType") caseUpdatePayload.case_type_id = await getCaseTypeId(value);
          // if (key === "PoliceStation") caseUpdatePayload.police_station_id = await getPoliceStationId(value);
        }
      }

      if (Object.keys(caseUpdatePayload).length === 0) {
        console.log("No changes detected to update.");
        // Optionally navigate back or show a message
        navigation.goBack();
        return;
      }

      console.log("Attempting to update case ID:", caseIdToUpdate, "with payload:", caseUpdatePayload);

      try {
        // const userId = null; // TODO: Get actual user ID if available for actorUserId
        const success = await updateCase(caseIdToUpdate, caseUpdatePayload /*, userId */);
        if (success) {
          console.log("Successfully updated case ID:", caseIdToUpdate);
          // Optimistically update the details for navigation
          const updatedDetails = { ...initialValues, ...changedValues };
          navigation.navigate("CaseDetail", {
             caseDetails: updatedDetails as CaseDetails, // Cast needed if CaseDetails is different from CaseRow
          });
        } else {
          console.error("Update operation failed or no rows were changed for case ID:", caseIdToUpdate);
          // Handle error: show message to user
        }
      } catch (error) {
        console.error("Error submitting update form with updateCase:", error);
        // Handle error: show message to user
        return;
      }

    } else {
      // Perform insert operation
      // Basic mapping from form `values` to `CaseInsertData`.
      // This is a simplified mapping. Many fields (CourtName, caseType, PoliceStation, District)
      // need to be converted to their respective IDs.
      // This requires further logic to fetch or look up these IDs.
      const caseDataPayload: CaseInsertData = {
        uniqueId: currentUniqueId, // Essential: from route.params or generated
        user_id: null, // TODO: Assign actual user_id if available (e.g., from auth context)

        CNRNumber: values.CNRNumber || null,
        // court_id: Requires lookup from values.CourtName
        // For now, placeholder or requires UI change to select court and get ID
        court_id: null, // Placeholder: Needs ID from values.CourtName
        dateFiled: values.dateFiled || null, // Ensure this is "YYYY-MM-DD"
        // case_type_id: Requires lookup from values.caseType (e.g., "civil" -> ID)
        case_type_id: null, // Placeholder: Needs ID from values.caseType
        case_number: values.CaseNo || null, // Form uses "CaseNo"
        case_year: values.CaseNoYear ? parseInt(values.CaseNoYear, 10) : null, // Assuming CaseNoYear field exists
        crime_number: values.CrimeNo || null, // Form uses "CrimeNo"
        crime_year: values.CrimeNoYear ? parseInt(values.CrimeNoYear, 10) : null, // Assuming CrimeNoYear field exists

        OnBehalfOf: values.OnBehalfOf || null,
        FirstParty: values.FirstParty || null,
        OppositeParty: values.OppositeParty || null,
        ClientContactNumber: values.ClientContactNumber || null,
        Accussed: values.Accussed || null,

        Undersection: values.Undersection || null,
        // police_station_id: Requires lookup from values.PoliceStation (and possibly district_id)
        police_station_id: null, // Placeholder

        OppositeAdvocate: values.OppositeAdvocate || null,
        OppAdvocateContactNumber: values.OppAdvocateContactNumber || null,

        CaseStatus: values.CaseStatus || null,
        PreviousDate: values.PreviousDate || null, // Ensure "YYYY-MM-DD"
        NextDate: values.NextDate || null, // Ensure "YYYY-MM-DD"
      };

      console.log("Attempting to insert with payload:", caseDataPayload);

      try {
        // global.db is used here. Ideally, getDb() should be called.
        // This will be addressed in a later step if requested.
        const newCaseId = await addCase(caseDataPayload);
        if (newCaseId) {
          console.log("Successfully inserted with ID:", newCaseId, "and uniqueId:", currentUniqueId);
          // Navigate to Documents tab, passing the new caseId and the uniqueId used.
          // The DocumentUpload screen (Documents tab) should use caseId if available.
          navigation.navigate("Documents", { caseId: newCaseId, uniqueId: currentUniqueId });
        } else {
          console.error("Insert operation did not return a new ID.");
          // Handle error: show message to user
        }
      } catch (error) {
        console.error("Error submitting the form with addCase:", error);
        // Handle error: show message to user, check if it's a duplicate uniqueId error, etc.
        return; // Stop execution if error occurs
      }
    }
    // onSubmit(values); // Original onSubmit call, if needed for other purposes.
  };

  const openDatePicker = (fieldName: string) => {
    setSelectedDateField(fieldName);
  };
  return (
    <ScrollView keyboardShouldPersistTaps="always">
      <View style={styles.AddCaseContainer}>
        <Text>{update ? "Update" : "Add"} a case</Text>
        <Text>Fill the below form to {update ? "Update" : "add new"} Case</Text>
        <View style={styles.FormContainer}>
          <Formik
            initialValues={
              initialValues
                ? initialValues
                : fields?.reduce<{ [key: string]: string }>(
                    (acc, field) => ({
                      ...acc,
                      [field.name]:
                        field.type === "date" ? formatDate(new Date()) : "",
                    }),
                    {}
                  )
            }
            validationSchema={validationSchema}
            onSubmit={handleFinalSubmit}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              setFieldValue,
              errors,
            }) => (
              <View>
                {fields?.map((field, index) => (
                  <View key={index}>
                    <FormField
                      field={field}
                      handleChange={handleChange}
                      handleBlur={handleBlur}
                      values={values}
                      errors={errors}
                      openDatePicker={() => openDatePicker(field.name)}
                      suggestionArray={suggestions[field.name]}
                    />
                    {selectedDateField === field.name && (
                      <DateTimePicker
                        id={field.name}
                        value={
                          values[field.name]
                            ? new Date(values[field.name])
                            : new Date()
                        }
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) =>
                          handleDatePickerChange(
                            field.name,
                            event,
                            selectedDate,
                            setFieldValue
                          )
                        }
                      />
                    )}
                  </View>
                ))}
                <Button
                  title={update ? "Update" : "Submit"}
                  onPress={() => handleSubmit()}
                />
              </View>
            )}
          </Formik>
        </View>
      </View>
    </ScrollView>
  );
};

export default AddCase;

const styles = StyleSheet.create({
  AddCaseContainer: {
    height: "100%",
    padding: 10,
  },
  AddCaseHeader: {},
  FormContainer: {},
  inputField: {
    height: 40,
    minWidth: "90%",
    borderWidth: 1, // Set the border width
    borderColor: "gray", // Set the border color
    borderRadius: 5, // Set the border radius for rounded corners
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  errorInput: {
    borderColor: "red",
  },
  dropdownContainer: {
    height: 40,
    minWidth: "90%",
    borderWidth: 1,
    borderColor: "#7a7a7a",
    borderRadius: 5,
    marginBottom: 20,
    overflow: "hidden",
  },
  dropdown: {
    minWidth: "90%",
    height: 40,
    paddingHorizontal: 10,
  },
  datePickerContainer: {
    height: 40,
    width: "90%",
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 5,
    marginBottom: 20,
  },
  datePicker: {
    height: 40,
    minWidth: "90%",
  },
  label: {
    marginBottom: 2,
  },
});
