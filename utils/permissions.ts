import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import { Alert, Platform } from "react-native";

export const requestAllPermissions = async (): Promise<void> => {
  console.log("Requesting all necessary permissions...");

  const permissionsToRequest = [
    {
      name: "Camera",
      request: ImagePicker.requestCameraPermissionsAsync,
      check: ImagePicker.getCameraPermissionsAsync,
    },
    {
      name: "Media Library",
      request: ImagePicker.requestMediaLibraryPermissionsAsync,
      check: ImagePicker.getMediaLibraryPermissionsAsync,
    },
    {
      name: "Notifications",
      request: Notifications.requestPermissionsAsync,
      check: Notifications.getPermissionsAsync,
    },
  ];

  for (const permission of permissionsToRequest) {
    const { status: existingStatus } = await permission.check();
    if (existingStatus !== "granted") {
      console.log(`Requesting ${permission.name} permission...`);
      const { status } = await permission.request();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          `Sorry, we need ${permission.name} permissions to make this work!`
        );
        console.warn(`${permission.name} permission denied.`);
      } else {
        console.log(`${permission.name} permission granted.`);
      }
    } else {
      console.log(`${permission.name} permission already granted.`);
    }
  }
};
