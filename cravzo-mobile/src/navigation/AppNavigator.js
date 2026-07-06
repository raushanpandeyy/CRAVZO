import React, { createRef, useEffect, useRef } from "react";
import { View, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import { Monitor } from "lucide-react-native";
import { setShowAuthModal, setPendingNavigationRoute } from "../store/slices/userSlice";

import CustomerNavigator from "./CustomerNavigator";
import RiderNavigator from "./RiderNavigator";
import VendorNavigator from "./VendorNavigator";
import PhoneSignupModal from "../components/PhoneSignupModal";

import { colors } from "../constants/colors";

export const navigationRef = createRef();



export const navigateFromNotification = (clickUrl, providedOrderId) => {
  const rootNav = navigationRef.current;
  if (!rootNav || !clickUrl) return;

  const queryOrderId = clickUrl.match(/[?&]orderId=([^&]+)/)?.[1];
  const orderId = providedOrderId || (queryOrderId ? decodeURIComponent(queryOrderId) : null);

  if (clickUrl.startsWith("/account/orders")) {
    rootNav.navigate(orderId ? "OrderTracking" : "MainTabs", orderId
      ? { orderId }
      : { screen: "Orders" });
    return;
  }
  if (clickUrl.startsWith("/vendor-dashboard/orders")) {
    rootNav.navigate("VendorTabs", { screen: "Orders" });
    return;
  }
  if (clickUrl.startsWith("/vendor-dashboard")) {
    rootNav.navigate("VendorTabs", { screen: "Dashboard" });
    return;
  }
  if (clickUrl.startsWith("/rider-dashboard")) {
    rootNav.navigate(orderId ? "ActiveDelivery" : "RiderTabs", orderId
      ? { orderId }
      : { screen: "Dashboard" });
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
  const { data: user, isLoggedIn, showAuthModal, pendingNavigationRoute } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const lastRole = useRef(user?.accountType || "customer");

  useEffect(() => {
    if (isLoggedIn && pendingNavigationRoute && navigationRef.current) {
      navigationRef.current.navigate(pendingNavigationRoute);
      dispatch(setPendingNavigationRoute(null));
    }
  }, [isLoggedIn, pendingNavigationRoute, dispatch]);

  lastRole.current = user?.accountType || lastRole.current;
  const accountType = isLoggedIn ? user?.accountType : lastRole.current;

  const Navigator = accountType === "rider" ? RiderNavigator
    : accountType === "vendor" ? VendorNavigator
    : accountType === "admin" ? AdminBlockedScreen
    : CustomerNavigator;

  return (
    <NavigationContainer ref={navigationRef}>
      <Navigator />
      <PhoneSignupModal
        visible={showAuthModal && !isLoggedIn}
        onClose={() => {
          dispatch(setPendingNavigationRoute(null));
          dispatch(setShowAuthModal(false));
        }}
      />
    </NavigationContainer>
  );
}


