import { useCallback, useEffect, useMemo, useState } from "react";

import { onChatNotification } from "../services/chatSocket.js";

const getUserId = (user) => user?.id || user?.sub || user?._id || user?.email || "";

const getStorageKey = (userId) => `dodagoChatNotifications_${userId || "guest"}`;

const readStoredNotifications = (userId) => {
  try {
    const stored = JSON.parse(localStorage.getItem(getStorageKey(userId)) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};

const writeStoredNotifications = (userId, notifications) => {
  if (!userId) return;
  localStorage.setItem(getStorageKey(userId), JSON.stringify(notifications.slice(0, 30)));
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

// Singleton state — multiple hook calls share one socket subscription
let _notifications = [];
let _subscribers = new Set();
let _unsubscribe = null;
let _currentUserId = "";

const notifySubscribers = () => _subscribers.forEach((fn) => fn(_notifications));

const ensureSubscribed = (userId) => {
  if (_unsubscribe && _currentUserId !== userId) {
    _unsubscribe();
    _unsubscribe = null;
    _notifications = [];
  }

  if (_unsubscribe) return;
  _currentUserId = userId;
  _notifications = readStoredNotifications(userId);

  _unsubscribe = onChatNotification((notification) => {
    if (!notification?.roomId || notification.sender?.id === userId) return;

    const nextNotification = {
      ...notification,
      title: getNotificationTitle(notification),
      subtitle: getNotificationSubtitle(notification),
      receivedAt: new Date().toISOString(),
      read: false,
    };

    _notifications = [
      nextNotification,
      ..._notifications.filter((entry) => entry.id !== nextNotification.id),
    ].slice(0, 30);

    writeStoredNotifications(userId, _notifications);
    notifySubscribers();
  });
};

const unsubscribeSingleton = () => {
  if (_unsubscribe) {
    _unsubscribe();
    _unsubscribe = null;
  }
  _currentUserId = "";
  _notifications = [];
};

const useChatNotifications = (user) => {
  const userId = getUserId(user);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!userId) {
      if (_currentUserId) unsubscribeSingleton();
      return;
    }

    ensureSubscribed(userId);

    const subscriber = (next) => {
      _notifications = next;
      setTick((t) => t + 1);
    };
    _subscribers.add(subscriber);

    return () => {
      _subscribers.delete(subscriber);
    };
  }, [userId]);

  const markNotificationRead = useCallback((notificationId) => {
    _notifications = _notifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n,
    );
    writeStoredNotifications(_currentUserId, _notifications);
    notifySubscribers();
  }, []);

  const markAllRead = useCallback(() => {
    _notifications = _notifications.map((n) => ({ ...n, read: true }));
    writeStoredNotifications(_currentUserId, _notifications);
    notifySubscribers();
  }, []);

  const unreadCount = useMemo(
    () => _notifications.filter((n) => !n.read).length,
    // Recalc whenever _notifications changes (triggered by subscriber above)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [_notifications.length, _notifications.filter((n) => !n.read).length],
  );

  return {
    notifications: _notifications,
    unreadCount,
    getChatPath: (notification) => getChatPathForUser(notification, user),
    markAllRead,
    markNotificationRead,
  };
};

export { useChatNotifications };
