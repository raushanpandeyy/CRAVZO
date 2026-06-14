import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Store, ClipboardList, ChefHat, MessageCircle, User } from "lucide-react-native";

import VendorDashboardScreen from "../screens/vendor/VendorDashboardScreen";
import VendorMenuScreen from "../screens/vendor/VendorMenuScreen";
import VendorProfileScreen from "../screens/vendor/VendorProfileScreen";
import ChatScreen from "../components/ChatScreen";
import { colors } from "../constants/colors";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function VendorTabBar({ state, descriptors, navigation }) {
  const icons = { Dashboard: Store, Orders: ClipboardList, Menu: ChefHat, Chat: MessageCircle, Profile: User };
  return (
    <View style={{ paddingBottom: 16, backgroundColor: "transparent" }}>
      <View style={{ marginHorizontal: 16 }}>
        <View className="flex-row rounded-3xl border border-indigo-100 bg-white/95 p-1.5 shadow-xl shadow-indigo-900/10">
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const Icon = icons[route.name] || Store;
            const onPress = () => {
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
            };
            return (
              <TouchableOpacity key={route.key} onPress={onPress} className="flex-1 items-center gap-0.5 rounded-2xl px-1 py-1.5">
                <View className={`h-8 w-8 items-center justify-center rounded-xl ${isFocused ? "bg-indigo-950 shadow-md shadow-indigo-950/20" : ""}`}>
                  <Icon size={16} color={isFocused ? "#fff" : colors.slate[500]} />
                </View>
                <Text className={`text-[10px] font-extrabold ${isFocused ? "text-indigo-950" : "text-slate-500"}`} numberOfLines={1}>
                  {route.name === "Dashboard" ? "Home" : route.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function VendorTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <VendorTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={VendorDashboardScreen} />
      <Tab.Screen name="Orders" component={VendorDashboardScreen} />
      <Tab.Screen name="Menu" component={VendorMenuScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Profile" component={VendorProfileScreen} />
    </Tab.Navigator>
  );
}

export default function VendorNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VendorTabs" component={VendorTabs} />
    </Stack.Navigator>
  );
}
