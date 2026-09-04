/**
 * Push Notification Service (rider app)
 *
 * Registers FCM token with backend so rider receives
 * push notifications for new order requests even when app is in background.
 */
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { apiRequest } from "./api";
import { playAlertSound, stopAlertSound } from "../utils/alertSound";

const BASE = "/api/v1";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

let _foregroundSub   = null;
let _responseSub     = null;
let _registeredToken = null;

export const registerForPushNotifications = async (navigationRef) => {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("orders", {
        name:             "New Orders",
        importance:       Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 350, 120, 350],
        lightColor:       "#059669",
        sound:            "alert",   // matches alert.wav in app.json sounds array
        enableVibrate:    true,
        showBadge:        true,
      });
    }

    const tokenData = await Notifications.getDevicePushTokenAsync();
    const token     = tokenData?.data;
    if (!token) return;

    _registeredToken = token;

    await apiRequest(`${BASE}/notifications/fcm-token`, {
      method: "POST",
      body: JSON.stringify({
        token,
        platform: Platform.OS === "ios" ? "IOS" : "ANDROID",
      }),
    });

    if (_foregroundSub) _foregroundSub.remove();
    _foregroundSub = Notifications.addNotificationReceivedListener((notification) => {
      const type = notification?.request?.content?.data?.type;
      // Play loud alert when a new order notification arrives while app is open.
      // DashboardScreen's orderRequest useEffect will call stopAlertSound()
      // once the rider accepts / rejects / the countdown expires.
      if (type === "RIDER_NEW_ORDER" || !type) {
        playAlertSound();
      }
    });

    if (_responseSub) _responseSub.remove();
    _responseSub = Notifications.addNotificationResponseReceivedListener(() => {
      // Rider tapped the notification banner — stop alert and open dashboard
      stopAlertSound();
      try {
        navigationRef?.current?.navigate("Dashboard");
      } catch {}
    });

    console.log("[Notifications] Rider token registered");
  } catch (err) {
    console.warn("[Notifications] Registration failed:", err.message);
  }
};

export const deregisterPushNotifications = async () => {
  stopAlertSound();
  try {
    if (_registeredToken) {
      await apiRequest(`${BASE}/notifications/fcm-token`, {
        method: "DELETE",
        body: JSON.stringify({ token: _registeredToken }),
      });
      _registeredToken = null;
    }
  } catch {}
  finally {
    _foregroundSub?.remove();
    _responseSub?.remove();
    _foregroundSub = null;
    _responseSub   = null;
  }
};
