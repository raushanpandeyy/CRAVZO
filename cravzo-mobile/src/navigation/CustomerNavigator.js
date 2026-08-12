import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, Search, ReceiptText, User } from "lucide-react-native";

import HomeScreen from "../screens/customer/HomeScreen";
import RestaurantListScreen from "../screens/customer/RestaurantListScreen";
import OrdersScreen from "../screens/customer/OrdersScreen";
import ProfileScreen from "../screens/customer/ProfileScreen";
import { colors } from "../constants/colors";
import { MIN_DEVICE_NAV_GAP } from "../constants/layout";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const NAV_ITEMS = [
  { label: "Home", icon: Home, name: "Home" },
  { label: "Search", icon: Search, name: "Search" },
  { label: "Orders", icon: ReceiptText, name: "Orders" },
  { label: "Profile", icon: User, name: "Profile" },
];

const lazyScreens = {
  RestaurantMenu: () => require("../screens/customer/RestaurantMenuScreen").default,
  Cart: () => require("../screens/customer/CartScreen").default,
  Checkout: () => require("../screens/customer/CheckoutScreen").default,
  Addresses: () => require("../screens/customer/AddressesScreen").default,
  Favorites: () => require("../screens/customer/FavoritesScreen").default,
  Reviews: () => require("../screens/customer/ReviewsScreen").default,
  DishesListing: () => require("../screens/customer/DishesListingScreen").default,
  DishScreen: () => require("../screens/customer/DishScreen").default,
  Citywise: () => require("../screens/customer/CitywiseScreen").default,
  PaymentMethods: () => require("../screens/customer/PaymentMethodsScreen").default,
  AboutUs: () => require("../screens/customer/AboutUsScreen").default,
  ContactUs: () => require("../screens/customer/ContactUsScreen").default,
  PrivacyPolicy: () => require("../screens/customer/PrivacyPolicyScreen").default,
  AddressForm: () => require("../screens/customer/AddressFormScreen").default,
  AddressMapPicker: () => require("../components/AddressMapPicker").default,
  CustomerChat: () => require("../components/ChatScreen").default,
  OrderTracking: () => require("../screens/customer/OrderTrackingScreen").default,
  Referral: () => require("../screens/customer/ReferralScreen").default,
  VerifyOtp: () => require("../screens/customer/VerifyOtpScreen").default,
};

function BottomTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const navItem = NAV_ITEMS.find((n) => n.name === route.name) || NAV_ITEMS[0];
        const NavIcon = navItem.icon;
        return {
          headerShown: false,
          lazy: true,
          freezeOnBlur: true,
          tabBarLabel: navItem.label,
          tabBarActiveTintColor: colors.brand.dark,
          tabBarInactiveTintColor: colors.slate[500],
          tabBarStyle: {
            height: Math.max(insets.bottom + MIN_DEVICE_NAV_GAP + 72, 104),
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom + MIN_DEVICE_NAV_GAP, 36),
            borderTopWidth: 0,
            elevation: 12,
          },
          tabBarLabelStyle: { fontSize: 10, fontWeight: "800" },
          tabBarIcon: ({ color }) => <NavIcon size={20} color={color} />,
        };
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={RestaurantListScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function CustomerNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        freezeOnBlur: true,
      }}
    >
      <Stack.Screen name="MainTabs" component={BottomTabs} />
      {Object.entries(lazyScreens).map(([name, getComponent]) => (
        <Stack.Screen key={name} name={name} getComponent={getComponent} />
      ))}
    </Stack.Navigator>
  );
}