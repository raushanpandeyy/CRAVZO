import "./global.css";
import React, { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { AuthProvider, useAuth } from "./src/context/AuthContext.js";
import { AlertsProvider, useAlerts } from "./src/context/AlertsContext.js";
import AppNavigator from "./src/navigation/AppNavigator.js";
import {
  setupNotifications,
  addNotificationListener,
  addResponseListener,
} from "./src/services/notificationSetup.js";

// Inner component — needs access to context
function AppContent() {
  const { user } = useAuth();
  const { addAlert } = useAlerts();
  const notifListenerRef   = useRef(null);
  const responseListenerRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    // Setup push notifications after login
    setupNotifications().catch(() => {});

    // Foreground notification → add to alerts feed
    notifListenerRef.current = addNotificationListener((notification) => {
      const data = notification.request.content.data || {};
      addAlert({
        type:     data.type     || "ORDER_STATUS_CHANGED",
        severity: data.severity || "info",
        title:    notification.request.content.title || "Admin Alert",
        message:  notification.request.content.body  || "",
        order:    data.order    || (data.orderId ? { id: data.orderId } : null),
        receivedAt: Date.now(),
      });
    });

    // User taps notification → handled by navigator
    responseListenerRef.current = addResponseListener(() => {});

    return () => {
      notifListenerRef.current?.remove();
      responseListenerRef.current?.remove();
    };
  }, [user, addAlert]);

  return (
    <>
      <StatusBar style="auto" />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AlertsProvider>
            <AppContent />
          </AlertsProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
