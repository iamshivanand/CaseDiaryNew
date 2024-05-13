import React from "react";
import { View, Text, Modal, StyleSheet, TouchableOpacity } from "react-native";

interface ConfirmationPopupProps {
  isVisible: boolean;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({
  isVisible,
  message,
  onCancel,
  onConfirm,
}) => {
  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View style={styles.container}>
        <View style={styles.popup}>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity onPress={onCancel} style={styles.button}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              style={{ ...styles.button, backgroundColor: "green" }}
            >
              <Text style={{ ...styles.buttonText, color: "white" }}>
                Confirm
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  popup: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  message: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  buttonsContainer: {
    width: "70%",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  button: {
    padding: 10,
    width: "45%",
    borderWidth: 1,
    borderRadius: 5,
    borderColor: "grey",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007BFF",
    textAlign: "center",
  },
});

export default ConfirmationPopup;
