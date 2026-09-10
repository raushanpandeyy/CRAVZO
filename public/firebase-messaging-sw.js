// Service Workers do NOT support ES module `import` syntax unless registered
// with `type: "module"`. Firebase must be loaded via importScripts() instead.
importScripts("https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js");

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

if (hasFirebaseConfig) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || payload.data?.title || "DODAGO";
    const body = payload.notification?.body || payload.data?.body || "You have a new update.";

    self.registration.showNotification(title, {
      body,
      icon: "/dodagologo.png",
      badge: "/dodagologo.png",
      data: {
        clickUrl: payload.data?.clickUrl || "/",
      },
    });
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const clickUrl = event.notification.data?.clickUrl || "/vendor-dashboard";
  const orderId  = event.notification.data?.orderId  || null;

  // Build final URL — always land on vendor dashboard with orderId param
  // so VendorOrderAlertHost can immediately show the order popup.
  const baseUrl = self.location.origin;
  const landingPath = orderId
    ? `/vendor-dashboard?orderId=${encodeURIComponent(orderId)}`
    : clickUrl;
  const targetUrl = baseUrl + landingPath;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // If the vendor dashboard is already open, navigate that tab
      const vendorClient = clients.find((c) => c.url.includes("/vendor-dashboard"));
      if (vendorClient) {
        return vendorClient.navigate(targetUrl).then((navigatedClient) => {
          if (navigatedClient) navigatedClient.focus();
        }).catch(() => self.clients.openWindow(targetUrl));
      }
      // Otherwise open a new window
      return self.clients.openWindow(targetUrl);
    }),
  );
});
