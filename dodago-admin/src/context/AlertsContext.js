import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { onSocketEvent } from "../services/socketService.js";
import { Storage, ALERTS_KEY } from "../services/storage.js";

const MAX_STORED_ALERTS = 100;

const AlertsContext = createContext(null);

export function AlertsProvider({ children }) {
  const [alerts,     setAlerts]     = useState(() => Storage.get(ALERTS_KEY) || []);
  const [liveOrders, setLiveOrders] = useState({});  // orderId → order object
  const [unreadCount, setUnreadCount] = useState(0);
  const persistTimer = useRef(null);

  // Persist alerts to MMKV (debounced)
  const persistAlerts = useCallback((updated) => {
    clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      Storage.set(ALERTS_KEY, updated.slice(0, MAX_STORED_ALERTS));
    }, 500);
  }, []);

  const addAlert = useCallback((alert) => {
    const stamped = { ...alert, receivedAt: Date.now(), read: false };
    setAlerts((prev) => {
      const next = [stamped, ...prev].slice(0, MAX_STORED_ALERTS);
      persistAlerts(next);
      return next;
    });
    setUnreadCount((c) => c + 1);

    // Keep live order map updated
    if (alert.order) {
      setLiveOrders((prev) => ({
        ...prev,
        [alert.order.id]: { ...(prev[alert.order.id] || {}), ...alert.order },
      }));
    }
  }, [persistAlerts]);

  const markAllRead = useCallback(() => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    setUnreadCount(0);
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
    setUnreadCount(0);
    Storage.delete(ALERTS_KEY);
  }, []);

  // Update rider location in live order
  const updateRiderLocation = useCallback((data) => {
    if (!data?.orderId) return;
    setLiveOrders((prev) => ({
      ...prev,
      [data.orderId]: {
        ...(prev[data.orderId] || {}),
        riderLocation: {
          latitude:  data.latitude,
          longitude: data.longitude,
          heading:   data.heading,
          speed:     data.speed,
          updatedAt: data.updatedAt,
        },
      },
    }));
  }, []);

  // Subscribe to socket events
  useEffect(() => {
    const unsub1 = onSocketEvent("admin:order-alert",   addAlert);
    const unsub2 = onSocketEvent("order:rider-location", updateRiderLocation);
    return () => { unsub1(); unsub2(); };
  }, [addAlert, updateRiderLocation]);

  return (
    <AlertsContext.Provider value={{
      alerts, liveOrders, unreadCount,
      addAlert, markAllRead, clearAlerts, updateRiderLocation,
    }}>
      {children}
    </AlertsContext.Provider>
  );
}

export const useAlerts = () => useContext(AlertsContext);
