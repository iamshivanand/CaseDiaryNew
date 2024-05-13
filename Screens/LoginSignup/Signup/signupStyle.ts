import { StyleSheet } from "react-native";

export const SignUpStyle = StyleSheet.create({
  button: {
    minWidth: "90%",
    marginTop: 10,
    backgroundColor: "#3498db",
    color: "white",
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2980b9",
    shadowColor: "rgba(0, 0, 0, 0.3)",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 5, // For Android elevation
  },
  buttonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  Signupstatement: {
    marginTop: 10,
  },
  linkText: {
    color: "blue",
    fontSize: 18,
    fontWeight: "bold",
  },
});
