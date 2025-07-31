import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import React, { useCallback, useContext, useState, useEffect } from "react";
import {
  FlatList,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getCases, addCaseTimelineEvent, updateCase, getCaseById } from "../../DataBase";
import { Case } from "../../DataBase/schema";
import { ThemeContext } from "../../Providers/ThemeProvider";
import { CaseDataScreen } from "../../Types/appTypes";
import { formatDate, getCurrentUserId } from "../../utils/commonFunctions";
import NewCaseCard from "./components/NewCaseCard";
import UpdateHearingPopup from "../CaseDetailsScreen/components/UpdateHearingPopup";
import { getCasesListStyles } from "./CasesListStyle";

const transformApiCaseToCaseDataScreen = (apiCase: Case): CaseDataScreen => {
  return {
    id: apiCase.id.toString(),
    title: apiCase.CaseTitle || "No Title",
    client: apiCase.ClientName || "N/A",
    status: apiCase.CaseStatus || "N/A",
    nextHearing: apiCase.NextDate ? formatDate(apiCase.NextDate) : "N/A",
    lastUpdate: apiCase.updated_at ? formatDate(apiCase.updated_at) : "N/A",
    previousHearing: apiCase.PreviousDate
      ? formatDate(apiCase.PreviousDate)
      : "N/A",
  };
};
type FilterStatus = "Active" | "Closed";

type CasesListRouteProp = RouteProp<{ params: { Filter?: string } }, 'params'>;

const CasesList = () => {
  const route = useRoute<CasesListRouteProp>();
  const filterParam = route.params?.Filter;
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const styles = getCasesListStyles(theme);

  const [allCases, setAllCases] = useState<CaseDataScreen[]>([]);
  const [filteredCases, setFilteredCases] = useState<CaseDataScreen[]>([]);
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("Active");
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseDataScreen | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  useEffect(() => {
    filterAndSearchCases();
  }, [activeFilter, searchText, allCases]);

  const fetchData = async () => {
    try {
      const results = await getCases();
      setAllCases(
        results ? results.map(transformApiCaseToCaseDataScreen) : []
      );
    } catch (error) {
      console.error("Error fetching cases:", error);
      setAllCases([]);
    }
  };

  const filterAndSearchCases = () => {
    let tempCases = allCases;

    if (filterParam) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (filterParam === 'todaysCases') {
        tempCases = tempCases.filter(c => {
          if (c.nextHearing === 'N/A') return false;
          const hearingDate = new Date(c.nextHearing);
          hearingDate.setHours(0, 0, 0, 0);
          return hearingDate.getTime() === today.getTime();
        });
      } else if (filterParam === 'tomorrowCases') {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        tempCases = tempCases.filter(c => {
          if (c.nextHearing === 'N/A') return false;
          const hearingDate = new Date(c.nextHearing);
          hearingDate.setHours(0, 0, 0, 0);
          return hearingDate.getTime() === tomorrow.getTime();
        });
      } else if (filterParam === 'yesterdayCases') {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        tempCases = tempCases.filter(c => {
          if (c.nextHearing === 'N/A') return false;
          const hearingDate = new Date(c.nextHearing);
          hearingDate.setHours(0, 0, 0, 0);
          return hearingDate.getTime() === yesterday.getTime();
        });
      }
    } else {
      if (activeFilter === "Active") {
        tempCases = tempCases.filter((c) => c.status !== "Closed");
      } else if (activeFilter === "Closed") {
        tempCases = tempCases.filter((c) => c.status === "Closed");
      }
    }

    if (searchText.trim() !== "") {
      const lowerSearchText = searchText.toLowerCase();
      tempCases = tempCases.filter(
        (c) =>
          c.title.toLowerCase().includes(lowerSearchText) ||
          c.client.toLowerCase().includes(lowerSearchText)
      );
    }
    tempCases.sort((a, b) => {
      const aDate = new Date(a.nextHearing);
      const bDate = new Date(b.nextHearing);
      if (a.nextHearing === 'N/A') return 1;
      if (b.nextHearing === 'N/A') return -1;
      return aDate.getTime() - bDate.getTime();
    });
    setFilteredCases(tempCases);
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
  };

  const handleUpdateHearing = (caseDetails: CaseDataScreen) => {
    setSelectedCase(caseDetails);
    setPopupVisible(true);
  };

  const handleSaveHearing = async (notes: string, nextHearingDate: Date, userId: number) => {
    if (!selectedCase || !selectedCase.id) return;
    const caseId = parseInt(selectedCase.id.toString(), 10);
    if(isNaN(caseId)) return;

    try {
      const caseExists = await getCaseById(caseId);
      if(!caseExists) {
        console.error("Case not found");
        return;
      }
      if (notes) {
        await addCaseTimelineEvent({
          case_id: caseId,
          hearing_date: new Date().toISOString(),
          notes: notes,
        });
      }
      await updateCase(caseId, { NextDate: nextHearingDate.toISOString() }, userId);
      fetchData();
    } catch (error) {
      console.error("Error updating hearing:", error);
    }
  };

  const navigateToAddCase = () => {
    navigation.navigate("AddCase");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cases</Text>
        <TouchableOpacity onPress={navigateToAddCase} style={styles.addButton}>
          <Ionicons name="add-circle-outline" size={32} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.inputWrapper}>
          <AntDesign
            name="search1"
            size={20}
            color={theme.colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Search cases..."
            placeholderTextColor={theme.colors.placeholderText}
            onChangeText={handleSearchChange}
            value={searchText}
          />
        </View>
      </View>

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            activeFilter === "Active" ? styles.activeButton : styles.inactiveButton,
          ]}
          onPress={() => setActiveFilter("Active")}
        >
          <Text style={activeFilter === "Active" ? styles.activeButtonText : styles.inactiveButtonText}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            activeFilter === "Closed" ? styles.activeButton : styles.inactiveButton,
          ]}
          onPress={() => setActiveFilter("Closed")}
        >
          <Text style={activeFilter === "Closed" ? styles.activeButtonText : styles.inactiveButtonText}>
            Closed
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredCases}
        renderItem={({ item }) => (
          <NewCaseCard
            caseDetails={item}
            onUpdateHearingPress={() => handleUpdateHearing(item)}
          />
        )}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        ListEmptyComponent={
          <View style={styles.emptyListContainer}>
            <Text style={styles.emptyListText}>No cases found.</Text>
          </View>
        }
        contentContainerStyle={styles.listContentContainer}
      />
      {selectedCase && (
        <UpdateHearingPopup
          visible={isPopupVisible}
          onClose={() => setPopupVisible(false)}
          onSave={(notes, nextHearingDate) =>
            handleSaveHearing(notes, nextHearingDate, getCurrentUserId())
          }
        />
      )}
    </SafeAreaView>
  );
};

export default CasesList;
