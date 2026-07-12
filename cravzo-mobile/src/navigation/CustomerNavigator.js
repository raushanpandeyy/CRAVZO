import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import VerifyOtpScreen from "../screens/customer/VerifyOtpScreen";
import { colors } from "../constants/colors";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const NAV_ITEMS = [
  { label: "Home", icon: Home, name: "Home" },
  { label: "Search", icon: Search, name: "Search" },
  { label: "Orders", icon: ReceiptText, name: "Orders" },
  { label: "Profile", icon: User, name: "Profile" },
];

function BottomTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
          const navItem = NAV_ITEMS.find((n) => n.name === route.name) || NAV_ITEMS[0];
          const NavIcon = navItem.icon;
          return {
            headerShown: false,
            tabBarLabel: navItem.label,
            tabBarActiveTintColor: colors.brand.dark,
            tabBarInactiveTintColor: colors.slate[500],
            tabBarStyle: {
              height: Math.max(insets.bottom + 70, 88),
              paddingTop: 8,
              paddingBottom: Math.max(insets.bottom + 12, 28),
              borderTopWidth: 0,
              elevation: 12,
            },
            tabBarLabelStyle: { fontSize: 10, fontWeight: "800" },
            tabBarIcon: ({ color }) => <NavIcon size={20} color={color} />,
          };
        }}      >
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
      <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
    </Stack.Navigator>
  );
}
