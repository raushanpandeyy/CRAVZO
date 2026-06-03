import { useEffect } from "react";

import { ensureFcmToken, setupForegroundNotifications } from "../firebase/notificationService.js";

const useNotifications = (user) => {
  useEffect(() => {
    if (!user?.isLoggedIn) return undefined;
    // Admin uses socket-based alerts, not FCM
    if (user.accountType === "admin") return undefined;

    let unsubscribeFn = () => {};
    let cancelled = false;

    const setupNotifications = async () => {
      try {
        // Bug fix: always call ensureFcmToken regardless of current permission.
        // If permission is "default", ensureFcmToken will request it (once).
        // If permission is "granted", it just refreshes/registers the token.
        // If permission is "denied", it returns null silently.
        if (!cancelled) {
          await ensureFcmToken();
        }

        // Set up foreground message handler (shows notification when app is open)
        if (!cancelled) {
          unsubscribeFn = await setupForegroundNotifications();
        }
      } catch (error) {
        console.warn("FCM setup failed", error);
      }
    };

    setupNotifications();

    return () => {
      cancelled = true;
      unsubscribeFn?.();
    };
  }, [user?.isLoggedIn, user?.accountType]);
  // Depend on stable primitives, not the whole user object,
  // so this doesn't re-run on every unrelated user update
};

export { useNotifications };
