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
  const targetOrigin = self.location.origin;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const client = clients.find((c) => c.url.startsWith(targetOrigin));
      if (client) {
        return client.navigate(targetOrigin + clickUrl).then((navigatedClient) => {
          if (navigatedClient) navigatedClient.focus();
        }).catch(() => {
          return self.clients.openWindow(targetOrigin + clickUrl);
        });
      }
      return self.clients.openWindow(targetOrigin + clickUrl);
    }),
  );
});
