// Screens/CaseDetailsScreen/GenerateDocumentScreen.tsx
import React, { useContext, useEffect, useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";
import { v4 as uuidv4 } from "uuid";

import { ThemeContext, Theme } from "../../Providers/ThemeProvider";
import { useTranslation } from "../../Providers/LanguageProvider";
import { useAdTrigger } from "../CommonComponents/AdManager";
import { HomeStackParamList } from "../../Types/navigationtypes";
import { getCaseById } from "../../DataBase";
import { CaseWithDetails } from "../../DataBase";
import FormInput from "../CommonComponents/FormInput";
import DropdownPicker from "../CommonComponents/DropdownPicker";
import ActionButton from "../CommonComponents/ActionButton";
import SectionHeader from "../CommonComponents/SectionHeader";
import { formatDate } from "../../utils/commonFunctions";
import {
  getVakalatnamaHtml,
  getAdjournmentHtml,
  getBailHtml,
  getAffidavitHtml,
  getWrittenStatementHtml,
  getLegalNoticeHtml,
  getCaveatHtml,
  getInjunctionHtml,
  getPlaintHtml,
  getRejoinderHtml,
  getExecutionHtml,
  getAnticipatoryBailHtml,
  getPrivateComplaintHtml,
  getFirQuashingHtml,
  getExemptionHtml,
  getChequeBounceHtml,
  getArbitrationSec9Html,
  getConsumerComplaintHtml,
  getRentAgreementHtml,
  getPowerOfAttorneyHtml,
  getTemplateTextPreview,
} from "../../utils/documentTemplates";

type GenerateDocumentScreenRouteProp = RouteProp<
  HomeStackParamList,
  "GenerateDocument"
>;

const categories = [
  { label: "All Categories", value: "all" },
  { label: "Civil (CPC)", value: "civil" },
  { label: "Criminal (CrPC)", value: "criminal" },
  { label: "Commercial / ADR", value: "commercial" },
  { label: "Common Deeds", value: "common" },
];

interface DocumentTypeOption {
  label: string;
  value: string;
  category: string;
}

const documentTypeOptions: DocumentTypeOption[] = [
  // Civil (CPC)
  { label: "Plaint (Civil Suit)", value: "plaint", category: "civil" },
  { label: "Written Statement (Defense Reply)", value: "written_statement", category: "civil" },
  { label: "Replication / Rejoinder", value: "rejoinder", category: "civil" },
  { label: "Temporary Injunction / Stay (Order 39 R 1/2)", value: "injunction", category: "civil" },
  { label: "Execution Petition (Order 21)", value: "execution", category: "civil" },
  { label: "Caveat Petition (Sec 148A CPC)", value: "caveat", category: "civil" },
  { label: "Adjournment Application", value: "adjournment", category: "civil" },

  // Criminal (CrPC)
  { label: "Bail Application (Sec 439 CrPC)", value: "bail", category: "criminal" },
  { label: "Anticipatory Bail (Sec 438 CrPC)", value: "anticipatory_bail", category: "criminal" },
  { label: "Private Complaint (Sec 200 CrPC)", value: "private_complaint", category: "criminal" },
  { label: "FIR Quashing Petition (Sec 482)", value: "fir_quashing", category: "criminal" },
  { label: "Exemption Application (Sec 205/317)", value: "exemption", category: "criminal" },

  // Commercial / ADR
  { label: "Cheque Bounce Notice (Sec 138 NI)", value: "cheque_bounce", category: "commercial" },
  { label: "Arbitration Section 9 Petition", value: "arbitration_sec9", category: "commercial" },
  { label: "Consumer Complaint", value: "consumer_complaint", category: "commercial" },

  // Common Deeds
  { label: "Vakalatnama (Authority Letter)", value: "vakalatnama", category: "common" },
  { label: "Supporting Affidavit", value: "affidavit", category: "common" },
  { label: "Legal Notice (Demand Notice)", value: "legal_notice", category: "common" },
  { label: "Rent Agreement", value: "rent_agreement", category: "common" },
  { label: "Power of Attorney (POA)", value: "power_of_attorney", category: "common" },
];

const DRAFTS_DIRECTORY = FileSystem.documentDirectory + "draft_documents/";

const GenerateDocumentScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<GenerateDocumentScreenRouteProp>();
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();
  const styles = getStyles(theme);
  const { showAdWithPreload } = useAdTrigger();

  const caseId = route.params?.caseId;
  const [caseDetails, setCaseDetails] = useState<CaseWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Tab selector: "fields" or "preview"
  const [activeTab, setActiveTab] = useState<"fields" | "preview">("fields");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [documentType, setDocumentType] = useState<string>("vakalatnama");
  const [outputLanguage, setOutputLanguage] = useState<"en" | "hi">("en");

  useLayoutEffect(() => {
    navigation.setOptions({ title: t("docgen_header_title") });
  }, [navigation, t]);

  const getTranslatedCategories = () => {
    return categories.map(cat => {
      let label = cat.label;
      switch (cat.value) {
        case "all": label = t("docgen_cat_all"); break;
        case "civil": label = t("docgen_cat_civil"); break;
        case "criminal": label = t("docgen_cat_criminal"); break;
        case "commercial": label = t("docgen_cat_commercial"); break;
        case "common": label = t("docgen_cat_common"); break;
      }
      return { ...cat, label };
    });
  };

  const getTranslatedDocTypes = () => {
    return documentTypeOptions.map(opt => {
      let label = opt.label;
      switch (opt.value) {
        case "plaint": label = t("docgen_opt_plaint"); break;
        case "written_statement": label = t("docgen_opt_written_statement"); break;
        case "rejoinder": label = t("docgen_opt_rejoinder"); break;
        case "injunction": label = t("docgen_opt_injunction"); break;
        case "execution": label = t("docgen_opt_execution"); break;
        case "caveat": label = t("docgen_opt_caveat"); break;
        case "adjournment": label = t("docgen_opt_adjournment"); break;
        case "bail": label = t("docgen_opt_bail"); break;
        case "anticipatory_bail": label = t("docgen_opt_anticipatory_bail"); break;
        case "private_complaint": label = t("docgen_opt_private_complaint"); break;
        case "fir_quashing": label = t("docgen_opt_fir_quashing"); break;
        case "exemption": label = t("docgen_opt_exemption"); break;
        case "cheque_bounce": label = t("docgen_opt_cheque_bounce"); break;
        case "arbitration_sec9": label = t("docgen_opt_arbitration_sec9"); break;
        case "consumer_complaint": label = t("docgen_opt_consumer_complaint"); break;
        case "vakalatnama": label = t("docgen_opt_vakalatnama"); break;
        case "affidavit": label = t("docgen_opt_affidavit"); break;
        case "legal_notice": label = t("docgen_opt_legal_notice"); break;
        case "rent_agreement": label = t("docgen_opt_rent_agreement"); break;
        case "power_of_attorney": label = t("docgen_opt_power_of_attorney"); break;
      }
      return { ...opt, label };
    });
  };

  // Shared Case/Client details (Editable if no caseId is provided)
  const [caseTitle, setCaseTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [oppositePartyName, setOppositePartyName] = useState("");
  const [courtName, setCourtName] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [caseYear, setCaseYear] = useState("2026");

  // Shared Advocate details (with local caching via AsyncStorage)
  const [advocateName, setAdvocateName] = useState("");
  const [advocateEnrollment, setAdvocateEnrollment] = useState("");
  const [advocateAddress, setAdvocateAddress] = useState("");

  // Reusable fields
  const [adjournmentReason, setAdjournmentReason] = useState("");
  const [policeStation, setPoliceStation] = useState("");
  const [firNumber, setFirNumber] = useState("");
  const [firYear, setFirYear] = useState(new Date().getFullYear().toString());
  const [groundOfBail, setGroundOfBail] = useState("");
  const [deponentAge, setDeponentAge] = useState("");
  const [deponentAddress, setDeponentAddress] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [affidavitFacts, setAffidavitFacts] = useState("");
  const [preliminaryObjections, setPreliminaryObjections] = useState("");
  const [replyOnMerits, setReplyOnMerits] = useState("");
  const [demandText, setDemandText] = useState("");
  const [restraintPrayer, setRestraintPrayer] = useState("");

  // New specific fields
  const [valuation, setValuation] = useState("");
  const [replyPoints, setReplyPoints] = useState("");
  const [decreeDate, setDecreeDate] = useState("");
  const [satisfactionDetails, setSatisfactionDetails] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [dishonorDate, setDishonorDate] = useState("");
  const [termMonths, setTermMonths] = useState("11");
  const [witness1, setWitness1] = useState("");
  const [witness2, setWitness2] = useState("");

  // Load case metadata and cached advocate profile
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (caseId) {
          const details = await getCaseById(caseId);
          if (details) {
            setCaseDetails(details);
            setCaseTitle(`${details.FirstParty || details.ClientName || "Petitioner"} vs ${details.OppositeParty || "Respondent"}`);
            setClientName(details.ClientName || "");
            setOppositePartyName(details.OppositeParty || "");
            setCourtName(details.court_name || "");
            setCaseNumber(details.case_number || "");
            setCaseYear(details.case_year?.toString() || "2026");

            // Template-specific defaults
            setFirNumber(details.case_number || "");
            setPoliceStation(details.court_name ? `${details.court_name} Jurisdiction` : "");
          }
        }

        // Load cached advocate details
        const cachedName = await AsyncStorage.getItem("@advocate_name");
        const cachedEnrollment = await AsyncStorage.getItem("@advocate_enrollment");
        const cachedAddress = await AsyncStorage.getItem("@advocate_address");

        if (cachedName) setAdvocateName(cachedName);
        if (cachedEnrollment) setAdvocateEnrollment(cachedEnrollment);
        if (cachedAddress) setAdvocateAddress(cachedAddress);
      } catch (error) {
        console.error("Failed to load details for document generator:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [caseId]);

  // Handle caching advocate inputs to AsyncStorage on generate
  const cacheAdvocateProfile = async () => {
    try {
      await AsyncStorage.setItem("@advocate_name", advocateName);
      await AsyncStorage.setItem("@advocate_enrollment", advocateEnrollment);
      await AsyncStorage.setItem("@advocate_address", advocateAddress);
    } catch (e) {
      console.warn("Could not save advocate details to local storage:", e);
    }
  };

  // Compile document properties
  const getInterpolatedHtml = (): string => {
    const parties = caseTitle || `${clientName || "Petitioner"} vs ${oppositePartyName || "Respondent"}`;
    const isHindi = outputLanguage === "hi";

    if (documentType === "vakalatnama") {
      return getVakalatnamaHtml({
        courtName: courtName || "District Court",
        suitNumber: caseNumber,
        caseYear: caseYear,
        parties: parties,
        clientName: clientName || "Client",
        advocateName: advocateName || "Advocate",
        advocateEnrollment: advocateEnrollment,
        advocateAddress: advocateAddress,
      }, isHindi);
    } else if (documentType === "adjournment") {
      return getAdjournmentHtml({
        courtName: courtName || "District Court",
        caseNumber: caseNumber,
        parties: parties,
        nextHearingDate: caseDetails?.NextDate ? formatDate(caseDetails.NextDate) : "",
        reason: adjournmentReason || "Counsel is busy in another court",
        advocateName: advocateName || "Advocate",
      }, isHindi);
    } else if (documentType === "bail") {
      return getBailHtml({
        courtName: courtName || "Sessions Court",
        policeStation: policeStation,
        firNumber: firNumber,
        firYear: firYear,
        underSection: caseDetails?.Undersection || "",
        accusedName: caseDetails?.Accussed || clientName || "Accused",
        groundOfBail: groundOfBail || "the investigation is complete",
        advocateName: advocateName || "Advocate",
      }, isHindi);
    } else if (documentType === "affidavit") {
      return getAffidavitHtml({
        courtName: courtName || "District Court",
        caseNumber: caseNumber,
        parties: parties,
        deponentName: clientName || "Deponent",
        deponentAge: deponentAge,
        deponentAddress: deponentAddress,
        facts: affidavitFacts,
      }, isHindi);
    } else if (documentType === "written_statement") {
      return getWrittenStatementHtml({
        courtName: courtName || "District Court",
        caseNumber: caseNumber,
        parties: parties,
        respondentName: clientName || "Respondent",
        preliminaryObjections: preliminaryObjections,
        replyOnMerits: replyOnMerits,
        advocateName: advocateName || "Advocate",
      }, isHindi);
    } else if (documentType === "legal_notice") {
      return getLegalNoticeHtml({
        senderName: clientName || "Client",
        senderAddress: deponentAddress,
        receiverName: oppositePartyName || "Recipient",
        receiverAddress: receiverAddress,
        noticeSubject: caseTitle || "Legal Demand Notice",
        noticeFacts: affidavitFacts,
        demandText: demandText,
        advocateName: advocateName || "Advocate",
        advocateEnrollment: advocateEnrollment,
        advocateAddress: advocateAddress,
      }, isHindi);
    } else if (documentType === "caveat") {
      return getCaveatHtml({
        courtName: courtName || "District Court",
        caveatorName: clientName || "Caveator",
        caveatorAddress: deponentAddress,
        expectedOppositePartyName: oppositePartyName || "Opposite Party",
        expectedOppositePartyAddress: receiverAddress,
        subjectMatter: caseTitle || "Subject Dispute",
        advocateName: advocateName || "Advocate",
        advocateEnrollment: advocateEnrollment,
        advocateAddress: advocateAddress,
      }, isHindi);
    } else if (documentType === "injunction") {
      return getInjunctionHtml({
        courtName: courtName || "District Court",
        caseNumber: caseNumber,
        parties: parties,
        applicantName: clientName || "Applicant",
        injunctionFacts: affidavitFacts,
        restraintPrayer: restraintPrayer,
        advocateName: advocateName || "Advocate",
      }, isHindi);
    } else if (documentType === "plaint") {
      return getPlaintHtml({
        courtName: courtName || "District Court",
        caseNumber: caseNumber,
        caseYear: caseYear,
        parties: parties,
        plaintiffName: clientName || "Plaintiff",
        defendantName: oppositePartyName || "Defendant",
        valuation: valuation,
        suitFacts: affidavitFacts,
        prayerText: restraintPrayer,
        advocateName: advocateName || "Advocate",
      }, isHindi);
    } else if (documentType === "rejoinder") {
      return getRejoinderHtml({
        courtName: courtName || "District Court",
        caseNumber: caseNumber,
        caseYear: caseYear,
        parties: parties,
        replyPoints: replyPoints,
        advocateName: advocateName || "Advocate",
      }, isHindi);
    } else if (documentType === "execution") {
      return getExecutionHtml({
        courtName: courtName || "District Court",
        caseNumber: caseNumber,
        caseYear: caseYear,
        decreeHolder: clientName || "Decree Holder",
        judgmentDebtor: oppositePartyName || "Judgment Debtor",
        decreeDate: decreeDate,
        decreetalAmount: valuation,
        satisfactionDetails: satisfactionDetails,
        reliefSought: restraintPrayer,
        advocateName: advocateName || "Advocate",
      }, isHindi);
    } else if (documentType === "anticipatory_bail") {
      return getAnticipatoryBailHtml({
        courtName: courtName || "Sessions Court",
        policeStation: policeStation,
        firNumber: firNumber,
        firYear: firYear,
        underSection: caseDetails?.Undersection || "",
        applicantName: clientName || "Applicant",
        apprehensionReason: adjournmentReason,
        grounds: groundOfBail,
        advocateName: advocateName || "Advocate",
      }, isHindi);
    } else if (documentType === "private_complaint") {
      return getPrivateComplaintHtml({
        courtName: courtName || "Magistrate Court",
        complainantName: clientName || "Complainant",
        complainantAddress: deponentAddress,
        accusedName: oppositePartyName || "Accused",
        accusedAddress: receiverAddress,
        incidentDate: decreeDate,
        incidentFacts: affidavitFacts,
        offences: caseDetails?.Undersection || "IPC Sections",
        advocateName: advocateName || "Advocate",
      }, isHindi);
    } else if (documentType === "fir_quashing") {
      return getFirQuashingHtml({
        courtName: courtName || "High Court",
        policeStation: policeStation,
        firNumber: firNumber,
        firYear: firYear,
        applicantName: clientName || "Applicant",
        groundsOfQuashing: groundOfBail,
        advocateName: advocateName || "Advocate",
      }, isHindi);
    } else if (documentType === "exemption") {
      return getExemptionHtml({
        courtName: courtName || "District Court",
        caseNumber: caseNumber,
        caseYear: caseYear,
        parties: parties,
        accusedName: clientName || "Accused",
        excuseReason: groundOfBail || "medical grounds",
        advocateName: advocateName || "Advocate",
      }, isHindi);
    } else if (documentType === "cheque_bounce") {
      return getChequeBounceHtml({
        senderName: clientName || "Payee",
        senderAddress: deponentAddress,
        receiverName: oppositePartyName || "Drawer",
        receiverAddress: receiverAddress,
        chequeNumber: chequeNumber,
        chequeDate: decreeDate,
        bankName: policeStation || "Bank",
        chequeAmount: valuation,
        dishonorDate: dishonorDate,
        dishonorReason: groundOfBail || "Funds Insufficient",
        noticeDate: new Date().toLocaleDateString("en-IN"),
        demandPeriod: "15",
        advocateName: advocateName || "Advocate",
        advocateEnrollment: advocateEnrollment,
        advocateAddress: advocateAddress,
      }, isHindi);
    } else if (documentType === "arbitration_sec9") {
      return getArbitrationSec9Html({
        courtName: courtName || "District Court",
        parties: parties,
        agreementDate: decreeDate,
        disputeDetails: groundOfBail,
        interimRelief: restraintPrayer,
        advocateName: advocateName || "Advocate",
      }, isHindi);
    } else if (documentType === "consumer_complaint") {
      return getConsumerComplaintHtml({
        forumName: courtName || "Consumer Forum",
        complainantName: clientName || "Complainant",
        oppositePartyName: oppositePartyName || "Opposite Party",
        productDetails: caseTitle || "Product purchased",
        costAmount: valuation,
        deficiencyDetails: groundOfBail,
        compensationSought: restraintPrayer,
        advocateName: advocateName || "Advocate",
      }, isHindi);
    } else if (documentType === "rent_agreement") {
      return getRentAgreementHtml({
        landlordName: clientName || "Landlord",
        landlordAddress: deponentAddress,
        tenantName: oppositePartyName || "Tenant",
        tenantAddress: receiverAddress,
        propertyAddress: deponentAddress || "Rented Premises",
        rentAmount: valuation,
        securityDeposit: satisfactionDetails,
        termMonths: termMonths,
        agreementDate: decreeDate,
        witness1: witness1,
        witness2: witness2,
      }, isHindi);
    } else if (documentType === "power_of_attorney") {
      return getPowerOfAttorneyHtml({
        principalName: clientName || "Principal",
        principalAddress: deponentAddress,
        attorneyName: oppositePartyName || "Attorney",
        attorneyAddress: receiverAddress,
        powersGranted: restraintPrayer,
        executionDate: decreeDate,
        witness1: witness1,
        witness2: witness2,
      }, isHindi);
    }

    return "";
  };

  const getPreviewText = (): string => {
    const parties = caseTitle || `${clientName || "Petitioner"} vs ${oppositePartyName || "Respondent"}`;

    return getTemplateTextPreview(documentType, {
      courtName: courtName || "[COURT NAME]",
      suitNumber: caseNumber || "______",
      caseNumber: caseNumber || "______",
      caseYear: caseYear || "2026",
      parties: parties,
      clientName: clientName || "[CLIENT NAME]",
      advocateName: advocateName || "[ADVOCATE NAME]",
      advocateEnrollment: advocateEnrollment || "______",
      advocateAddress: advocateAddress || "[ADVOCATE ADDRESS]",
      reason: adjournmentReason || "[REASON FOR ADJOURNMENT]",
      policeStation: policeStation || "[POLICE STATION]",
      firNumber: firNumber || "______",
      firYear: firYear || "2026",
      underSection: caseDetails?.Undersection || "[SECTIONS]",
      accusedName: caseDetails?.Accussed || clientName || "[ACCUSED NAME]",
      groundOfBail: groundOfBail || "[GROUNDS FOR BAIL]",
      deponentName: clientName || "[DEPONENT]",
      deponentAge: deponentAge || "___",
      deponentAddress: deponentAddress || "[DEPONENT ADDRESS]",
      facts: affidavitFacts || "[AFFIDAVIT STATEMENTS]",
      respondentName: clientName || "[RESPONDENT NAME]",
      preliminaryObjections: preliminaryObjections || "[PRELIMINARY OBJECTIONS]",
      replyOnMerits: replyOnMerits || "[REPLY ON MERITS]",
      receiverName: oppositePartyName || "[RECEIVER NAME]",
      receiverAddress: receiverAddress || "[RECEIVER ADDRESS]",
      senderName: clientName || "[SENDER NAME]",
      senderAddress: deponentAddress || "[SENDER ADDRESS]",
      noticeFacts: affidavitFacts || "[NOTICE FACTS]",
      demandText: demandText || "[DEMAND STATEMENT]",
      caveatorName: clientName || "[CAVEATOR]",
      caveatorAddress: deponentAddress || "[CAVEATOR ADDRESS]",
      expectedOppositePartyName: oppositePartyName || "[OPPOSITE PARTY]",
      expectedOppositePartyAddress: receiverAddress || "[OPPOSITE PARTY ADDRESS]",
      subjectMatter: caseTitle || "[SUBJECT DISPUTE]",
      applicantName: clientName || "[APPLICANT NAME]",
      injunctionFacts: affidavitFacts || "[INJUNCTION STATEMENTS]",
      restraintPrayer: restraintPrayer || "[RESTRAINT STAY PRAYER]",
      plaintiffName: clientName || "[PLAINTIFF NAME]",
      defendantName: oppositePartyName || "[DEFENDANT NAME]",
      valuation: valuation || "[VALUATION/AMOUNT]",
      suitFacts: affidavitFacts || "[SUIT FACTS]",
      prayerText: restraintPrayer || "[PRAYER TEXT]",
      replyPoints: replyPoints || "[REJOINDER REPLY POINTS]",
      decreeHolder: clientName || "[DECREE HOLDER]",
      judgmentDebtor: oppositePartyName || "[JUDGMENT DEBTOR]",
      decreeDate: decreeDate || "[DECREE DATE]",
      decreetalAmount: valuation || "[DECREETAL AMOUNT]",
      satisfactionDetails: satisfactionDetails || "[SATISFACTION DETAILS]",
      reliefSought: restraintPrayer || "[RELIEF SOUGHT]",
      apprehensionReason: adjournmentReason || "[APPREHENSION REASON]",
      grounds: groundOfBail || "[GROUNDS]",
      complainantName: clientName || "[COMPLAINANT NAME]",
      complainantAddress: deponentAddress || "[COMPLAINANT ADDRESS]",
      accusedName: oppositePartyName || "[ACCUSED NAME]",
      accusedAddress: receiverAddress || "[ACCUSED ADDRESS]",
      incidentDate: decreeDate || "[INCIDENT DATE]",
      incidentFacts: affidavitFacts || "[INCIDENT FACTS]",
      offences: caseDetails?.Undersection || "[OFFENCES]",
      groundsOfQuashing: groundOfBail || "[GROUNDS FOR QUASHING]",
      excuseReason: groundOfBail || "[REASON FOR EXEMPTION]",
      chequeNumber: chequeNumber || "[CHEQUE NUMBER]",
      chequeDate: decreeDate || "[CHEQUE DATE]",
      bankName: policeStation || "[BANK NAME]",
      chequeAmount: valuation || "[CHEQUE AMOUNT]",
      dishonorDate: dishonorDate || "[DISHONOR DATE]",
      dishonorReason: groundOfBail || "[DISHONOR REASON]",
      noticeDate: new Date().toLocaleDateString("en-IN"),
      demandPeriod: "15",
      agreementDate: decreeDate || "[AGREEMENT DATE]",
      disputeDetails: groundOfBail || "[DISPUTE DETAILS]",
      interimRelief: restraintPrayer || "[INTERIM RELIEF]",
      forumName: courtName || "[CONSUMER COMMISSION FORUM]",
      productDetails: caseTitle || "[PRODUCT DETAILS]",
      costAmount: valuation || "[PRODUCT COST AMOUNT]",
      deficiencyDetails: groundOfBail || "[DEFICIENCY DETAILS]",
      compensationSought: restraintPrayer || "[COMPENSATION SOUGHT]",
      landlordName: clientName || "[LANDLORD NAME]",
      landlordAddress: deponentAddress || "[LANDLORD ADDRESS]",
      tenantName: oppositePartyName || "[TENANT NAME]",
      tenantAddress: receiverAddress || "[TENANT ADDRESS]",
      propertyAddress: deponentAddress || "[PROPERTY ADDRESS]",
      rentAmount: valuation || "[RENT AMOUNT]",
      securityDeposit: satisfactionDetails || "[SECURITY DEPOSIT]",
      termMonths: termMonths || "[TERM MONTHS]",
      witness1: witness1 || "[WITNESS 1]",
      witness2: witness2 || "[WITNESS 2]",
      principalName: clientName || "[PRINCIPAL NAME]",
      principalAddress: deponentAddress || "[PRINCIPAL ADDRESS]",
      attorneyName: oppositePartyName || "[ATTORNEY NAME]",
      attorneyAddress: receiverAddress || "[ATTORNEY ADDRESS]",
      powersGranted: restraintPrayer || "[POWERS GRANTED]",
      executionDate: decreeDate || "[EXECUTION DATE]",
    }, outputLanguage);
  };

  const handleGeneratePdf = async () => {
    await showAdWithPreload("rewarded", async (success) => {
      if (success) {
        setIsGenerating(true);
        await cacheAdvocateProfile();

        try {
          const htmlContent = getInterpolatedHtml();
          const { uri } = await Print.printToFileAsync({ html: htmlContent });

          if (caseId) {
            // Case-associated document sharing
            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(uri, {
                mimeType: "application/pdf",
                dialogTitle: `Export_${documentType.toUpperCase()}`,
                UTI: "com.adobe.pdf",
              });
            }
          } else {
            // Stand-alone Document Mode: save to drafts directory and cache metadata in AsyncStorage
            const dirInfo = await FileSystem.getInfoAsync(DRAFTS_DIRECTORY);
            if (!dirInfo.exists) {
              await FileSystem.makeDirectoryAsync(DRAFTS_DIRECTORY, { intermediates: true });
            }

            const draftId = uuidv4();
            const storedFilename = `${draftId}.pdf`;
            const destinationUri = DRAFTS_DIRECTORY + storedFilename;

            await FileSystem.copyAsync({ from: uri, to: destinationUri });

            // Retrieve existing unassociated drafts
            const existingRaw = await AsyncStorage.getItem("@unassociated_documents");
            const existingDrafts = existingRaw ? JSON.parse(existingRaw) : [];

            const newDraft = {
              id: draftId,
              title: `${documentTypeOptions.find((o) => o.value === documentType)?.label || "Draft"} - ${
                clientName || "Unassociated"
              }`,
              templateType: documentType,
              filePath: destinationUri,
              createdAt: new Date().toISOString(),
            };

            existingDrafts.push(newDraft);
            await AsyncStorage.setItem("@unassociated_documents", JSON.stringify(existingDrafts));

            Alert.alert(
              t("docgen_alert_saved_title"),
              t("docgen_alert_saved_desc"),
              [
                {
                  text: t("docgen_alert_go_drafts"),
                  onPress: () => {
                    // @ts-ignore
                    navigation.navigate("DraftsHub");
                  },
                },
                {
                  text: t("docgen_alert_close"),
                  onPress: () => navigation.goBack(),
                },
              ]
            );
          }
        } catch (error) {
          console.error("Error generating PDF template:", error);
          Alert.alert(t("alert_error"), t("doc_err_upload_general"));
        } finally {
          setIsGenerating(false);
        }
      }
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ marginTop: 12, color: theme.colors.textSecondary }}>
          {t("docgen_preparing")}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Tab Selectors */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "fields" && styles.activeTabButton]}
          onPress={() => setActiveTab("fields")}
        >
          <Ionicons
            name="create-outline"
            size={18}
            color={activeTab === "fields" ? theme.colors.primary : theme.colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === "fields" && styles.activeTabText]}>{t("docgen_tab_fields")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "preview" && styles.activeTabButton]}
          onPress={() => setActiveTab("preview")}
        >
          <Ionicons
            name="eye-outline"
            size={18}
            color={activeTab === "preview" ? theme.colors.primary : theme.colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === "preview" && styles.activeTabText]}>{t("docgen_tab_preview")}</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "fields" ? (
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.scrollContentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            <SectionHeader title={t("docgen_sec_selection")} />
            <DropdownPicker
              label={t("docgen_sec_selection")}
              selectedValue={selectedCategory}
              onValueChange={(val) => {
                const newCat = val as string;
                setSelectedCategory(newCat);
                // Auto-select first document of new category if current one is not valid
                const isStillValid = documentTypeOptions.some(
                  (opt) => opt.value === documentType && (newCat === "all" || opt.category === newCat)
                );
                if (!isStillValid) {
                  const firstOfCategory = documentTypeOptions.find(
                    (opt) => newCat === "all" || opt.category === newCat
                  );
                  if (firstOfCategory) {
                    setDocumentType(firstOfCategory.value);
                  }
                }
              }}
              options={getTranslatedCategories()}
            />

            <DropdownPicker
              label={t("docgen_opt_vakalatnama")}
              selectedValue={documentType}
              onValueChange={(val) => setDocumentType(val as string)}
              options={getTranslatedDocTypes().filter(
                (opt) => selectedCategory === "all" || opt.category === selectedCategory
              )}
              placeholder={t("docgen_opt_vakalatnama")}
            />

            <SectionHeader title={t("docgen_sec_lang")} />
            <View style={{ flexDirection: "row", marginBottom: 16 }}>
              <TouchableOpacity
                style={[
                  styles.langButton,
                  outputLanguage === "en" && styles.activeLangButton,
                ]}
                onPress={() => setOutputLanguage("en")}
              >
                <Text
                  style={[
                    styles.langText,
                    outputLanguage === "en" && styles.activeLangText,
                  ]}
                >
                  English
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.langButton,
                  outputLanguage === "hi" && styles.activeLangButton,
                ]}
                onPress={() => setOutputLanguage("hi")}
              >
                <Text
                  style={[
                    styles.langText,
                    outputLanguage === "hi" && styles.activeLangText,
                  ]}
                >
                  हिन्दी (Hindi)
                </Text>
              </TouchableOpacity>
            </View>

            {!caseId && (
              <View>
                <SectionHeader title={t("docgen_sec_case_details")} />
                <FormInput
                  label={t("docgen_field_client_label")}
                  value={clientName}
                  onChangeText={setClientName}
                  placeholder={t("docgen_placeholder_client")}
                />
                <FormInput
                  label={t("docgen_field_opposite_label")}
                  value={oppositePartyName}
                  onChangeText={setOppositePartyName}
                  placeholder={t("docgen_placeholder_opposite")}
                />
                <FormInput
                  label={t("docgen_field_parties_label")}
                  value={caseTitle}
                  onChangeText={setCaseTitle}
                  placeholder={t("docgen_placeholder_parties")}
                />
                <FormInput
                  label={t("docgen_field_court_label")}
                  value={courtName}
                  onChangeText={setCourtName}
                  placeholder={t("docgen_placeholder_court")}
                />
                <FormInput
                  label={t("docgen_field_case_num_label")}
                  value={caseNumber}
                  onChangeText={setCaseNumber}
                  placeholder={t("docgen_placeholder_case_num")}
                />
                <FormInput
                  label={t("docgen_field_case_year_label")}
                  value={caseYear}
                  onChangeText={setCaseYear}
                  placeholder={t("docgen_placeholder_case_year")}
                  keyboardType="numeric"
                />
              </View>
            )}

            <SectionHeader title={t("docgen_sec_advocate")} />
            <FormInput
              label={t("docgen_field_adv_name_label")}
              value={advocateName}
              onChangeText={setAdvocateName}
              placeholder={t("docgen_placeholder_adv_name")}
            />
            <FormInput
              label={t("docgen_field_bar_label")}
              value={advocateEnrollment}
              onChangeText={setAdvocateEnrollment}
              placeholder={t("docgen_placeholder_bar")}
            />
            <FormInput
              label={t("docgen_field_addr_label")}
              value={advocateAddress}
              onChangeText={setAdvocateAddress}
              placeholder={t("docgen_placeholder_addr")}
            />

            <SectionHeader title={t("docgen_sec_customization")} />

            {/* Custom Inputs per template */}
            {documentType === "adjournment" && (
              <View>
                <FormInput
                  label={t("docgen_field_adjournment_reason")}
                  value={adjournmentReason}
                  onChangeText={setAdjournmentReason}
                  placeholder={t("docgen_placeholder_adjournment_reason")}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}

            {(documentType === "bail" || documentType === "anticipatory_bail" || documentType === "fir_quashing" || documentType === "private_complaint" || documentType === "cheque_bounce") && (
              <View>
                <FormInput
                  label={documentType === "cheque_bounce" ? t("docgen_field_bank_name") : t("docgen_field_police_station")}
                  value={policeStation}
                  onChangeText={setPoliceStation}
                  placeholder={documentType === "cheque_bounce" ? t("docgen_placeholder_bank_name") : t("docgen_placeholder_police_station")}
                />
                {documentType !== "cheque_bounce" && documentType !== "private_complaint" && (
                  <View>
                    <FormInput
                      label={t("docgen_field_fir_number")}
                      value={firNumber}
                      onChangeText={setFirNumber}
                      placeholder={t("docgen_placeholder_fir_number")}
                    />
                    <FormInput
                      label={t("docgen_field_fir_year")}
                      value={firYear}
                      onChangeText={setFirYear}
                      placeholder={t("docgen_placeholder_fir_year")}
                      keyboardType="numeric"
                    />
                  </View>
                )}
                {(documentType === "bail" || documentType === "anticipatory_bail" || documentType === "fir_quashing") && (
                  <FormInput
                    label={documentType === "fir_quashing" ? t("docgen_field_quashing_grounds") : t("docgen_field_bail_grounds")}
                    value={groundOfBail}
                    onChangeText={setGroundOfBail}
                    placeholder={t("docgen_placeholder_bail_grounds")}
                    multiline
                    numberOfLines={4}
                  />
                )}
                {documentType === "anticipatory_bail" && (
                  <FormInput
                    label={t("docgen_field_apprehension_reason")}
                    value={adjournmentReason}
                    onChangeText={setAdjournmentReason}
                    placeholder={t("docgen_placeholder_apprehension_reason")}
                    multiline
                    numberOfLines={3}
                  />
                )}
              </View>
            )}

            {(documentType === "affidavit" || documentType === "legal_notice" || documentType === "caveat" || documentType === "private_complaint" || documentType === "rent_agreement" || documentType === "power_of_attorney" || documentType === "cheque_bounce") && (
              <View>
                {caseId && (documentType === "affidavit") && (
                  <FormInput
                    label={t("docgen_field_deponent_name")}
                    value={clientName}
                    onChangeText={setClientName}
                    placeholder={t("docgen_placeholder_deponent_name")}
                  />
                )}
                {documentType === "affidavit" && (
                  <FormInput
                    label={t("docgen_field_deponent_age")}
                    value={deponentAge}
                    onChangeText={setDeponentAge}
                    placeholder={t("docgen_placeholder_deponent_age")}
                    keyboardType="numeric"
                  />
                )}
                <FormInput
                  label={
                    documentType === "rent_agreement"
                      ? t("docgen_field_landlord_addr")
                      : documentType === "power_of_attorney"
                      ? t("docgen_field_principal_addr")
                      : documentType === "cheque_bounce"
                      ? t("docgen_field_payee_addr")
                      : t("docgen_field_deponent_addr")
                  }
                  value={deponentAddress}
                  onChangeText={setDeponentAddress}
                  placeholder={t("docgen_placeholder_deponent_addr")}
                />
                <FormInput
                  label={
                    documentType === "rent_agreement"
                      ? t("docgen_field_tenant_addr")
                      : documentType === "power_of_attorney"
                      ? t("docgen_field_attorney_addr")
                      : documentType === "cheque_bounce"
                      ? t("docgen_field_drawer_addr")
                      : t("docgen_field_receiver_addr")
                  }
                  value={receiverAddress}
                  onChangeText={setReceiverAddress}
                  placeholder={t("docgen_placeholder_receiver_addr")}
                />
              </View>
            )}

            {(documentType === "affidavit" || documentType === "injunction" || documentType === "plaint" || documentType === "private_complaint") && (
              <FormInput
                label={
                  documentType === "plaint"
                    ? t("docgen_field_suit_facts")
                    : documentType === "private_complaint"
                    ? t("docgen_field_incident_facts")
                    : t("docgen_field_facts")
                }
                value={affidavitFacts}
                onChangeText={setAffidavitFacts}
                placeholder={t("docgen_placeholder_facts")}
                multiline
                numberOfLines={5}
              />
            )}

            {documentType === "written_statement" && (
              <View>
                <FormInput
                  label={t("docgen_field_prelim_objections")}
                  value={preliminaryObjections}
                  onChangeText={setPreliminaryObjections}
                  placeholder={t("docgen_placeholder_prelim_objections")}
                  multiline
                  numberOfLines={4}
                />
                <FormInput
                  label={t("docgen_field_reply_merits")}
                  value={replyOnMerits}
                  onChangeText={setReplyOnMerits}
                  placeholder={t("docgen_placeholder_reply_merits")}
                  multiline
                  numberOfLines={4}
                />
              </View>
            )}

            {(documentType === "legal_notice" || documentType === "cheque_bounce") && (
              <FormInput
                label={t("docgen_field_demand_text")}
                value={demandText}
                onChangeText={setDemandText}
                placeholder={t("docgen_placeholder_demand_text")}
              />
            )}

            {(documentType === "injunction" || documentType === "plaint" || documentType === "execution" || documentType === "arbitration_sec9" || documentType === "consumer_complaint" || documentType === "power_of_attorney") && (
              <FormInput
                label={
                  documentType === "plaint"
                    ? t("docgen_field_suit_relief")
                    : documentType === "execution"
                    ? t("docgen_field_exec_relief")
                    : documentType === "arbitration_sec9"
                    ? t("docgen_field_interim_relief")
                    : documentType === "consumer_complaint"
                    ? t("docgen_field_consumer_relief")
                    : documentType === "power_of_attorney"
                    ? t("docgen_field_poa_powers")
                    : t("docgen_field_injunction_prayer")
                }
                value={restraintPrayer}
                onChangeText={setRestraintPrayer}
                placeholder={t("docgen_placeholder_relief")}
                multiline
                numberOfLines={4}
              />
            )}

            {(documentType === "plaint" || documentType === "execution" || documentType === "cheque_bounce" || documentType === "consumer_complaint" || documentType === "rent_agreement") && (
              <FormInput
                label={
                  documentType === "plaint"
                    ? t("docgen_field_suit_valuation")
                    : documentType === "execution"
                    ? t("docgen_field_exec_decree_amount")
                    : documentType === "cheque_bounce"
                    ? t("docgen_field_cheque_amount")
                    : documentType === "consumer_complaint"
                    ? t("docgen_field_consumer_cost")
                    : t("docgen_field_monthly_rent")
                }
                value={valuation}
                onChangeText={setValuation}
                placeholder={t("docgen_placeholder_valuation")}
                keyboardType="numeric"
              />
            )}

            {documentType === "rejoinder" && (
              <FormInput
                label={t("docgen_field_rejoinder_reply")}
                value={replyPoints}
                onChangeText={setReplyPoints}
                placeholder={t("docgen_placeholder_rejoinder_reply")}
                multiline
                numberOfLines={5}
              />
            )}

            {(documentType === "execution" || documentType === "private_complaint" || documentType === "cheque_bounce" || documentType === "arbitration_sec9" || documentType === "rent_agreement") && (
              <FormInput
                label={
                  documentType === "execution"
                    ? t("docgen_field_exec_decree_date")
                    : documentType === "cheque_bounce"
                    ? t("docgen_field_cheque_date")
                    : documentType === "private_complaint"
                    ? t("docgen_field_incident_date")
                    : documentType === "arbitration_sec9"
                    ? t("docgen_field_arbitration_date")
                    : t("docgen_field_rent_date")
                }
                value={decreeDate}
                onChangeText={setDecreeDate}
                placeholder={t("docgen_placeholder_date")}
              />
            )}

            {(documentType === "execution" || documentType === "rent_agreement") && (
              <FormInput
                label={
                  documentType === "execution"
                    ? t("docgen_field_exec_recovery")
                    : t("docgen_field_rent_deposit")
                }
                value={satisfactionDetails}
                onChangeText={setSatisfactionDetails}
                placeholder={documentType === "execution" ? t("docgen_placeholder_exec_recovery") : t("docgen_placeholder_rent_deposit")}
              />
            )}

            {documentType === "cheque_bounce" && (
              <View>
                <FormInput
                  label={t("docgen_field_cheque_number")}
                  value={chequeNumber}
                  onChangeText={setChequeNumber}
                  placeholder={t("docgen_placeholder_cheque_number")}
                />
                <FormInput
                  label={t("docgen_field_dishonor_date")}
                  value={dishonorDate}
                  onChangeText={setDishonorDate}
                  placeholder={t("docgen_placeholder_dishonor_date")}
                />
              </View>
            )}

            {documentType === "rent_agreement" && (
              <FormInput
                label={t("docgen_field_rent_term")}
                value={termMonths}
                onChangeText={setTermMonths}
                placeholder={t("docgen_placeholder_rent_term")}
                keyboardType="numeric"
              />
            )}

            {(documentType === "rent_agreement" || documentType === "power_of_attorney") && (
              <View>
                <FormInput
                  label={t("docgen_field_witness1")}
                  value={witness1}
                  onChangeText={setWitness1}
                  placeholder={t("docgen_placeholder_witness")}
                />
                <FormInput
                  label={t("docgen_field_witness2")}
                  value={witness2}
                  onChangeText={setWitness2}
                  placeholder={t("docgen_placeholder_witness")}
                />
              </View>
            )}

            {/* General Exemption & Consumer Complaint Info */}
            {documentType === "exemption" && (
              <FormInput
                label={t("docgen_field_exemption_reason")}
                value={groundOfBail}
                onChangeText={setGroundOfBail}
                placeholder={t("docgen_placeholder_exemption_reason")}
                multiline
                numberOfLines={3}
              />
            )}

            {documentType === "consumer_complaint" && (
              <View>
                <FormInput
                  label={t("docgen_field_deficiency_details")}
                  value={groundOfBail}
                  onChangeText={setGroundOfBail}
                  placeholder={t("docgen_placeholder_deficiency_details")}
                  multiline
                  numberOfLines={4}
                />
              </View>
            )}

            <View style={{ marginTop: 24 }}>
              <ActionButton
                title={isGenerating ? t("docgen_preparing") : caseId ? t("docgen_btn_export_share") : t("docgen_btn_save_draft")}
                onPress={handleGeneratePdf}
                type="primary"
                disabled={isGenerating || !advocateName}
                loading={isGenerating}
              />
            </View>
          </View>
        </ScrollView>
      ) : (
        /* Real-time Document Live Preview Layout mimicking standard Court Legal Paper sheet */
        <View style={styles.previewContainer}>
          <ScrollView contentContainerStyle={styles.legalPageSheet} showsVerticalScrollIndicator={true}>
            {/* Standard Red side margin line representing court ledger sheets */}
            <View style={styles.legalRedMarginLine} />
            <Text style={styles.legalDraftText}>{getPreviewText()}</Text>
          </ScrollView>
          <View style={styles.floatingPreviewButton}>
            <ActionButton
              title={isGenerating ? t("docgen_preparing") : caseId ? t("docgen_btn_export_share_short") : t("docgen_btn_save_draft_short")}
              onPress={handleGeneratePdf}
              type="primary"
              disabled={isGenerating || !advocateName}
              loading={isGenerating}
            />
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContentContainer: {
      flexGrow: 1,
      paddingBottom: 60,
    },
    formContainer: {
      padding: 16,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.background,
      padding: 20,
    },
    tabContainer: {
      flexDirection: "row",
      backgroundColor: theme.colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    tabButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    activeTabButton: {
      borderBottomColor: theme.colors.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 6,
      color: theme.colors.textSecondary,
    },
    activeTabText: {
      color: theme.colors.primary,
    },
    previewContainer: {
      flex: 1,
      backgroundColor: "#1E293B", // Dark backdrop to emphasize the legal paper
      padding: 16,
    },
    legalPageSheet: {
      backgroundColor: "#FDFBF7", // Legal yellow-white paper backing
      minHeight: Dimensions.get("window").height * 0.7,
      borderRadius: 4,
      padding: 24,
      paddingLeft: 44, // Generous left padding to clear the red margin line
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 6,
      position: "relative",
    },
    legalRedMarginLine: {
      position: "absolute",
      left: 36,
      top: 0,
      bottom: 0,
      width: 1,
      backgroundColor: "#F87171", // Left red margin line
    },
    legalDraftText: {
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif", // Times-like legal font
      fontSize: 14,
      lineHeight: 24,
      color: "#000000",
      textAlign: "justify",
      whiteSpace: "pre-wrap",
    },
    floatingPreviewButton: {
      marginTop: 16,
    },
    langButton: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.cardBackground,
      borderRadius: 8,
      marginRight: 8,
    },
    activeLangButton: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + "15",
    },
    langText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.textSecondary,
    },
    activeLangText: {
      color: theme.colors.primary,
      fontWeight: "bold",
    },
  });

export default GenerateDocumentScreen;
