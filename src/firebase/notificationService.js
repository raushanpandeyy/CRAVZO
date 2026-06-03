import { apiRequest } from "../services/api.js";
import { getFirebaseMessaging, getFirebasePublicConfig, hasFirebaseConfig } from "./firebase.js";

const FCM_TOKEN_STORAGE_KEY = "cravzoFcmToken";
const FCM_PROMPT_STORAGE_KEY = "cravzoFcmPermissionPrompted";
const FCM_DEVICE_STORAGE_KEY = "cravzoFcmDeviceId";

const getOrCreateDeviceId = () => {
  const existingDeviceId = localStorage.getItem(FCM_DEVICE_STORAGE_KEY);
  if (existingDeviceId) return existingDeviceId;

  const deviceId = crypto.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(FCM_DEVICE_STORAGE_KEY, deviceId);
  return deviceId;
};

const getServiceWorkerUrl = () => {
  const config = getFirebasePublicConfig();
  const params = new URLSearchParams();

  // Pass only the Firebase app config — NOT the VAPID key (that's only needed
  // for getToken() in the main thread, not in the service worker itself)
  const { vapidKey: _vapidKey, ...appConfig } = config;
  Object.entries(appConfig).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  return `/firebase-messaging-sw.js?${params.toString()}`;
};

const registerMessagingServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) return null;

  // Do NOT use type: "module" for service workers.
  // Classic SW scripts (importScripts / CDN) work in all browsers.
  // The firebase-messaging-sw.js in public/ uses CDN ESM imports which
  // are supported without setting type:"module" on the registration itself.
  try {
    const existing = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
    if (existing) return existing;
    return navigator.serviceWorker.register(getServiceWorkerUrl());
  } catch (err) {
    console.warn("SW registration failed:", err.message);
    return null;
  }
};

const saveFcmToken = (token) =>
  apiRequest("/api/notifications/fcm-token", {
    method: "POST",
    body: JSON.stringify({
      token,
      deviceId: getOrCreateDeviceId(),
      platform: "WEB",
    }),
  });

const removeFcmToken = (token) =>
  apiRequest("/api/notifications/fcm-token", {
    method: "DELETE",
    body: JSON.stringify({ token }),
  });

const showForegroundNotification = (payload) => {
  if (Notification.permission !== "granted" || !document.hidden) return;

  const title = payload.notification?.title || payload.data?.title || "CRAVZO";
  const body = payload.notification?.body || payload.data?.body || "You have a new update.";
  const clickUrl = payload.data?.clickUrl || "/";

  const notification = new Notification(title, {
    body,
    icon: "/cravzologo.png",
    badge: "/cravzologo.png",
    data: { clickUrl },
  });

  notification.onclick = () => {
    window.focus();
    window.postMessage(
      { type: "CRAVZO_NOTIFICATION_CLICK", clickUrl },
      window.location.origin
    );
    notification.close();
  };
};

const setupForegroundNotifications = async (handler) => {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return () => {};

  const { onMessage } = await import("firebase/messaging");

  // onMessage returns an unsubscribe function
  const unsubscribe = onMessage(messaging, (payload) => {
    showForegroundNotification(payload);
    window.dispatchEvent(new CustomEvent("cravzo:fcm-message", { detail: payload }));
    handler?.(payload);
  });

  // Always return a callable cleanup function
  return typeof unsubscribe === "function" ? unsubscribe : () => {};
};

const ensureFcmToken = async ({ forcePrompt = false } = {}) => {
  if (!hasFirebaseConfig || !("Notification" in window)) {
    return null;
  }

  if (Notification.permission === "default") {
    const alreadyPrompted = localStorage.getItem(FCM_PROMPT_STORAGE_KEY) === "true";
    if (alreadyPrompted && !forcePrompt) return null;

    // Browsers handle the real permission UI; this flag only prevents us from
    // repeatedly opening the same prompt on every login/page load.
    localStorage.setItem(FCM_PROMPT_STORAGE_KEY, "true");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;
  }

  if (Notification.permission !== "granted") return null;

  const messaging = await getFirebaseMessaging();
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!messaging || !vapidKey) return null;

  const serviceWorkerRegistration = await registerMessagingServiceWorker();
  const { getToken } = await import("firebase/messaging");
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration,
  });

  if (!token) return null;

  const previousToken = localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
  if (previousToken !== token) {
    await saveFcmToken(token);
    localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
  }

  return token;
};

const unregisterFcmToken = async () => {
  const messaging = await getFirebaseMessaging();
  const token = localStorage.getItem(FCM_TOKEN_STORAGE_KEY);

  if (token) {
    await removeFcmToken(token).catch(() => {});
  }

  if (messaging) {
    const { deleteToken } = await import("firebase/messaging");
    await deleteToken(messaging).catch(() => {});
  }

  localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
};

export { ensureFcmToken, setupForegroundNotifications, unregisterFcmToken };
