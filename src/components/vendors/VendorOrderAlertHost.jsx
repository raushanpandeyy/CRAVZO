import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";

import { getVendorOrders, updateOrderStatus } from "../../services/orderService.js";
import { onNewOrder, onOrderStatusUpdate } from "../../services/chatSocket.js";
import { unlockAlertSound } from "../../utils/alertSound.js";

const OrderRequestPopup = lazy(() => import("../OrderRequestPopup.jsx"));
const ORDER_ALERT_POLL_MS = 5000;

const getLatestPendingOrder = (orders, orderId = null) => {
  const pendingOrders = (orders || []).filter((order) => order.status === "PENDING");
  if (orderId) {
    return pendingOrders.find((order) => order.id === orderId) || pendingOrders[0] || null;
  }
  return pendingOrders[0] || null;
};

const VendorOrderAlertHost = () => {
  const [orderRequest, setOrderRequest] = useState(null);
  const [showRequest, setShowRequest] = useState(false);
  const shownOrderIdsRef = useRef(new Set());

  useEffect(() => {
    const unlock = () => {
      unlockAlertSound();
    };

    window.addEventListener("pointerdown", unlock, { once: true, passive: true });
    window.addEventListener("keydown", unlock, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const showOrderPopup = useCallback(async (orderId = null) => {
    try {
      const data = await getVendorOrders({ skipCache: true });
      const order = getLatestPendingOrder(data.orders, orderId);
      if (!order || shownOrderIdsRef.current.has(order.id)) return;

      shownOrderIdsRef.current.add(order.id);
      setOrderRequest(order);
      setShowRequest(true);

      if (navigator.vibrate) {
        navigator.vibrate([300, 120, 300, 120, 500]);
      }

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Dodago - New Order!", {
          body: `Order from ${order.customer?.name || "Customer"} - Rs ${Math.floor(order.totalAmount || 0)}`,
          icon: "/dodagologo.png",
          tag: `new-order-${order.id}`,
          requireInteraction: true,
        });
      }
    } catch {
      // The orders pages still refresh their lists; avoid blocking the live alert
      // host if the current route is changing or the request gets cancelled.
    }
  }, []);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    showOrderPopup();

    const cleanups = [
      onNewOrder((payload) => {
        showOrderPopup(payload?.orderId);
      }),
      onOrderStatusUpdate(({ orderId, status }) => {
        if (status !== "PENDING") {
          shownOrderIdsRef.current.delete(orderId);
        }

        setOrderRequest((current) => {
          if (!current || current.id !== orderId) return current;
          if (status === "PENDING") return current;
          setShowRequest(false);
          return null;
        });
      }),
    ];
    const pollInterval = window.setInterval(() => {
      showOrderPopup();
    }, ORDER_ALERT_POLL_MS);

    const handleFocus = () => showOrderPopup();
    const handleVisibilityChange = () => {
      if (!document.hidden) showOrderPopup();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      window.clearInterval(pollInterval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [showOrderPopup]);

  const handleAcceptOrder = async (orderId) => {
    await updateOrderStatus(orderId, "ACCEPTED");
    setShowRequest(false);
    setOrderRequest(null);
  };

  const handleRejectOrder = async (orderId) => {
    await updateOrderStatus(orderId, "REJECTED");
    setShowRequest(false);
    setOrderRequest(null);
  };

  if (!showRequest || !orderRequest) return null;

  return (
    <Suspense fallback={null}>
      <OrderRequestPopup
        order={orderRequest}
        type="vendor"
        onAccept={handleAcceptOrder}
        onReject={handleRejectOrder}
        onClose={() => {
          setShowRequest(false);
          setOrderRequest(null);
        }}
      />
    </Suspense>
  );
};

export default VendorOrderAlertHost;
