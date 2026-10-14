// Screens/CaseDetailsScreen/GenerateDocumentScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  StatusBar,
} from "react-native";

import {
  getCaseById,
  getDocumentDrafts,
  getDocumentDraftById,
  CaseWithDetails,
  DocumentDraft,
} from "../../DataBase";
import { useTranslation } from "../../Providers/LanguageProvider";
import { ThemeContext, Theme } from "../../Providers/ThemeProvider";
import { HomeStackParamList } from "../../Types/navigationtypes";
import { compileLegalDocumentHtml } from "../../utils/documentTemplates";

type GenerateDocumentScreenRouteProp = RouteProp<
  HomeStackParamList,
  "GenerateDocument"
>;

const CATEGORY_OPTIONS = [
  { label: "All Categories", labelHi: "सभी श्रेणियां", value: "all" },
  { label: "Civil (CPC)", labelHi: "सिविल (CPC)", value: "civil" },
  { label: "Criminal (CrPC)", labelHi: "क्रिमिनल (CrPC)", value: "criminal" },
  { label: "Commercial / ADR", labelHi: "कमर्शियल / ADR", value: "commercial" },
  { label: "Common Docs", labelHi: "सामान्य दस्तावेज़", value: "common" },
  { label: "Reusable Templates", labelHi: "पुनः प्रयोज्य टेम्पलेट्स", value: "reusable" },
];

export const BUILT_IN_TEMPLATES = [
  {
    id: "built_in_blank_page",
    template_type: "blank_page",
    title: "Blank Canvas (Start from Scratch)",
    titleHi: "कोरा दस्तावेज़ (शुरुआत से)",
    category: "reusable",
    isBuiltIn: true,
  },
  {
    id: "built_in_vakalatnama",
    template_type: "vakalatnama",
    title: "Vakalatnama",
    titleHi: "वकालतनामा (प्राधिकार पत्र)",
    category: "common",
    isBuiltIn: true,
  },
  {
    id: "built_in_adjournment",
    template_type: "adjournment",
    title: "Adjournment Application",
    titleHi: "स्थगन प्रार्थना पत्र",
    category: "common",
    isBuiltIn: true,
  },
  {
    id: "built_in_bail",
    template_type: "bail",
    title: "Bail Application (Sec 439)",
    titleHi: "नियमित जमानत आवेदन (धारा 439)",
    category: "criminal",
    isBuiltIn: true,
  },
  {
    id: "built_in_affidavit",
    template_type: "affidavit",
    title: "Supporting Affidavit",
    titleHi: "शपथ पत्र (हलफनामा)",
    category: "common",
    isBuiltIn: true,
  },
  {
    id: "built_in_written_statement",
    template_type: "written_statement",
    title: "Written Statement",
    titleHi: "लिखित कथन (जवाब दावा)",
    category: "civil",
    isBuiltIn: true,
  },
  {
    id: "built_in_legal_notice",
    template_type: "legal_notice",
    title: "Legal Demand Notice",
    titleHi: "विधिक मांग नोटिस",
    category: "common",
    isBuiltIn: true,
  },
  {
    id: "built_in_caveat",
    template_type: "caveat",
    title: "Caveat Petition",
    titleHi: "कैविएट याचिका (धारा 148क)",
    category: "civil",
    isBuiltIn: true,
  },
  {
    id: "built_in_injunction",
    template_type: "injunction",
    title: "Temporary Injunction",
    titleHi: "अस्थाई निषेधाज्ञा (आदेश 39)",
    category: "civil",
    isBuiltIn: true,
  },
  {
    id: "built_in_plaint",
    template_type: "plaint",
    title: "Plaint (Civil Suit)",
    titleHi: "वाद पत्र (दीवानी दावा)",
    category: "civil",
    isBuiltIn: true,
  },
  {
    id: "built_in_rejoinder",
    template_type: "rejoinder",
    title: "Replication / Rejoinder",
    titleHi: "प्रत्युत्तर (रिजॉइंडर)",
    category: "civil",
    isBuiltIn: true,
  },
  {
    id: "built_in_execution",
    template_type: "execution",
    title: "Execution Petition",
    titleHi: "निष्पादन याचिका (आदेश 21)",
    category: "civil",
    isBuiltIn: true,
  },
  {
    id: "built_in_anticipatory_bail",
    template_type: "anticipatory_bail",
    title: "Anticipatory Bail (Sec 438)",
    titleHi: "अग्रिम जमानत (धारा 438)",
    category: "criminal",
    isBuiltIn: true,
  },
  {
    id: "built_in_private_complaint",
    template_type: "private_complaint",
    title: "Private Complaint (Sec 200)",
    titleHi: "निजी परिवाद (धारा 200)",
    category: "criminal",
    isBuiltIn: true,
  },
  {
    id: "built_in_fir_quashing",
    template_type: "fir_quashing",
    title: "FIR Quashing (Sec 482)",
    titleHi: "प्राथमिकी निरस्तीकरण (धारा 482)",
    category: "criminal",
    isBuiltIn: true,
  },
  {
    id: "built_in_exemption",
    template_type: "exemption",
    title: "Exemption (Sec 317 CrPC)",
    titleHi: "हाजिरी माफी आवेदन (धारा 317)",
    category: "common",
    isBuiltIn: true,
  },
  {
    id: "built_in_cheque_bounce",
    template_type: "cheque_bounce",
    title: "Cheque Bounce Notice",
    titleHi: "चेक अनादर नोटिस (धारा 138)",
    category: "commercial",
    isBuiltIn: true,
  },
  {
    id: "built_in_arbitration_sec9",
    template_type: "arbitration_sec9",
    title: "Arbitration Sec 9",
    titleHi: "मध्यस्थता अंतरिम राहत (धारा 9)",
    category: "commercial",
    isBuiltIn: true,
  },
  {
    id: "built_in_consumer_complaint",
    template_type: "consumer_complaint",
    title: "Consumer Complaint",
    titleHi: "उपभोक्ता परिवाद",
    category: "commercial",
    isBuiltIn: true,
  },
  {
    id: "built_in_rent_agreement",
    template_type: "rent_agreement",
    title: "Rent Agreement",
    titleHi: "किरायानामा (रेंट एग्रीमेंट)",
    category: "commercial",
    isBuiltIn: true,
  },
  {
    id: "built_in_power_of_attorney",
    template_type: "power_of_attorney",
    title: "Power of Attorney",
    titleHi: "मुख्तारनामा (पावर ऑफ अटॉर्नी)",
    category: "commercial",
    isBuiltIn: true,
  },
];

