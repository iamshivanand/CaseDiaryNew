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
import * as Yup from "yup";

import { insertFormAsync, updateFormAsync, FormData } from "../../DataBase";
import { RootStackParamList } from "../../Types/navigationtypes";
import { CaseDetails } from "../CaseDetailsScreen/CaseDetailsScreen";

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

const Samplefields = [
  {
    name: "CRNNumber",
    type: "text",
    placeholder: "Enter CRN Number",
    label: " CRN Number",
  },
  {
    name: "CourtName",
    type: "text",
    placeholder: "Enter Court Name",
    label: "Court Name",
    //manual add
  },
  { name: "dateFiled", type: "date", label: "Date Filed" },
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
}> = ({ field, handleChange, handleBlur, values, errors, openDatePicker }) => {
  switch (field.type) {
    case "text":
      return (
        <View>
          <Text style={styles.label}>{field.label}</Text>
          <TextInput
            id={field.name}
            style={styles.inputField}
            onChangeText={handleChange(field.name)}
            onBlur={() => handleBlur(field.name)}
            value={values[field.name]}
            placeholder={field.placeholder}
            data-name={field.name}
          />
          {errors[field.name] && (
            <Text style={{ color: "red" }}>{errors[field.name]}</Text>
          )}
        </View>
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
  useEffect(() => {
    // Reset selectedDateField state when the component re-renders
    setSelectedDateField(null);
  }, []);

  const handleDatePickerChange = (
    fieldName: string,
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (event.type === "set") {
      //   onSubmit({ [fieldName]: selectedDate?.toISOString() || "" });
      setSelectedDateField(null);
    } else if (event.type === "dismissed") {
      setSelectedDateField(null);
    }
  };

  const handleFinalSubmit = async (values: { [key: string]: string }) => {
    console.log("Final form values:", values); // Log the final form values
    try {
      if (update) {
        // Perform update operation
        //to update need to pass unique Id field
        await updateFormAsync(global.db, uniqueId, values);
        navigation.navigate("CaseDetail", {
          caseDetails: values as CaseDetails,
        });
      } else {
        // Perform insert operation
        await insertFormAsync(global.db, { ...values, uniqueId });
        console.log("Successfully inserted");
        navigation.navigate("Documents" as never);
      }
    } catch (error) {
      console.log("Error in submitting the form", error);
      return false;
    }
    // onSubmit(values);
  };

  const openDatePicker = (fieldName: string) => {
    setSelectedDateField(fieldName);
  };
  return (
    <ScrollView>
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
                        field.type === "date" ? new Date().toISOString() : "",
                    }),
                    {}
                  )
            }
            validationSchema={validationSchema}
            onSubmit={handleFinalSubmit}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors }) => (
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
                            selectedDate
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
