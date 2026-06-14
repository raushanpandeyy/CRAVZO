import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { LayoutDashboard, ShoppingBag, Users, Store, Star, ChevronRight } from "lucide-react-native";

import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import AdminOrdersScreen from "../screens/admin/AdminOrdersScreen";
import AdminUsersScreen from "../screens/admin/AdminUsersScreen";
import AdminRestaurantsScreen from "../screens/admin/AdminRestaurantsScreen";
import { colors } from "../constants/colors";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AdminTabBar({ state, descriptors, navigation }) {
  const icons = { Dashboard: LayoutDashboard, Orders: ShoppingBag, Users, Restaurants: Store };
  return (
    <View style={{ paddingBottom: 12, backgroundColor: "transparent" }}>
      <View style={{ marginHorizontal: 16 }}>
        <View className="flex-row rounded-3xl border border-indigo-100 bg-white/95 p-1.5 shadow-xl shadow-indigo-900/10">
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const Icon = icons[route.name] || LayoutDashboard;
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

function AdminTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <AdminTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Orders" component={AdminOrdersScreen} />
      <Tab.Screen name="Users" component={AdminUsersScreen} />
      <Tab.Screen name="Restaurants" component={AdminRestaurantsScreen} />
    </Tab.Navigator>
  );
}

export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
    </Stack.Navigator>
  );
}
