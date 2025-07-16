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

    Object.keys(formattedDates).forEach((date) => {
      formattedDates[date] = {
        ...formattedDates[date],
        dotColor: 'orange',
        marked: true
      };
    });

    setMarkedDates(formattedDates);
  };

  useEffect(() => {
    fetchAllDates();
  }, []);

  useEffect(() => {
    getResultFromDate(selected);
  }, [selected]);

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
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#b6c1cd',
          selectedDayBackgroundColor: '#00adf5',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#00adf5',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: '#00adf5',
          selectedDotColor: '#ffffff',
          arrowColor: 'orange',
          monthTextColor: 'blue',
          indicatorColor: 'blue',
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 16
        }}
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
});
