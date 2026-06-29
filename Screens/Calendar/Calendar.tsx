import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useState, useCallback, useContext } from "react";
import { formatDate, getLocalDateString, parseLocalDate } from "../../utils/commonFunctions";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  Platform,
} from "react-native";
import { Calendar } from "react-native-calendars";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import * as db from "../../DataBase";
import NewCaseCard from "../CasesList/components/NewCaseCard";
import { CaseDataScreen } from "../../Types/appTypes";
import UpdateHearingPopup from "../CaseDetailsScreen/components/UpdateHearingPopup";
import { getCurrentUserId } from "../../utils/commonFunctions";
import { ThemeContext } from "../../Providers/ThemeProvider";
import { mapCaseDbToScreen } from "../../utils/caseMapper";
import { useTranslation } from "../../Providers/LanguageProvider";
import { promptClientNotification } from "../../utils/whatsappNotifier";

interface Props {
  // Add your prop types here
}

const CalendarScreen: React.FC<Props> = () => {
  const { theme } = useContext(ThemeContext);
  const { t, locale } = useTranslation();
  const currentDate = new Date();
  const [selected, setSelected] = useState(
    getLocalDateString(currentDate)
  );
  const [ResultToshow, setResultToShow] = useState<CaseDataScreen[]>([]);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseDataScreen | null>(null);
  const [filter, setFilter] = useState<"All" | "High" | "Active" | "Pending">("All");
  const navigation = useNavigation();

  const getResultFromDate = async (date: string) => {
    const allCases = await db.getCases();
    const filteredCases = allCases.filter(c => {
      if (!c.NextDate) return false;
      const caseDate = c.NextDate.split('T')[0];
      return caseDate === date;
    });

    const mappedCases: CaseDataScreen[] = filteredCases.map(mapCaseDbToScreen);
    setResultToShow(mappedCases);
  };

  const fetchAllDates = async () => {
    const allCases = await db.getCases();
    const datesArray = allCases
      .map((item) => item.NextDate ? item.NextDate.split('T')[0] : null)
      .filter(Boolean);

    const formattedDates = datesArray.reduce((acc: any, date) => {
      const dateString = date;
      if (acc[dateString]) {
        acc[dateString].eventsCount += 1;
      } else {
        acc[dateString] = { marked: true, eventsCount: 1 };
      }
      return acc;
    }, {});

    setMarkedDates(formattedDates);
  };

  useFocusEffect(
    useCallback(() => {
      fetchAllDates();
      getResultFromDate(selected);
    }, [selected])
  );

  const handleUpdateHearing = (caseDetails: CaseDataScreen) => {
    setSelectedCase(caseDetails);
    setPopupVisible(true);
  };

  const handleSaveHearing = async (notes: string, nextHearingDate: Date, userId: number) => {
    if (!selectedCase || !selectedCase.id) return;
    const caseId = parseInt(selectedCase.id.toString(), 10);
    if(isNaN(caseId)) return;

    try {
      const caseExists = await db.getCaseById(caseId);
      if(!caseExists) {
        console.error("Case not found");
        return;
      }
      // 1. Add timeline event
      if (notes) {
        await db.addCaseTimelineEvent({
          case_id: caseId,
          hearing_date: new Date().toISOString(),
          notes: notes,
        });
      }

      // 2. Update case's next hearing date
      await db.updateCase(caseId, {
        NextDate: getLocalDateString(nextHearingDate),
      }, userId);

      // 3. Refresh the list
      fetchAllDates();
      getResultFromDate(selected);

      // 4. Prompt WhatsApp notification to client
      setTimeout(() => {
        promptClientNotification(caseId, getLocalDateString(nextHearingDate), notes);
      }, 500);
    } catch (error) {
      console.error("Error updating hearing:", error);
    }
  };

  const renderDay = (day: any, state: string) => {
    const isSelected = selected === day.dateString;
    const dayMarking = markedDates[day.dateString];
    const isDisabled = state === 'disabled';
    const isToday = state === 'today';

    return (
      <TouchableOpacity
        onPress={() => {
          setSelected(day.dateString);
        }}
        style={[
          styles.dayContainer,
          dayMarking && { backgroundColor: theme.colors.primary + '20' }, // translucent primary bg
          isSelected && { backgroundColor: theme.colors.primary },
          isToday && !isSelected && { borderColor: theme.colors.primary, borderWidth: 1.5 },
        ]}
      >
        <Text
          style={[
            styles.dayText,
            { color: isDisabled ? theme.colors.textSecondary + '40' : theme.colors.text },
            isSelected && styles.selectedDayText,
            isToday && !isSelected && { color: theme.colors.primary, fontWeight: 'bold' },
          ]}
        >
          {day.day}
        </Text>
        {dayMarking && (
          <View style={[styles.eventBubble, { backgroundColor: theme.colors.secondary }]}>
            <Text style={styles.eventBubbleText}>
              {dayMarking.eventsCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const displayedCases = ResultToshow.filter((c) => {
    if (filter === "All") return true;
    if (filter === "High") return c.priority === "High";
    if (filter === "Active") return c.status === "Active";
    if (filter === "Pending") return c.status === "Pending";
    return true;
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Calendar
          key={theme.dark ? "dark" : "light"}
          onDayPress={(day) => {
            setSelected(day.dateString);
          }}
          theme={{
            calendarBackground: theme.colors.cardBackground,
            textSectionTitleColor: theme.colors.textSecondary,
            selectedDayBackgroundColor: theme.colors.primary,
            selectedDayTextColor: '#ffffff',
            todayTextColor: theme.colors.primary,
            dayTextColor: theme.colors.text,
            textDisabledColor: theme.colors.textSecondary + '40',
            dotColor: theme.colors.primary,
            selectedDotColor: '#ffffff',
            arrowColor: theme.colors.primary,
            monthTextColor: theme.colors.text,
            indicatorColor: theme.colors.primary,
            textDayFontWeight: '300',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '500',
            textDayFontSize: 15,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 12,
          }}
          markedDates={{
            ...markedDates,
            [selected]: {
              selected: true,
              disableTouchEvent: true,
              selectedColor: theme.colors.primary,
              selectedTextColor: 'white'
            },
          }}
          dayComponent={({ date, state }) => renderDay(date, state)}
          renderArrow={(direction) => (
            <Icon 
              name={direction === "left" ? "chevron-left" : "chevron-right"} 
              size={26} 
              color={theme.colors.primary} 
            />
          )}
        />

        <View style={styles.filterContainer}>
          {(["All", "High", "Active", "Pending"] as const).map((item) => {
            const isSelected = filter === item;
            let label = item as string;
            if (item === "All") label = t("cal_filter_all");
            if (item === "High") label = t("cal_filter_high");
            if (item === "Active") label = t("cal_filter_active");
            if (item === "Pending") label = t("cal_filter_pending");
            
            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.cardBackground,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => setFilter(item)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: isSelected ? "#FFFFFF" : theme.colors.textSecondary,
                    },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.CardsContainer}>
          <View style={styles.agendaHeader}>
            <Icon name="calendar-clock" size={22} color={theme.colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.dateSubheading, { color: theme.colors.text }]}>
              {t("cal_agenda_for")} {parseLocalDate(selected)?.toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          
          <Text style={[styles.agendaCountText, { color: theme.colors.textSecondary }]}>
            {displayedCases.length} {displayedCases.length === 1 ? t("cal_hearing_scheduled") : t("cal_hearings_scheduled")}
          </Text>

          {displayedCases?.length > 0 ? (
            displayedCases.map((each, index) => (
              <NewCaseCard 
                key={index} 
                caseDetails={each} 
                onUpdateHearingPress={() => handleUpdateHearing(each)} 
                onPress={() => navigation.navigate('CaseDetails', { caseId: each.id })} 
              />
            ))
          ) : (
            <View style={[styles.emptyContainer, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
              <Icon name="calendar-blank-outline" size={48} color={theme.colors.textSecondary + '40'} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {t("cal_no_hearings")}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      {selectedCase && (
        <UpdateHearingPopup
          visible={isPopupVisible}
          onClose={() => setPopupVisible(false)}
          onSave={async (notes, nextHearingDate) =>
            handleSaveHearing(notes, nextHearingDate, await getCurrentUserId())
          }
        />
      )}
    </SafeAreaView>
  );
};

export default CalendarScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  container: {
    flex: 1,
  },
  CardsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  dayContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '400',
  },
  selectedDayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  eventBubble: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventBubbleText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  agendaHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  dateSubheading: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  agendaCountText: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 16,
    marginLeft: 30,
  },
  emptyContainer: {
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 15,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
