import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import InAppNotificationToast, {
  ToastNotification,
} from "../Screens/CommonComponents/InAppNotificationToast";

export interface ToastOptions {
  title?: string;
  message: string;
  type?: "success" | "info" | "warning" | "error";
  duration?: number;
  data?: any;
  onPress?: (data: any) => void;
}

interface ToastContextValue {
  showToast: (options: ToastOptions | string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
  hideToast: () => {},
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentToast, setCurrentToast] = useState<ToastNotification | null>(
    null
  );
  const toastCountRef = useRef(0);

  const hideToast = useCallback(() => {
    setCurrentToast(null);
  }, []);

  const showToast = useCallback((options: ToastOptions | string) => {
    const opts: ToastOptions =
      typeof options === "string" ? { message: options } : options;

    toastCountRef.current += 1;
    const toastId = `toast_${Date.now()}_${toastCountRef.current}`;

    let defaultTitle = "Notice";
    if (opts.type === "success") defaultTitle = "Success";
    else if (opts.type === "error") defaultTitle = "Error";
    else if (opts.type === "warning") defaultTitle = "Warning";
    else if (opts.type === "info") defaultTitle = "Info";

    // Strictly replace current toast (guarantees exactly 1 toast at a time)
    setCurrentToast({
      id: toastId,
      title: opts.title || defaultTitle,
      body: opts.message,
      type: opts.type || "success",
      duration: opts.duration || 2800,
      data: opts.data,
      onPress: opts.onPress,
    });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <InAppNotificationToast
        notification={currentToast}
        onDismiss={hideToast}
        onPress={(data) => {
          if (currentToast?.onPress) {
            currentToast.onPress(data);
          }
        }}
      />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export default ToastContext;
