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

// ── Alert-modal visibility gate ─────────────────────────────────
// OrdersScreen sets this to true when an OrderAlertModal is visible.
// The FCM foreground listener checks this flag before playing the
// alert sound so it doesn't fire a duplicate burst when the modal
// is already playing the sound itself.
let _alertModalVisible = false;
export const setAlertModalVisible = (visible) => { _alertModalVisible = visible; };

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

    // Foreground notification listener — play loud alert when a new-order
    // push arrives while the app is open, BUT only if the OrderAlertModal
    // is not already visible (which plays its own sound). Without this guard
    // the sound fires twice: once from the modal and once here.
    if (_foregroundSub) _foregroundSub.remove();
    _foregroundSub = Notifications.addNotificationReceivedListener((notification) => {
      const type = notification?.request?.content?.data?.type;
      if (type === "NEW_ORDER" || type === "VENDOR_NEW_ORDER" || !type) {
        if (!_alertModalVisible) {
          playAlertSound();
        }
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
  _alertModalVisible = false;
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
