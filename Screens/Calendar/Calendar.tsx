import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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
        customStyles: {
          container: {
            backgroundColor: "orange",
            borderRadius: 10,
          },
          text: {
            color: "white",
          },
        },
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

  const CustomDayComponent = ({
    date,
    state,
    marking,
  }: {
    date: any;
    state: string;
    marking: any;
  }) => {
    const isSelected = selected === date.dateString;
    return (
      <TouchableOpacity
        onPress={() => {
          setSelected(date.dateString);
          console.log("Selected Date:", date.dateString);
        }}
        style={{
          backgroundColor: isSelected
            ? "blue"
            : marking
              ? marking.customStyles.container.backgroundColor
              : "transparent",
          borderRadius: isSelected
            ? 10
            : marking
              ? marking.customStyles.container.borderRadius
              : 0,
          justifyContent: "center",
          alignItems: "center",
          width: 32,
          height: 32,
        }}
      >
        <Text
          style={{
            color: isSelected
              ? "white"
              : marking
                ? marking.customStyles.text.color
                : state === "disabled"
                  ? "gray"
                  : "black",
          }}
        >
          {date.day}
        </Text>
        {marking && marking.eventsCount > 1 && (
          <Text style={{ color: "#ffffff", fontSize: 10 }}>
            {marking.eventsCount}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View>
        <Calendar
          markingType="custom"
          markedDates={{
            ...markedDates,
            [selected]: {
              selected: true,
              customStyles: {
                container: {
                  backgroundColor: "blue",
                  borderRadius: 10,
                },
                text: {
                  color: "white",
                },
              },
            },
          }}
          dayComponent={({ date, state, marking }) => (
            <CustomDayComponent date={date} state={state} marking={marking} />
          )}
        />
      </View>
      <ScrollView
        style={styles.container}
        scrollEventThrottle={16}
        decelerationRate="fast"
      >
        <View style={styles.CardsContainer}>
          <Text>Selected Date is {selected}</Text>
          {ResultToshow?.map((each, index) => (
            <NewCaseCard key={index} caseDetails={each} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default CalendarScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingBottom: 150,
    marginBottom: 0,
  },
  CardsContainer: {
    alignItems: "center",
  },
});
