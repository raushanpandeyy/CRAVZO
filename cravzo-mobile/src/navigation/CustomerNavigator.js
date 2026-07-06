import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, Search, ReceiptText, User } from "lucide-react-native";

import HomeScreen from "../screens/customer/HomeScreen";
import RestaurantListScreen from "../screens/customer/RestaurantListScreen";
import RestaurantMenuScreen from "../screens/customer/RestaurantMenuScreen";
import CartScreen from "../screens/customer/CartScreen";
import CheckoutScreen from "../screens/customer/CheckoutScreen";
import OrdersScreen from "../screens/customer/OrdersScreen";
import ProfileScreen from "../screens/customer/ProfileScreen";
import AddressesScreen from "../screens/customer/AddressesScreen";
import FavoritesScreen from "../screens/customer/FavoritesScreen";
import ReviewsScreen from "../screens/customer/ReviewsScreen";
import DishesListingScreen from "../screens/customer/DishesListingScreen";
import DishScreen from "../screens/customer/DishScreen";
import CitywiseScreen from "../screens/customer/CitywiseScreen";
import ReferralScreen from "../screens/customer/ReferralScreen";
import PaymentMethodsScreen from "../screens/customer/PaymentMethodsScreen";
import AboutUsScreen from "../screens/customer/AboutUsScreen";
import ContactUsScreen from "../screens/customer/ContactUsScreen";
import PrivacyPolicyScreen from "../screens/customer/PrivacyPolicyScreen";
import AddressFormScreen from "../screens/customer/AddressFormScreen";
import AddressMapPicker from "../components/AddressMapPicker";
import ChatScreen from "../components/ChatScreen";
import OrderTrackingScreen from "../screens/customer/OrderTrackingScreen";
import { colors } from "../constants/colors";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const NAV_ITEMS = [
  { label: "Home", icon: Home, name: "Home" },
  { label: "Search", icon: Search, name: "Search" },
  { label: "Orders", icon: ReceiptText, name: "Orders" },
  { label: "Profile", icon: User, name: "Profile" },
];

function BottomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={{ paddingBottom: 12, backgroundColor: "transparent" }}>
      <View style={{ marginHorizontal: 16 }}>
        <View className="flex-row rounded-3xl border border-indigo-100 bg-white/95 p-1.5 shadow-xl shadow-indigo-900/10">
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const navItem = NAV_ITEMS.find((n) => n.name === route.name);
            const NavIcon = navItem?.icon || Home;
            const onPress = () => {
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
            };
            return (
              <TouchableOpacity key={route.key} onPress={onPress} className="flex-1 items-center gap-0.5 rounded-2xl px-1 py-1.5">
                <View className={`h-8 w-8 items-center justify-center rounded-xl ${isFocused ? "bg-indigo-950 shadow-md shadow-indigo-950/20" : ""}`}>
                  <NavIcon size={16} color={isFocused ? "#fff" : colors.slate[500]} />
                </View>
                <Text className={`text-[10px] font-extrabold ${isFocused ? "text-indigo-950" : "text-slate-500"}`}>
                  {navItem?.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function BottomTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <BottomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={RestaurantListScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function CustomerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={BottomTabs} />
      <Stack.Screen name="RestaurantMenu" component={RestaurantMenuScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="Addresses" component={AddressesScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="Reviews" component={ReviewsScreen} />
      <Stack.Screen name="DishesListing" component={DishesListingScreen} />
      <Stack.Screen name="DishScreen" component={DishScreen} />
      <Stack.Screen name="Citywise" component={CitywiseScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="AboutUs" component={AboutUsScreen} />
      <Stack.Screen name="ContactUs" component={ContactUsScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="AddressForm" component={AddressFormScreen} />
      <Stack.Screen name="AddressMapPicker" component={AddressMapPicker} />
      <Stack.Screen name="CustomerChat" component={ChatScreen} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
      <Stack.Screen name="Referral" component={ReferralScreen} />
    </Stack.Navigator>
  );
}
