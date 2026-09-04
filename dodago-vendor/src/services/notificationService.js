/**
 * Push Notification Service (vendor app)
 *
 * Registers FCM/APNs token with the backend so vendor receives
 * push notifications for new orders even when app is in background.
 *
 * Backend endpoints:
 *   POST   /api/v1/notifications/fcm-token  { token, platform }
 *   DELETE /api/v1/notifications/fcm-token  { token }
 */
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { apiRequest } from "./api";
import { playAlertSound, stopAlertSound } from "../utils/alertSound";

const BASE = "/api/v1";

// Show banner + play sound while app is in foreground
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

// ── Register ────────────────────────────────────────────────────
export const registerForPushNotifications = async (navigationRef) => {
  try {
    // Request permission
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.warn("[Notifications] Permission not granted");
      return;
    }

    // Android notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("orders", {
        name:             "New Orders",
        importance:       Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 350, 120, 350],
        lightColor:       "#4f46e5",
        sound:            "alert",   // matches alert.wav in app.json sounds array
        enableVibrate:    true,
        showBadge:        true,
      });
    }

    // Get FCM/APNs push token
    const tokenData = await Notifications.getDevicePushTokenAsync();
    const token     = tokenData?.data;
    if (!token) return;

    _registeredToken = token;

    // Save to backend
    await apiRequest(`${BASE}/notifications/fcm-token`, {
      method: "POST",
      body: JSON.stringify({
        token,
        platform: Platform.OS === "ios" ? "IOS" : "ANDROID",
      }),
    });

    // Foreground notification listener — play loud alert when notification
    // arrives while the vendor app is open (e.g. new order comes in)
    if (_foregroundSub) _foregroundSub.remove();
    _foregroundSub = Notifications.addNotificationReceivedListener((notification) => {
      const type = notification?.request?.content?.data?.type;
      // Play alert for new order notifications; the OrderAlertModal will call
      // stopAlertSound() once the vendor accepts / rejects / dismisses
      if (type === "NEW_ORDER" || type === "VENDOR_NEW_ORDER" || !type) {
        playAlertSound();
      }
    });

    // Notification tap → navigate to Orders; also stop any playing alert
    if (_responseSub) _responseSub.remove();
    _responseSub = Notifications.addNotificationResponseReceivedListener(() => {
      stopAlertSound();
      try {
        navigationRef?.current?.navigate("Tabs", { screen: "Orders" });
      } catch {
        // navigation not ready — ignore
      }
    });

  } catch (err) {
    console.warn("[Notifications] Registration failed:", err.message);
  }
};

// ── Deregister on logout ────────────────────────────────────────
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
  } catch {
    // ignore
  } finally {
    _foregroundSub?.remove();
    _responseSub?.remove();
    _foregroundSub = null;
    _responseSub   = null;
  }
};
