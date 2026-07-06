import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { apiRequest } from "./api";
import { storage } from "./storage";

const IS_WEB = Platform.OS === "web";

const noop = () => {};
const noopAsync = async () => {};
const noopRemove = { remove: noop };

const FCM_TOKEN_KEY = "dodagoFcmToken";
const NOTIF_GRANTED_KEY = "dodagoNotifGranted";

if (!IS_WEB) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export const setupNotificationChannel = IS_WEB
  ? noop
  : () => {
      if (Platform.OS === "android") {
        Notifications.setNotificationChannelAsync("default", {
          name: "DODAGO",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#4f46e5",
        });
      }
    };

export const registerForPushNotifications = IS_WEB
  ? noopAsync
  : async () => {
      if (!Device.isDevice) {
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        storage.set(NOTIF_GRANTED_KEY, "false");
        return null;
      }

      storage.set(NOTIF_GRANTED_KEY, "true");

      const tokenData = await Notifications.getDevicePushTokenAsync();
      const pushToken = tokenData.data;
      const platform = Platform.OS === "android" ? "ANDROID" : "IOS";

      const previousToken = storage.getString(FCM_TOKEN_KEY);
      if (previousToken === pushToken) {
        return pushToken;
      }

      await apiRequest("/api/notifications/fcm-token", {
        method: "POST",
        data: {
          token: pushToken,
          platform,
          deviceId: pushToken.substring(0, 20),
        },
      });
      storage.set(FCM_TOKEN_KEY, pushToken);
      return pushToken;
    };

export const unregisterPushNotifications = IS_WEB
  ? noopAsync
  : async () => {
      const token = storage.getString(FCM_TOKEN_KEY);
      if (token) {
        try {
          await apiRequest("/api/notifications/fcm-token", {
            method: "DELETE",
            data: { token },
          });
        } catch (error) {
          console.warn("Could not unregister push token:", error.message);
        }
        storage.delete(FCM_TOKEN_KEY);
      }
      storage.delete(NOTIF_GRANTED_KEY);
    };

let _notificationResponseListener = null;
let _notificationListener = null;

export const addNotificationResponseListener = IS_WEB
  ? () => noopRemove
  : (handler) => {
      _notificationResponseListener = Notifications.addNotificationResponseReceivedListener(handler);
      return _notificationResponseListener;
    };

export const addNotificationListener = IS_WEB
  ? () => noopRemove
  : (handler) => {
      _notificationListener = Notifications.addNotificationReceivedListener(handler);
      return _notificationListener;
    };

export const removeNotificationListeners = IS_WEB
  ? noop
  : () => {
      if (_notificationResponseListener) {
        _notificationResponseListener.remove();
        _notificationResponseListener = null;
      }
      if (_notificationListener) {
        _notificationListener.remove();
        _notificationListener = null;
      }
    };

export const getLastNotificationResponse = IS_WEB
  ? noopAsync
  : async () => {
      return Notifications.getLastNotificationResponseAsync();
    };

