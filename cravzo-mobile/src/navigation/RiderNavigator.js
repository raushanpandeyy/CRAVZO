import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Bike, User, IndianRupee, MessageCircle } from "lucide-react-native";

import RiderDashboardScreen from "../screens/rider/RiderDashboardScreen";
import RiderProfileScreen from "../screens/rider/RiderProfileScreen";
import RiderEarningsScreen from "../screens/rider/RiderEarningsScreen";
import RiderAnalyticsScreen from "../screens/rider/RiderAnalyticsScreen";
import RiderReviewScreen from "../screens/rider/RiderReviewScreen";
import RiderMyReviewsScreen from "../screens/rider/RiderMyReviewsScreen";
import RiderEditProfileScreen from "../screens/rider/RiderEditProfileScreen";
import DeliveryHistoryScreen from "../screens/rider/DeliveryHistoryScreen";
import ContactsScreen from "../screens/rider/ContactsScreen";
import ChatScreen from "../components/ChatScreen";
import { colors } from "../constants/colors";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function RiderTabBar({ state, descriptors, navigation }) {
  const icons = { Dashboard: Bike, Earnings: IndianRupee, Chat: MessageCircle, Profile: User };
  return (
    <View style={{ paddingBottom: 16, backgroundColor: "transparent" }}>
      <View style={{ marginHorizontal: 16 }}>
        <View className="flex-row rounded-3xl border border-indigo-100 bg-white/95 p-1.5 shadow-xl shadow-indigo-900/10">
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const Icon = icons[route.name] || Bike;
            const onPress = () => {
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
            };
            return (
              <TouchableOpacity key={route.key} onPress={onPress} className="flex-1 items-center gap-0.5 rounded-2xl px-1 py-1.5">
                <View className={`h-8 w-8 items-center justify-center rounded-xl ${isFocused ? "bg-indigo-950 shadow-md shadow-indigo-950/20" : ""}`}>
                  <Icon size={16} color={isFocused ? "#fff" : colors.slate[500]} />
                </View>
                <Text className={`text-[10px] font-extrabold ${isFocused ? "text-indigo-950" : "text-slate-500"}`}>{route.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function RiderTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <RiderTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={RiderDashboardScreen} />
      <Tab.Screen name="Earnings" component={RiderEarningsScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Profile" component={RiderProfileScreen} />
    </Tab.Navigator>
  );
}

export default function RiderNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RiderTabs" component={RiderTabs} />
      <Stack.Screen name="RiderAnalytics" component={RiderAnalyticsScreen} />
      <Stack.Screen name="RiderReview" component={RiderReviewScreen} />
      <Stack.Screen name="RiderMyReviews" component={RiderMyReviewsScreen} />
      <Stack.Screen name="RiderEditProfile" component={RiderEditProfileScreen} />
      <Stack.Screen name="DeliveryHistory" component={DeliveryHistoryScreen} />
      <Stack.Screen name="Contacts" component={ContactsScreen} />
    </Stack.Navigator>
  );
}
