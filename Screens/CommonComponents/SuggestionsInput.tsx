import React, { useState } from "react";
import {
  TextInput,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import Autocomplete from "react-native-autocomplete-input";

const SuggestionInput = ({
  label,
  placeholder,
  value,
  suggestions,
  onChangeText,
  onBlur,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  const handleTextChange = (text) => {
    onChangeText(text);
    if (text) {
      const filtered = suggestions?.filter(
        (suggestion) => suggestion?.toLowerCase().includes(text?.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setIsOpen(true);
    } else {
      setFilteredSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    console.log("selectedText is ", suggestion);
    onChangeText(suggestion);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Autocomplete
        autoCapitalize="none"
        autoCorrect={false}
        containerStyle={styles.dropdownContainer}
        inputContainerStyle={styles.inputContainer}
        data={
          isOpen && filteredSuggestions?.length > 0 ? filteredSuggestions : []
        }
        defaultValue={value}
        onChangeText={handleTextChange}
        onBlur={() => {
        //   setIsOpen(false);
          onBlur();
        }}
        placeholder={placeholder}
        renderResultList={(props) => (
          <ScrollView {...props} style={styles.resultList}>
            {filteredSuggestions?.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleSuggestionSelect(item)}
              >
                <Text style={styles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      />
    </View>
  );
};

export default SuggestionInput;

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  label: {
    marginBottom: 5,
    fontSize: 16,
    fontWeight: "bold",
  },
  dropdownContainer: {
    flex: 1,
    zIndex: 1,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 5,
  },
  resultList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
  },
  suggestionText: {
    padding: 10,
    fontSize: 16,
  },
});
