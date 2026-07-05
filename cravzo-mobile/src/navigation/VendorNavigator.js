import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ImageBackground } from "react-native";
import { BlurView } from "expo-blur";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Store, ClipboardList, ChefHat, MessageCircle, User } from "lucide-react-native";

import VendorDashboardScreen from "../screens/vendor/VendorDashboardScreen";
import VendorMenuScreen from "../screens/vendor/VendorMenuScreen";
import VendorProfileScreen from "../screens/vendor/VendorProfileScreen";
import OrderPanelScreen from "../screens/vendor/OrderPanelScreen";
import SubscriptionScreen from "../screens/vendor/SubscriptionScreen";
import EarningsScreen from "../screens/vendor/EarningsScreen";
import DeliveryAreaScreen from "../screens/vendor/DeliveryAreaScreen";
import ChatScreen from "../components/ChatScreen";
import { getMyRestaurant } from "../services/vendorService";
import { colors } from "../constants/colors";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function VendorTabBar({ state, descriptors, navigation }) {
  const icons = { Dashboard: Store, Orders: ClipboardList, Menu: ChefHat, Chat: MessageCircle, Profile: User };
  return (
    <View style={{ paddingBottom: 16, backgroundColor: "transparent" }}>
      <View style={{ marginHorizontal: 16 }}>
        <View className="flex-row rounded-3xl border border-white/20 bg-white/95 p-1.5 shadow-xl shadow-indigo-900/10">
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
    <Tab.Navigator
      tabBar={(props) => <VendorTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneContainerStyle: { backgroundColor: "transparent" } }}
    >
      <Tab.Screen name="Dashboard" component={VendorDashboardScreen} />
      <Tab.Screen name="Orders" component={OrderPanelScreen} />
      <Tab.Screen name="Menu" component={VendorMenuScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Profile" component={VendorProfileScreen} />
    </Tab.Navigator>
  );
}

export default function VendorNavigator() {
  const [restaurantBg, setRestaurantBg] = useState(null);

  useEffect(() => {
    getMyRestaurant().then((data) => {
      if (data?.imageUrl) setRestaurantBg(data.imageUrl);
    }).catch(() => {});
  }, []);

  return (
    <View className="flex-1">
      <ImageBackground
        source={restaurantBg ? { uri: restaurantBg } : undefined}
        className="absolute inset-0"
        resizeMode="cover"
      >
        <BlurView intensity={60} tint="dark" className="absolute inset-0" />
        <View className="absolute inset-0 bg-indigo-950/40" />
      </ImageBackground>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "transparent" }, cardStyle: { backgroundColor: "transparent" } }}>
        <Stack.Screen name="VendorTabs" component={VendorTabs} />
        <Stack.Screen name="Subscription" component={SubscriptionScreen} />
        <Stack.Screen name="VendorChat" component={ChatScreen} />
        <Stack.Screen name="Earnings" component={EarningsScreen} />
        <Stack.Screen name="DeliveryArea" component={DeliveryAreaScreen} />
      </Stack.Navigator>
    </View>
  );
}
