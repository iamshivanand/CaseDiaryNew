import React, { useEffect, useState, useCallback } from "react";
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

import {
  fetchFieldsAsync,
  searchFormsAccordingToFieldsAsync,
} from "../../DataBase";
import NewCaseCard from "../CasesList/components/NewCaseCard";
import { CaseData, CaseDataScreen } from "../../Types/appTypes";

interface Props {
  // Add your prop types here
}

const CalendarScreen: React.FC<Props> = () => {
  const currentDate = new Date();
  const [selected, setSelected] = useState(
    currentDate.toISOString().slice(0, 10)
  );
  const [ResultToshow, setResultToShow] = useState<CaseDataScreen[]>([]);
  const [markedDates, setMarkedDates] = useState({});

  const getResultFromDate = async (date: string) => {
    const result = await searchFormsAccordingToFieldsAsync(
      global.db,
      "NextDate",
      date
    );
    const mappedCases: CaseDataScreen[] = result._array.map((c: CaseData) => ({
        id: c.id,
        title: c.CaseTitle || 'No Title',
        client: c.ClientName || 'Unknown Client',
        status: c.CaseStatus || 'Pending',
        nextHearing: c.NextDate ? new Date(c.NextDate).toLocaleDateString() : 'N/A',
        lastUpdate: c.updated_at ? new Date(c.updated_at).toLocaleDateString() : 'N/A',
        previousHearing: c.PreviousDate ? new Date(c.PreviousDate).toLocaleDateString() : 'N/A',
    }));
    setResultToShow(mappedCases);
  };

  const fetchAllDates = async () => {
    const result = await fetchFieldsAsync(global.db, ["NextDate"]);
    const datesArray = result.map((item) => item.NextDate);

    const formattedDates = datesArray.reduce((acc, date) => {
      if (acc[date]) {
        acc[date].eventsCount += 1;
      } else {
        acc[date] = { marked: true, eventsCount: 1 };
      }
      return acc;
    }, {});

    setMarkedDates(formattedDates);
  };

  useEffect(() => {
    fetchAllDates();
  }, []);

  useEffect(() => {
    getResultFromDate(selected);
  }, [selected]);

  const renderDay = (day, item) => {
    const isSelected = selected === day.dateString;
    const dayMarking = markedDates[day.dateString];

    return (
      <TouchableOpacity
        onPress={() => {
          setSelected(day.dateString);
        }}
        style={[
          styles.dayContainer,
          isSelected && styles.selectedDay,
        ]}
      >
        <Text
          style={[
            styles.dayText,
            isSelected && styles.selectedDayText,
          ]}
        >
          {day.day}
        </Text>
        {dayMarking && (
          <View style={styles.eventBubble}>
            <Text style={styles.eventBubbleText}>
              {dayMarking.eventsCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Calendar
        onDayPress={(day) => {
          setSelected(day.dateString);
        }}
        markedDates={{
          ...markedDates,
          [selected]: {
            selected: true,
            disableTouchEvent: true,
            selectedColor: 'blue',
            selectedTextColor: 'white'
          },
        }}
        dayComponent={({ date, state }) => renderDay(date, markedDates[date.dateString])}
      />
      <ScrollView
        style={styles.container}
      >
        <View style={styles.CardsContainer}>
          <Text>Selected Date is {selected}</Text>
          {ResultToshow?.map((each, index) => (
            <NewCaseCard key={index} caseDetails={each} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CalendarScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  container: {
    flex: 1,
  },
  CardsContainer: {
    alignItems: "center",
    padding: 16,
  },
  dayContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  selectedDay: {
    backgroundColor: 'blue',
  },
  dayText: {
    fontSize: 16,
  },
  selectedDayText: {
    color: 'white',
  },
  eventBubble: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'orange',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventBubbleText: {
    color: 'white',
    fontSize: 12,
  },
});
