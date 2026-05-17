import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getMessaging, onBackgroundMessage } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-sw.js";

const searchParams = new URL(self.location.href).searchParams;
const firebaseConfig = {
  apiKey: searchParams.get("apiKey"),
  authDomain: searchParams.get("authDomain"),
  projectId: searchParams.get("projectId"),
  storageBucket: searchParams.get("storageBucket"),
  messagingSenderId: searchParams.get("messagingSenderId"),
  appId: searchParams.get("appId"),
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);
const firebaseApp = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
const messaging = firebaseApp ? getMessaging(firebaseApp) : null;

if (messaging) {
  onBackgroundMessage(messaging, (payload) => {
    const title = payload.notification?.title || payload.data?.title || "CRAVZO";
    const body = payload.notification?.body || payload.data?.body || "You have a new update.";

    self.registration.showNotification(title, {
      body,
      icon: "/cravzologo.png",
      badge: "/cravzologo.png",
      data: {
        clickUrl: payload.data?.clickUrl || "/",
      },
    });
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const clickUrl = event.notification.data?.clickUrl || "/";
  const targetUrl = new URL(clickUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const focusedClient = clients.find((client) => client.url === targetUrl);
      if (focusedClient) return focusedClient.focus();

      return self.clients.openWindow(targetUrl);
    }),
  );
});
