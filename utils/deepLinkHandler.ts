import { NavigationContainerRef } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { snoozeNotification } from "./notificationScheduler";

export interface NotificationPayloadData {
  caseId?: number | string;
  type?: string;
  templateType?: string;
  date?: string;
  count?: number;
  pendingAmount?: number;
  feature?: string;
  [key: string]: any;
}

/**
 * Robust notification deep link dispatcher.
 * Handles background clicks, cold-boot launches, in-app toast taps, and action buttons.
 */
export async function handleNotificationDeepLink(
  navigationRef: NavigationContainerRef<any> | null,
  data?: NotificationPayloadData | null,
  actionId?: string,
  rawNotificationContent?: Notifications.NotificationContent
): Promise<boolean> {
  try {
    if (!navigationRef || !navigationRef.isReady()) {
      console.warn("Deep link skipped: NavigationContainer is not ready yet.");
      return false;
    }

    // 1. Handle Background/Lockscreen Snooze Actions
    if (actionId === "SNOOZE_1H" || actionId === "SNOOZE_3H") {
      const minutes = actionId === "SNOOZE_3H" ? 180 : 60;
      await snoozeNotification(
        rawNotificationContent?.title || "Hearing Reminder",
        rawNotificationContent?.body || "",
        data,
        minutes
      );
      return true;
    }

    // 2. Handle Proactive Document Drafting Action (Bail, WS, Vakalatnama, etc.)
    if (actionId === "DRAFT_DOCUMENT" || data?.type === "proactive_draft") {
      if (data?.caseId) {
        navigationRef.navigate("App", {
          screen: "MainApp",
          params: {
            screen: "Home",
            params: {
              screen: "GenerateDocument",
              params: {
                caseId: Number(data.caseId),
                templateType: data?.templateType || undefined,
              },
            },
          },
        });
      } else {
        navigationRef.navigate("App", {
          screen: "MainApp",
          params: {
            screen: "Home",
            params: {
              screen: "DraftsHub",
            },
          },
        });
      }
      return true;
    }

    // 3. Handle Scan Case Files Action (PDF Scanner)
    if (actionId === "SCAN_FILES" || data?.type === "scan_document") {
      navigationRef.navigate("App", {
        screen: "MainApp",
        params: {
          screen: "Home",
          params: {
            screen: "PdfScanner",
            params: {
              caseId: data?.caseId ? Number(data.caseId) : undefined,
            },
          },
        },
      });
      return true;
    }

    // 4. Handle 1-Tap Reschedule Lockscreen Action / Mid-Day Recess Update
    if (
      (actionId === "RESCHEDULE" || actionId === "RESCHEDULE_TODAY") &&
      data?.caseId
    ) {
      navigationRef.navigate("App", {
        screen: "MainApp",
        params: {
          screen: "Home",
          params: {
            screen: "CaseDetails",
            params: {
              caseId: Number(data.caseId),
              autoOpenHearingModal: true,
            },
          },
        },
      });
      return true;
    }

    // 5. Handle Mid-Day Recess General Tap
    if (data?.type === "recess_adjournment") {
      if (data?.caseId) {
        navigationRef.navigate("App", {
          screen: "MainApp",
          params: {
            screen: "Home",
            params: {
              screen: "CaseDetails",
              params: {
                caseId: Number(data.caseId),
                autoOpenHearingModal: true,
              },
            },
          },
        });
      } else {
        navigationRef.navigate("App", {
          screen: "MainApp",
          params: {
            screen: "Home",
            params: {
              screen: "HomeScreen",
            },
          },
        });
      }
      return true;
    }

    // 6. Handle Fee Recovery Alerts
    if (actionId === "OPEN_FEE_REMINDER" || data?.type === "fee_reminder") {
      if (data?.caseId) {
        navigationRef.navigate("App", {
          screen: "MainApp",
          params: {
            screen: "Home",
            params: {
              screen: "CaseDetails",
              params: {
                caseId: Number(data.caseId),
              },
            },
          },
        });
      } else {
        navigationRef.navigate("App", {
          screen: "MainApp",
          params: {
            screen: "Home",
            params: {
              screen: "NotificationInbox",
              params: {
                initialCategory: "fees",
              },
            },
          },
        });
      }
      return true;
    }

    // 7. Handle Feature Discovery Notifications
    if (data?.type === "feature_discovery") {
      if (data?.feature === "scanner") {
        navigationRef.navigate("App", {
          screen: "MainApp",
          params: {
            screen: "Home",
            params: {
              screen: "PdfScanner",
            },
          },
        });
      } else if (data?.feature === "drafts") {
        navigationRef.navigate("App", {
          screen: "MainApp",
          params: {
            screen: "Home",
            params: {
              screen: "GenerateDocument",
            },
          },
        });
      } else if (data?.feature === "backup") {
        navigationRef.navigate("App", {
          screen: "MainApp",
          params: {
            screen: "Settings",
          },
        });
      } else {
        navigationRef.navigate("App", {
          screen: "MainApp",
          params: {
            screen: "Home",
            params: {
              screen: "HomeScreen",
            },
          },
        });
      }
      return true;
    }

    // 8. Handle 1-Tap Open Cause List Lockscreen Action
    if (actionId === "OPEN_CAUSE_LIST") {
      navigationRef.navigate("App", {
        screen: "MainApp",
        params: {
          screen: "Home",
          params: {
            screen: "HomeScreen",
          },
        },
      });
      return true;
    }

    // 9. Handle Case-specific Notifications (Limitation Alert, Single Hearing)
    if (data?.caseId) {
      navigationRef.navigate("App", {
        screen: "MainApp",
        params: {
          screen: "Home",
          params: {
            screen: "CaseDetails",
            params: {
              caseId: Number(data.caseId),
            },
          },
        },
      });
      return true;
    }

    // 10. Handle Overdue Hearings Alert
    if (data?.type === "overdue_hearings_alert") {
      navigationRef.navigate("App", {
        screen: "MainApp",
        params: {
          screen: "Home",
          params: {
            screen: "AllCases",
            params: {
              Filter: "overdue",
            },
          },
        },
      });
      return true;
    }

    // 11. Handle Morning Briefings, Weekly Digests & Daily Cause Lists
    if (
      data?.type === "morning_briefing" ||
      data?.type === "hearing_summary" ||
      data?.type === "weekly_briefing"
    ) {
      navigationRef.navigate("App", {
        screen: "MainApp",
        params: {
          screen: "Home",
          params: {
            screen: "HomeScreen",
          },
        },
      });
      return true;
    }

    // 12. Handle Evening Previews (Next Day Calendar Schedule)
    if (data?.type === "evening_preview") {
      navigationRef.navigate("App", {
        screen: "MainApp",
        params: {
          screen: "Calendar",
        },
      });
      return true;
    }

    return false;
  } catch (err) {
    console.warn("Error executing notification deep link:", err);
    return false;
  }
}

/**
 * Checks if the app was opened from a cold-start by tapping a push notification
 * and routes the user directly to the target destination.
 */
export async function processInitialNotificationResponse(
  navigationRef: NavigationContainerRef<any> | null
): Promise<boolean> {
  try {
    const lastResponse = await Notifications.getLastNotificationResponseAsync();
    if (!lastResponse) return false;

    const actionId = lastResponse.actionIdentifier;
    const content = lastResponse.notification.request.content;
    const data = content.data as NotificationPayloadData;

    return await handleNotificationDeepLink(
      navigationRef,
      data,
      actionId,
      content
    );
  } catch (err) {
    console.warn("Error processing initial notification response:", err);
    return false;
  }
}
