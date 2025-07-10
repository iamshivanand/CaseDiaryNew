import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React, { useContext } from "react";
import { View, Text, ScrollView } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

import { ThemeContext } from "./Providers/ThemeProvider";
import CalendarScreen from "./Screens/Calendar/Calendar";
import Header from "./Screens/CommonComponents/Header";
import HomeScreen from "./Screens/HomeScreen/HomeScreen";
import Profile from "./Screens/ProfileScreen/Profile";
import SearchScreen from "./Screens/SearchScreen/SearchScreen";

interface Props {
  // Add your prop types here
}

const Tab = createBottomTabNavigator();

const Appro: React.FC<Props> = () => {
  const { theme } = useContext(ThemeContext);
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarStyle: {
              paddingBottom: 5,
              height: 50,
              backgroundColor: theme.colors.background,
            },
            tabBarIcon: ({ color, size }) => {
              let iconName = "home";

              // Choose icon based on the route name
              if (route.name === "Home") {
                iconName = "home"; // Material icon name for Home
              } else if (route.name === "Search") {
                iconName = "search"; // Material icon name for Search
              } else if (route.name === "Calendar") {
                iconName = "date-range";
              } else if (route.name === "Profile") {
                iconName = "account-circle"; // Material icon name for Profile
              }

              // You can return any component that you like here!
              return (
                <MaterialIcons name={iconName} size={size} color={color} />
              );
            },
            tabBarActiveTintColor: "#020748", // Customize active tint color
            tabBarInactiveTintColor: "green", // Customize inactive tint color
          })}
        >
          <Tab.Screen
            name="Home"
            options={({ navigation }) => ({
              header: () => (
                <Header onPress={() => navigation.navigate("AnotherScreen")} />
              ),
            })}
            component={HomeScreen}
          />
          <Tab.Screen name="Search" component={SearchScreen} />
          {/* //here we can add the bottom tab bar */}
          <Tab.Screen name="Calendar" component={CalendarScreen} />
          <Tab.Screen name="Profile" component={Profile} />
        </Tab.Navigator>
      </ScrollView>
    </View>
  );
};

export default Appro;
