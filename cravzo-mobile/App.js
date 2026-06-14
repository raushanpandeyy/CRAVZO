import "react-native-gesture-handler";

import "./src/styles/global.css";

import React, { useRef, useEffect } from "react";
import { StatusBar } from "expo-status-bar";

import * as SplashScreen from "expo-splash-screen";

import { Provider, useSelector } from "react-redux";

import { PersistGate } from "redux-persist/integration/react";

import { store, persistor } from "./src/store";

import { GestureHandlerRootView } from "react-native-gesture-handler";

import AppNavigator, { navigateFromNotification } from "./src/navigation/AppNavigator";

import ErrorBoundary from "./src/components/ErrorBoundary";

import {
  setupNotificationChannel,
  registerForPushNotifications,
  addNotificationResponseListener,
  addNotificationListener,
  getLastNotificationResponse,
} from "./src/services/notificationService";

SplashScreen.preventAutoHideAsync();

function hideSplash() {
  SplashScreen.hideAsync();
}

function NotificationInit() {
  const { isLoggedIn } = useSelector((state) => state.user);
  const channelCreated = useRef(false);

  useEffect(() => {
    if (!channelCreated.current) {
      setupNotificationChannel();
      channelCreated.current = true;
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      registerForPushNotifications();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const responseSub = addNotificationResponseListener((response) => {
      const data = response.notification?.request?.content?.data || {};
      if (data.clickUrl) {
        navigateFromNotification(data.clickUrl, data.orderId);
      }
    });

    const notifSub = addNotificationListener((notification) => {});

    return () => {
      responseSub?.remove();
      notifSub?.remove();
    };
  }, []);

  useEffect(() => {
    getLastNotificationResponse().then((response) => {
      if (response) {
        const data = response.notification?.request?.content?.data || {};
        if (data.clickUrl) {
          setTimeout(() => {
            navigateFromNotification(data.clickUrl, data.orderId);
          }, 500);
        }
      }
    });
  }, []);

  return null;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate onAfterLift={hideSplash} loading={null} persistor={persistor}>
          <ErrorBoundary>
            <StatusBar style="dark" />
            <NotificationInit />
            <AppNavigator />
          </ErrorBoundary>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}