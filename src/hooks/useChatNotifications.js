import { useEffect, useMemo, useState } from "react";

import { onChatNotification } from "../services/chatSocket.js";

const getUserId = (user) => user?.id || user?.sub || user?._id || user?.email || "";

const getStorageKey = (user) => `cravzoChatNotifications_${getUserId(user) || "guest"}`;

const readStoredNotifications = (user) => {
  try {
    const stored = JSON.parse(localStorage.getItem(getStorageKey(user)) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};

const writeStoredNotifications = (user, notifications) => {
  if (!getUserId(user)) return;
  localStorage.setItem(getStorageKey(user), JSON.stringify(notifications.slice(0, 30)));
};

const getNotificationTitle = (notification) => {
  if (notification.type === "ORDER_RIDER") {
    const orderSuffix = notification.orderId ? ` #${notification.orderId.slice(-6)}` : "";
    return `Order chat${orderSuffix}`;
  }

  return "Support chat";
};

const getNotificationSubtitle = (notification) => {
  const senderName = notification.sender?.name || "Someone";
  const text = notification.text || "New message";
  return `${senderName}: ${text}`;
};

const getChatPathForUser = (notification, user) => {
  const accountType = String(user?.accountType || user?.role || "customer").toLowerCase();
  const params = new URLSearchParams();

  if (notification.roomId) params.set("roomId", notification.roomId);
  if (notification.type === "ORDER_RIDER") params.set("mode", "order");
  if (notification.orderId) params.set("orderId", notification.orderId);

  const query = params.toString();
  const suffix = query ? `?${query}` : "";

  if (accountType === "rider") return `/rider-chat${suffix}`;
  if (accountType === "vendor") return `/vendor-dashboard/chat${suffix}`;
  if (accountType === "admin") return `/admin${suffix}`;

  return `/account/chat${suffix}`;
};

const useChatNotifications = (user) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!getUserId(user)) {
      setNotifications([]);
      return undefined;
    }

    setNotifications(readStoredNotifications(user));

    const handleStorage = (event) => {
      if (event.key === getStorageKey(user)) {
        setNotifications(readStoredNotifications(user));
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => window.removeEventListener("storage", handleStorage);
  }, [user]);

  useEffect(() => {
    if (!getUserId(user)) return undefined;

    const unsubscribe = onChatNotification((notification) => {
      if (!notification?.roomId || notification.sender?.id === getUserId(user)) return;

      setNotifications((currentNotifications) => {
        const nextNotification = {
          ...notification,
          title: getNotificationTitle(notification),
          subtitle: getNotificationSubtitle(notification),
          receivedAt: new Date().toISOString(),
          read: false,
        };

        const nextNotifications = [
          nextNotification,
          ...currentNotifications.filter((entry) => entry.id !== nextNotification.id),
        ].slice(0, 30);

        writeStoredNotifications(user, nextNotifications);
        return nextNotifications;
      });
    });

    return unsubscribe;
  }, [user]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const markNotificationRead = (notificationId) => {
    setNotifications((currentNotifications) => {
      const nextNotifications = currentNotifications.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification,
      );
      writeStoredNotifications(user, nextNotifications);
      return nextNotifications;
    });
  };

  const markAllRead = () => {
    setNotifications((currentNotifications) => {
      const nextNotifications = currentNotifications.map((notification) => ({ ...notification, read: true }));
      writeStoredNotifications(user, nextNotifications);
      return nextNotifications;
    });
  };

  return {
    notifications,
    unreadCount,
    getChatPath: (notification) => getChatPathForUser(notification, user),
    markAllRead,
    markNotificationRead,
  };
};

export { useChatNotifications };
