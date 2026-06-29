import { Alert, Linking, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCaseById, getUserProfile, getDb } from "../DataBase";
import { formatDate } from "./commonFunctions";

/**
 * Prompts the advocate to send a WhatsApp notification to the client.
 * Fetches case and advocate details, formats the message, and launches WhatsApp.
 */
export const promptClientNotification = async (
  caseId: number,
  nextHearingDate?: string,
  notes?: string
): Promise<void> => {
  try {
    // 1. Fetch case details
    const caseDetails = await getCaseById(caseId);
    if (!caseDetails || !caseDetails.ClientContactNumber) {
      console.log(`promptClientNotification: No contact number for case ID ${caseId}. Skipping.`);
      return;
    }

    const clientPhone = caseDetails.ClientContactNumber.replace(/\D/g, "");
    if (!clientPhone) {
      console.log(`promptClientNotification: Sanitized contact number is empty. Skipping.`);
      return;
    }

    // 2. Resolve advocate name
    let advocateName = "";
    try {
      const userId = await AsyncStorage.getItem("@user_id");
      if (userId) {
        const dbInstance = await getDb();
        const profile = await getUserProfile(dbInstance, parseInt(userId, 10));
        if (profile?.name) {
          advocateName = profile.name;
        }
      }
      if (!advocateName) {
        advocateName = (await AsyncStorage.getItem("@advocate_name")) || "";
      }
    } catch (e) {
      console.warn("Failed to load advocate details for reminder:", e);
    }
    if (!advocateName) {
      advocateName = "Advocate";
    }

    // 3. Resolve user language/locale templates
    const lang = (await AsyncStorage.getItem("@user_language")) || "en";
    const clientName = caseDetails.ClientName || "Client";
    const caseTitle = caseDetails.CaseTitle || "Legal Matter";
    const caseNumber = caseDetails.case_number || "N/A";
    const courtName = caseDetails.court_name || "N/A";
    const dateFormatted = nextHearingDate ? formatDate(nextHearingDate) : (caseDetails.NextDate ? formatDate(caseDetails.NextDate) : "N/A");

    let message = "";
    if (lang === "hi") {
      message = `प्रिय ${clientName},\n\nयह आपके केस "${caseTitle}" (केस संख्या: ${caseNumber}) के संबंध में एक अनुस्मारक है, जो कि न्यायालय ${courtName} में ${dateFormatted} को सुनवाई के लिए सूचीबद्ध है।\n\nकृपया उपस्थित रहें। यदि आपके कोई प्रश्न हैं तो हमें बताएं।`;
      if (notes && notes.trim()) {
        message += `\n\nविवरण: ${notes.trim()}`;
      }
      message += `\n\nसादर,\n${advocateName}`;
    } else {
      message = `Dear ${clientName},\n\nThis is a reminder regarding your case "${caseTitle}" (Case Number: ${caseNumber}) listed for hearing on ${dateFormatted} in ${courtName}.\n\nKindly be present. Let us know if you have any questions.`;
      if (notes && notes.trim()) {
        message += `\n\nNotes: ${notes.trim()}`;
      }
      message += `\n\nRegards,\n${advocateName}`;
    }

    // 4. Show Prompt Alert
    Alert.alert(
      lang === "hi" ? "मुवक्किल को सूचित करें" : "Notify Client",
      lang === "hi" 
        ? "मामला सहेजा गया। क्या आप मुवक्किल को व्हाट्सएप के माध्यम से सूचित करना चाहते हैं?"
        : "Hearing saved. Would you like to notify the client via WhatsApp?",
      [
        {
          text: lang === "hi" ? "नहीं" : "No",
          style: "cancel",
        },
        {
          text: lang === "hi" ? "हाँ" : "Yes",
          onPress: async () => {
            const url = `whatsapp://send?text=${encodeURIComponent(message)}&phone=${clientPhone}`;
            try {
              const supported = await Linking.canOpenURL(url);
              if (supported) {
                await Linking.openURL(url);
              } else {
                await Linking.openURL(`https://wa.me/${clientPhone}?text=${encodeURIComponent(message)}`);
              }
            } catch (err) {
              console.error("Failed to open WhatsApp URL:", err);
            }
          },
        },
      ]
    );
  } catch (error) {
    console.error("Failed to process client WhatsApp prompt:", error);
  }
};
