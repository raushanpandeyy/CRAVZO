import { selectUserState, selectCurrentUser, selectIsLoggedIn } from "../store/selectors";
import React, { createRef, useEffect } from "react";
import { View } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { setPendingNavigationRoute } from "../store/slices/userSlice";

import AuthModalHost from "../components/AuthModalHost";
import CustomerNavigator from "./CustomerNavigator";

export const navigationRef = createRef();

const TAB_ROUTES = new Set(["Home", "Search", "Orders", "Profile"]);

const navigateCustomerRoute = (nav, route, params) => {
  if (!nav || !route) return;
  if (TAB_ROUTES.has(route)) {
    nav.navigate("MainTabs", { screen: route, params });
    return;
  }
  nav.navigate(route, params);
};

export const navigateFromNotification = (clickUrl, providedOrderId) => {
  const rootNav = navigationRef.current;
  if (!rootNav || !clickUrl) return;

  const queryOrderId = clickUrl.match(/[?&]orderId=([^&]+)/)?.[1];
  const orderId = providedOrderId || (queryOrderId ? decodeURIComponent(queryOrderId) : null);

  if (clickUrl.startsWith("/account/orders")) {
    if (orderId) {
      navigateCustomerRoute(rootNav, "OrderTracking", { orderId });
    } else {
      navigateCustomerRoute(rootNav, "Orders");
    }
  }
};

export default function AppNavigator() {
  const { isLoggedIn, pendingNavigationRoute } = useSelector(selectUserState);
  const dispatch = useDispatch();

  useEffect(() => {
    if (isLoggedIn && pendingNavigationRoute && navigationRef.current) {
      navigateCustomerRoute(navigationRef.current, pendingNavigationRoute);
      dispatch(setPendingNavigationRoute(null));
    }
  }, [isLoggedIn, pendingNavigationRoute, dispatch]);

  return (
    <View style={{ flex: 1 }}>
      <CustomerNavigator />
      <AuthModalHost />
    </View>
  );
}
