import React, { createRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useSelector } from "react-redux";

import AuthNavigator from "./AuthNavigator";
import CustomerNavigator from "./CustomerNavigator";
import RiderNavigator from "./RiderNavigator";
import VendorNavigator from "./VendorNavigator";
import AdminNavigator from "./AdminNavigator";

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

export default function AppNavigator() {
  const { data: user, isHydrating, isLoggedIn } = useSelector((state) => state.user);

  if (isHydrating) return null;

  const getNavigator = () => {
    if (!isLoggedIn) return <AuthNavigator />;
    const accountType = user?.accountType || "customer";
    switch (accountType) {
      case "rider":
        return <RiderNavigator />;
      case "vendor":
        return <VendorNavigator />;
      case "admin":
        return <AdminNavigator />;
      default:
        return <CustomerNavigator />;
    }
  };

  return (
    <NavigationContainer ref={navigationRef}>
      {getNavigator()}
    </NavigationContainer>
  );
}
