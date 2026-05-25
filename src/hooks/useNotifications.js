import { useEffect } from "react";

import { ensureFcmToken, setupForegroundNotifications } from "../firebase/notificationService.js";

const useNotifications = (user) => {
  useEffect(() => {
    if (!user?.isLoggedIn) return undefined;
    if (user.accountType === "admin") return undefined;

    let unsubscribe = () => {};
    let cancelled = false;

    const setupNotifications = async () => {
      try {
        unsubscribe = await setupForegroundNotifications();
        if (!cancelled && Notification.permission === "granted") {
          await ensureFcmToken();
        }
      } catch (error) {
        console.warn("FCM setup failed", error);
      }
    };

    setupNotifications();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [user]);
};

export { useNotifications };
