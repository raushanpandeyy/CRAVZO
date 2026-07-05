import React, { createRef, useEffect } from "react";
import { View, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import { setShowAuthModal } from "../store/slices/userSlice";
import { Monitor } from "lucide-react-native";

import CustomerNavigator from "./CustomerNavigator";
import RiderNavigator from "./RiderNavigator";
import VendorNavigator from "./VendorNavigator";
import PhoneSignupModal from "../components/PhoneSignupModal";

import { colors } from "../constants/colors";

export const navigationRef = createRef();

const NOTIFICATION_ROUTES = {
  "/account/orders": { screen: "MainTabs", params: { screen: "Orders" } },
  "/vendor-dashboard/orders": { screen: "VendorTabs", params: { screen: "Orders" } },
  "/vendor-dashboard": { screen: "VendorTabs", params: { screen: "Dashboard" } },
  "/rider-dashboard": { screen: "RiderTabs", params: { screen: "Dashboard" } },
};

export const navigateFromNotification = (clickUrl, orderId) => {
  const rootNav = navigationRef.current;
  if (!rootNav) return;

  const entry = Object.entries(NOTIFICATION_ROUTES).find(([prefix]) =>
    clickUrl?.startsWith(prefix)
  );

  if (entry) {
    const route = entry[1];
    rootNav.navigate(route.screen, route.params);
  }
};

function AdminBlockedScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-[#F4F7FB] px-6">
      <View className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-lg shadow-indigo-900/10">
        <View className="mx-auto mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
          <Monitor size={32} color={colors.brand.primary} />
        </View>
        <Text className="text-center text-xl font-black text-slate-900">Desktop Only</Text>
        <Text className="mt-2 text-center text-sm leading-6 text-slate-500">
          The admin panel is optimised for larger screens. Please open it on a desktop or laptop.
        </Text>
      </View>
    </View>
  );
}

export default function AppNavigator() {
  const { data: user, isLoggedIn, showAuthModal } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!isLoggedIn) {
      dispatch(setShowAuthModal(true));
    }
  }, [isLoggedIn, dispatch]);

  const getNavigator = () => {
    const accountType = user?.accountType || "customer";
    switch (accountType) {
      case "rider":
        return <RiderNavigator />;
      case "vendor":
        return <VendorNavigator />;
      case "admin":
        return <AdminBlockedScreen />;
      default:
        return <CustomerNavigator />;
    }
  };

  return (
    <NavigationContainer ref={navigationRef}>
      {getNavigator()}
      <PhoneSignupModal
        visible={showAuthModal && !isLoggedIn}
        onClose={() => dispatch(setShowAuthModal(false))}
      />
    </NavigationContainer>
  );
}