const documentTypeColors: Record<string, string> = {
  blank_page: "#6B7280",
  vakalatnama: "#10B981",
  adjournment: "#3B82F6",
  bail: "#F59E0B",
  affidavit: "#8B5CF6",
  written_statement: "#EC4899",
  legal_notice: "#EF4444",
  caveat: "#06B6D4",
  injunction: "#6366F1",
  plaint: "#10B981",
  rejoinder: "#F59E0B",
  execution: "#8B5CF6",
  anticipatory_bail: "#3B82F6",
  private_complaint: "#EC4899",
  fir_quashing: "#EF4444",
  exemption: "#06B6D4",
  cheque_bounce: "#6366F1",
  arbitration_sec9: "#8B5CF6",
  consumer_complaint: "#10B981",
  rent_agreement: "#F59E0B",
  power_of_attorney: "#EC4899",
};

interface TemplateCardItemProps {
  item: any;
  color: string;
  theme: any;
  language?: "en" | "hi";
  onPress: (item: any) => void;
}

const TemplateCardItem: React.FC<TemplateCardItemProps> = React.memo(
  ({ item, color, theme, language = "en", onPress }) => {
    const displayTitle =
      language === "hi" ? item.titleHi || item.title : item.title;

    return (
      <TouchableOpacity
        style={{
          flex: 1,
          margin: 6,
          backgroundColor: theme.colors.cardBackground,
          borderRadius: 12,
          padding: 12,
          borderWidth: 1,
          borderColor: theme.colors.border,
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,
          maxWidth: (Dimensions.get("window").width - 32) / 2 - 12,
        }}
        activeOpacity={0.85}
        onPress={() => onPress(item)}
      >
        <View
          style={{
            width: 72,
            height: 104,
            backgroundColor: "#fcf9f2",
            borderRadius: 6,
            borderWidth: 1.5,
            borderColor: "#e2d2b2",
            position: "relative",
            overflow: "hidden",
            marginBottom: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 3,
          }}
        >
          <View
            style={{
              position: "absolute",
              left: 14,
              top: 0,
              bottom: 0,
              width: 1,
              backgroundColor: "#ef4444",
              opacity: 0.6,
            }}
          />
          <View
            style={{
              marginTop: 14,
              paddingLeft: 18,
              paddingRight: 6,
              gap: 5,
            }}
          >
            <View style={{ height: 3, backgroundColor: "#d1d5db", width: "80%" }} />
            <View style={{ height: 3, backgroundColor: "#d1d5db", width: "90%" }} />
            <View style={{ height: 3, backgroundColor: "#d1d5db", width: "65%" }} />
            <View style={{ height: 3, backgroundColor: "#e5e7eb", width: "85%" }} />
            <View style={{ height: 3, backgroundColor: "#e5e7eb", width: "70%" }} />
            <View style={{ height: 3, backgroundColor: "#e5e7eb", width: "90%" }} />
            <View style={{ height: 3, backgroundColor: "#e5e7eb", width: "50%" }} />
          </View>
          <View
            style={{
              position: "absolute",
              bottom: 4,
              right: 4,
              backgroundColor: color,
              borderRadius: 3,
              paddingHorizontal: 4,
              paddingVertical: 2,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 8, fontWeight: "bold" }}>
              DOC
            </Text>
          </View>
        </View>

        <Text
          style={{
            fontSize: 13,
            fontWeight: "bold",
            color: theme.colors.text,
            textAlign: "center",
            marginBottom: 6,
            height: 36,
          }}
          numberOfLines={2}
        >
          {displayTitle}
        </Text>

        <View
          style={{
            backgroundColor: item.isBuiltIn
              ? `${theme.colors.primary}12`
              : `${theme.colors.success || "#10B981"}12`,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 4,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "600",
              color: item.isBuiltIn
                ? theme.colors.primary
                : theme.colors.success || "#10B981",
            }}
          >
            {item.isBuiltIn
              ? language === "hi"
                ? "मानक"
                : "Built-in"
              : language === "hi"
              ? "कस्टम"
              : "Custom"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
);

const GenerateDocumentScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<GenerateDocumentScreenRouteProp>();
  const { theme } = useContext(ThemeContext);
  const { t, locale } = useTranslation();
  const styles = getStyles(theme);

  const caseId = route.params?.caseId;
  const [caseDetails, setCaseDetails] = useState<CaseWithDetails | null>(null);
  const [outputLanguage, setOutputLanguage] = useState<"en" | "hi">("en");

  const [customTemplates, setCustomTemplates] = useState<DocumentDraft[]>([]);
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState("all");

  useEffect(() => {
    navigation.setOptions({
      title: locale === "hi" ? "दस्तावेज़ प्रारूप चुनें" : "Select Document Template",
    });
  }, [navigation, locale]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        if (caseId) {
          const c = await getCaseById(caseId);
          if (isMounted) setCaseDetails(c);
        }
        const templates = await getDocumentDrafts(null, 1, true);
        if (isMounted && templates) setCustomTemplates(templates);
      } catch (err) {
        console.error("Failed to load initial data in GenerateDocumentScreen:", err);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [caseId]);

  const filteredTemplates = useMemo(() => {
    const combined = [
      ...BUILT_IN_TEMPLATES,
      ...customTemplates.map((t) => ({
        id: t.id,
        template_type: t.template_type,
        title: t.title,
        titleHi: t.title,
        category: "reusable",
        isBuiltIn: false,
      })),
    ];

    let filtered = combined;
    if (templateSearchQuery.trim() !== "") {
      const q = templateSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.titleHi && t.titleHi.toLowerCase().includes(q)) ||
          t.template_type.toLowerCase().includes(q)
      );
    }

    if (selectedTemplateCategory !== "all") {
      filtered = filtered.filter((t) =>
        selectedTemplateCategory === "reusable"
          ? t.category === "reusable" || !t.isBuiltIn
          : t.category === selectedTemplateCategory
      );
    }

    return filtered;
  }, [customTemplates, templateSearchQuery, selectedTemplateCategory]);

  const handleSelectTemplateCard = useCallback(
    async (item: any) => {
      let compiledHtml = "";
      if (item.isBuiltIn) {
        let advocateName = "";
        let advocateEnrollment = "";
        let advocateAddress = "";
        try {
          advocateName = (await AsyncStorage.getItem("@advocate_name")) || "";
          advocateEnrollment = (await AsyncStorage.getItem("@advocate_enrollment")) || "";
          advocateAddress = (await AsyncStorage.getItem("@advocate_address")) || "";
        } catch (e) {}

        const combinedData = {
          ...caseDetails,
          courtName: caseDetails?.court || caseDetails?.court_name,
          caseNumber: caseDetails?.case_number,
          caseYear: caseDetails?.case_year,
          clientName: caseDetails?.ClientName,
          parties:
            caseDetails?.CaseTitle ||
            `${caseDetails?.FirstParty || caseDetails?.ClientName || "Petitioner"} vs ${caseDetails?.OppositeParty || "Respondent"}`,
          advocateName,
          advocateEnrollment,
          advocateAddress,
          policeStation: caseDetails?.policeStationName,
          firNumber: caseDetails?.crime_number,
          underSection: caseDetails?.Undersection,
          accusedName: caseDetails?.Accussed || caseDetails?.ClientName,
        };

        compiledHtml = compileLegalDocumentHtml(
          item.template_type,
          combinedData,
          outputLanguage === "hi"
        );
      } else {
        try {
          const draft = await getDocumentDraftById(item.id);
          if (draft) {
            compiledHtml = draft.html_content;
          }
        } catch (err) {
          console.error("Failed to load template draft HTML:", err);
        }
      }

      // Seamlessly navigate forward into Modern Tiptap Editor
      navigation.navigate("TiptapEditDraft", {
        caseId: caseId ? Number(caseId) : undefined,
        initialHtml: compiledHtml,
        templateType: item.template_type,
        language: outputLanguage,
        title: `${outputLanguage === "hi" ? item.titleHi || item.title : item.title} - ${caseDetails?.ClientName || "Draft"}`,
      });
    },
    [caseDetails, outputLanguage, caseId, navigation]
  );

  // Auto-launch if templateType was pre-supplied via params
  useEffect(() => {
    if (route.params?.templateType) {
      const match =
        BUILT_IN_TEMPLATES.find((t) => t.template_type === route.params?.templateType) || {
          id: "custom",
          template_type: route.params.templateType,
          title: "Legal Document",
          isBuiltIn: true,
        };
      handleSelectTemplateCard(match);
    }
  }, [route.params?.templateType, handleSelectTemplateCard]);

  const categoriesList = useMemo(() => {
    return CATEGORY_OPTIONS.map((cat) => ({
      label: locale === "hi" ? cat.labelHi : cat.label,
      value: cat.value,
    }));
  }, [locale]);

  const renderTemplateCardItem = useCallback(
    ({ item }: { item: any }) => {
      const color =
        documentTypeColors[item.template_type] || theme.colors.primary;
      return (
        <TemplateCardItem
          item={item}
          color={color}
          theme={theme}
          language={outputLanguage}
          onPress={handleSelectTemplateCard}
        />
      );
    },
    [theme, outputLanguage, handleSelectTemplateCard]
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["bottom", "left", "right"]}
    >
      <StatusBar
        barStyle={theme.isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.background}
      />

      {/* Case Header Indicator if linked to a case */}
      {caseDetails && (
        <View
          style={{
            backgroundColor: `${theme.colors.primary}12`,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: `${theme.colors.primary}25`,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text
              style={{
                fontSize: 11,
                color: theme.colors.primary,
                fontWeight: "700",
                textTransform: "uppercase",
              }}
            >
              Drafting For Case
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "bold",
                color: theme.colors.text,
              }}
              numberOfLines={1}
            >
              {caseDetails.CaseTitle || "Legal Matter"} (Client: {caseDetails.ClientName || "N/A"})
            </Text>
          </View>
          <Ionicons name="briefcase-outline" size={20} color={theme.colors.primary} />
        </View>
      )}

      {/* Language Toggle & Search Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 8,
          backgroundColor: theme.colors.cardBackground,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: "700", color: theme.colors.text }}>
          {locale === "hi" ? "दस्तावेज़ की भाषा:" : "Document Language:"}
        </Text>
        <View
          style={{
            flexDirection: "row",
            backgroundColor: theme.isDark ? "#1f2937" : "#e5e7eb",
            borderRadius: 8,
            padding: 2,
          }}
        >
          <TouchableOpacity
            style={{
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 6,
              backgroundColor: outputLanguage === "en" ? theme.colors.primary : "transparent",
            }}
            onPress={() => setOutputLanguage("en")}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "bold",
                color: outputLanguage === "en" ? "#ffffff" : theme.colors.textSecondary,
              }}
            >
              English
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 6,
              backgroundColor: outputLanguage === "hi" ? "#ea580c" : "transparent",
            }}
            onPress={() => setOutputLanguage("hi")}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "bold",
                color: outputLanguage === "hi" ? "#ffffff" : theme.colors.textSecondary,
              }}
            >
              हिन्दी
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 12, paddingBottom: 8, backgroundColor: theme.colors.cardBackground }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.colors.background,
            borderRadius: 8,
            paddingHorizontal: 10,
            borderWidth: 1,
            borderColor: theme.colors.border,
            height: 40,
          }}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={theme.colors.textSecondary}
            style={{ marginRight: 6 }}
          />
          <TextInput
            placeholder={locale === "hi" ? "टेम्पलेट्स खोजें..." : "Search templates..."}
            placeholderTextColor={theme.colors.textSecondary}
            style={{
              flex: 1,
              color: theme.colors.text,
              fontSize: 14,
              padding: 0,
            }}
            value={templateSearchQuery}
            onChangeText={setTemplateSearchQuery}
          />
          {templateSearchQuery !== "" && (
            <TouchableOpacity onPress={() => setTemplateSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={16}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories segmented tabs deck */}
      <View style={{ height: 46, backgroundColor: theme.colors.cardBackground }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            gap: 8,
          }}
          style={{
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        >
          {categoriesList.map((cat) => {
            const isSelected = selectedTemplateCategory === cat.value;
            return (
              <TouchableOpacity
                key={cat.value}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 20,
                  backgroundColor: isSelected
                    ? theme.colors.primary
                    : `${theme.colors.border}40`,
                  height: 28,
                  justifyContent: "center",
                  alignItems: "center",
                }}
                onPress={() => setSelectedTemplateCategory(cat.value)}
              >
                <Text
                  style={{
                    color: isSelected ? "#ffffff" : theme.colors.text,
                    fontSize: 12,
                    fontWeight: "bold",
                  }}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Grid List */}
      <FlatList
        data={filteredTemplates}
        renderItem={renderTemplateCardItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: 10, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        windowSize={3}
        ListEmptyComponent={
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              marginTop: 40,
            }}
          >
            <Ionicons
              name="document-text-outline"
              size={48}
              color={theme.colors.textSecondary}
              style={{ opacity: 0.5 }}
            />
            <Text style={{ marginTop: 10, color: theme.colors.textSecondary }}>
              {locale === "hi"
                ? "कोई मिलता-जुलता प्रारूप नहीं मिला"
                : "No matching templates found"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default GenerateDocumentScreen;

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.background,
      padding: 20,
    },
  });
