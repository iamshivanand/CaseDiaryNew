import { StyleSheet } from "react-native";
import { Theme } from "../../Providers/ThemeProvider";

export const getInputStyles = (theme: Theme) => StyleSheet.create({
  textInput: {
    height: 40,
    minWidth: "90%",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
    color: theme.colors.text,
    backgroundColor: theme.colors.inputBackground,
  },
  label: {
    marginBottom: 2,
    color: theme.colors.textSecondary,
  },
});
