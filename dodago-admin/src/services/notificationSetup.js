import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { registerFcmToken } from "./api.js";

// How to display notifications when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const type = notification.request.content.data?.type;
    const isDanger = notification.request.content.data?.severity === "danger";
    return {
      shouldShowAlert: true,
      shouldPlaySound: isDanger,
      shouldSetBadge:  true,
    };
  },
});

export const setupNotifications = async () => {
  if (!Device.isDevice) {
    console.warn("Push notifications require a physical device");
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Push notification permission denied");
    return null;
  }

  // Android notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("orders", {
      name: "Order Alerts",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#4f46e5",
      sound: "alert",
    });
    await Notifications.setNotificationChannelAsync("default", {
      name: "General",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  // Get push token
  try {
    // projectId must be a real EAS UUID — skip gracefully if not configured
    const projectId =
      require("expo-constants").default?.expoConfig?.extra?.eas?.projectId;

    if (!projectId || projectId === "dodago-admin" || projectId.length < 10) {
      console.warn("Push tokens skipped: real EAS projectId not configured");
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;
    await registerFcmToken(token, Platform.OS === "ios" ? "IOS" : "ANDROID");
    return token;
  } catch (err) {
    console.warn("Failed to register FCM token:", err.message);
    return null;
  }
};

// Listen for incoming notifications while app is open
export const addNotificationListener = (onNotification) =>
  Notifications.addNotificationReceivedListener(onNotification);

// Listen for user tapping a notification
export const addResponseListener = (onResponse) =>
  Notifications.addNotificationResponseReceivedListener(onResponse);
