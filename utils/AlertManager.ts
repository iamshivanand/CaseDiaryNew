// utils/AlertManager.ts
import { Alert } from "react-native";

export interface AlertButton {
  text?: string;
  onPress?: (value?: string) => void;
  style?: "default" | "cancel" | "destructive";
}

export interface AlertOptions {
  cancelable?: boolean;
  onDismiss?: () => void;
}

export interface AlertPayload {
  id: string;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  options?: AlertOptions;
  isPrompt?: boolean;
  promptType?: "default" | "plain-text" | "secure-text";
  defaultValue?: string;
  keyboardType?: string;
}

type AlertHandler = (payload: AlertPayload | null) => void;

let globalHandler: AlertHandler | null = null;

// Keep original native implementations
const originalAlert = Alert.alert;
const originalPrompt = Alert.prompt;

/**
 * Register the custom react-native UI component handler.
 * When an alert is triggered, the handler will be called to update modal state.
 */
export const setCustomAlertHandler = (handler: AlertHandler | null) => {
  globalHandler = handler;
};

/**
 * Monkey-patches Alert.alert and Alert.prompt globally.
 * Should be called once at the start of App entry point.
 */
export const initializeAlertInterceptor = () => {
  Alert.alert = (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions
  ) => {
    if (globalHandler) {
      globalHandler({
        id: Math.random().toString(36).substring(2),
        title,
        message,
        buttons,
        options,
      });
    } else {
      originalAlert(title, message, buttons, options);
    }
  };

  Alert.prompt = (
    title: string,
    message?: string,
    callbackOrButtons?: ((text: string) => void) | AlertButton[],
    type?: "default" | "plain-text" | "secure-text" | "login-password",
    defaultValue?: string,
    keyboardType?: string
  ) => {
    if (globalHandler) {
      let mappedButtons: AlertButton[] = [];

      if (typeof callbackOrButtons === "function") {
        mappedButtons = [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "OK",
            onPress: (val) => callbackOrButtons(val || ""),
          },
        ];
      } else if (Array.isArray(callbackOrButtons)) {
        mappedButtons = callbackOrButtons;
      } else {
        // Default prompt buttons if nothing is passed
        mappedButtons = [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "OK",
          },
        ];
      }

      globalHandler({
        id: Math.random().toString(36).substring(2),
        title,
        message,
        buttons: mappedButtons,
        options: { cancelable: false },
        isPrompt: true,
        promptType: type === "secure-text" ? "secure-text" : "plain-text",
        defaultValue,
        keyboardType,
      });
    } else {
      if (originalPrompt) {
        originalPrompt(title, message, callbackOrButtons as any, type, defaultValue, keyboardType);
      } else {
        console.warn("Native Alert.prompt is not available on this platform, falling back to Alert.alert.");
        // Fallback for Android in standard environment if no handler is registered
        originalAlert(title, message, [
          {
            text: "OK",
          }
        ]);
      }
    }
  };
};
