import React, { useState } from "react";
import { Text, View } from "react-native";
import { Calendar } from "react-native-calendars";

import CaseCard from "../CommonComponents/CaseCard";

interface Props {
  // Add your prop types here
}

const CalendarScreen: React.FC<Props> = () => {
  const currentDate = new Date();
  console.log("hello current Date", currentDate);
  const [selected, setSelected] = useState(
    currentDate.toISOString().slice(0, 10)
  );
  console.log("selected Date", selected);
  return (
    <View style={{ flex: 1 }}>
      <View>
        <Calendar
          // Mark specific dates with custom styles
          markedDates={{
            "2024-04-27": { marked: true, dotColor: "red" },
            "2024-04-28": { marked: true, dotColor: "green" },
            [selected]: {
              selected: true,
              disableTouchEvent: true,
              dotColor: "orange",
            },
          }}
          // Handle date selection event
          onDayPress={(day) => {
            setSelected(day.dateString);
          }}
        />
      </View>
      <View>
        {/* <CaseCard /> */}
        <Text>HEllo we will show the Card</Text>
        <Text>Selected Date is {selected}</Text>
      </View>
    </View>
  );
};

export default CalendarScreen;
