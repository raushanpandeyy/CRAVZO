import React, { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { BatteryWarning, MapPin, MessageCircle, Wifi, WifiOff } from "lucide-react";

import { getRiderOrders, updateOrderStatus, verifyDeliveryOtp } from "../../services/orderService.js";
import { updateRiderLocation, updateRiderStatus } from "../../services/riderService.js";
import { getProfile } from "../../services/userService.js";
import { onNewOrder, onOrderStatusUpdate } from "../../services/chatSocket.js";
import { unlockAlertSound } from "../../utils/alertSound.js";

const OrderRequestPopup = lazy(() => import("../../components/OrderRequestPopup.jsx"));
const RiderMap = lazy(() => import("./LazyRiderMap.jsx"));
const OrderChatModal = lazy(() => import("../../components/OrderChatModal.jsx"));

const LOCATION_HEARTBEAT_MS = 10000;
const LOCATION_MOVEMENT_THRESHOLD = 0.0003;

const formatCurrency = (amount) => `Rs ${Math.floor(amount || 0)}`;

const formatDistance = (distance) => {
  const value = Number(distance || 0);
  if (!Number.isFinite(value) || value <= 0) return "N/A";
  return `${value.toFixed(value < 10 ? 1 : 0)} km`;
};

const formatRestaurantAddress = (restaurant) =>
  [restaurant?.addressLine1, restaurant?.addressLine2, restaurant?.city, restaurant?.state, restaurant?.postalCode, "India"]
    .filter(Boolean)
    .join(", ") || "Restaurant address pending";

const formatCustomerAddress = (address) =>
  [address?.line1, address?.line2, address?.city, address?.state, address?.postalCode, "India"].filter(Boolean).join(", ") ||
  "Customer address pending";

const buildNavigationTarget = (location, fallbackAddress = "") => {
  const lat = location?.lat ?? location?.latitude;
  const lng = location?.lng ?? location?.longitude;

  if (lat && lng) {
    return `${lat},${lng}`;
  }

  if (fallbackAddress.trim()) {
    return fallbackAddress;
  }

  return "";
};

const RiderDashboard = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [chatOrder, setChatOrder] = useState(null);
  const [deliveryOtpInputs, setDeliveryOtpInputs] = useState({});
  const [riderLocation, setRiderLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("pending");
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [wakeLockSupported, setWakeLockSupported] = useState(() => typeof navigator !== "undefined" && "wakeLock" in navigator);
  const [isPageVisible, setIsPageVisible] = useState(() => typeof document === "undefined" || !document.hidden);
  const [orderRequest, setOrderRequest] = useState(null);
  const [showRequest, setShowRequest] = useState(false);
  const firstLoadRef = useRef(true);
  const lastLocationSyncRef = useRef({ lat: null, lng: null, syncedAt: 0 });
  const isOnlineRef = useRef(false);
  const wakeLockRef = useRef(null);
  const previousAvailableOrdersRef = useRef([]);

  const openNavigation = (target) => {
    if (!target) {
      setError("Location not available for navigation yet.");
      return;
    }

    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(target)}`, "_blank");
  };

  const loadOrders = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    setError("");

    try {
      const rawData = await getRiderOrders();
      const data = Array.isArray(rawData) ? rawData : [];

      const currentAvailableIds = data.filter((order) => order.isAvailable).map((order) => order.id);

      if (currentAvailableIds.length > 0) {
        if (firstLoadRef.current) {
          // On first load, seed the baseline without showing a popup.
          // This prevents stale/old available orders from triggering alerts
          // every time the rider opens the dashboard.
          // The popup will only fire for orders that arrive AFTER this load.
        } else {
          const previousAvailableIds = previousAvailableOrdersRef.current;
          const newAvailableOrders = data.filter(
            (order) => order.isAvailable && !previousAvailableIds.includes(order.id)
          );

          if (newAvailableOrders.length > 0) {
            const latestOrder = newAvailableOrders[0];
            setOrderRequest(latestOrder);
            setShowRequest(true);

            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("Dodago - New Order!", {
                body: `${latestOrder.restaurant?.name || "New order"} - Earn Rs ${Math.floor(latestOrder.deliveryFee || 0)}`,
                icon: "/dodagologo.png",
                tag: "new-order",
                requireInteraction: true,
              });
            }
          }
        }
      }

      previousAvailableOrdersRef.current = currentAvailableIds;
      firstLoadRef.current = false;
      setOrders(data);
    } catch (requestError) {
      setError(requestError.message || "Failed to load rider orders");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const loadRiderState = async () => {
    try {
      const user = await getProfile();
      setIsOnline(Boolean(user?.isOnline));
    } catch (requestError) {
      setError(requestError.message || "Failed to load rider profile");
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      const order = orderRequest?.id === orderId ? orderRequest : orders.find(o => o.id === orderId);
      const status = order?.status || "ACCEPTED";
      await updateOrderStatus(orderId, status);
      setMessage("Order accepted successfully!");
      setShowRequest(false);
      setOrderRequest(null);
      await loadOrders({ silent: true });
    } catch (err) {
      setError(err.message || "Failed to accept order");
    }
  };

  const handleRejectOrder = async (orderId) => {
    try {
      await updateOrderStatus(orderId, "REJECTED");
      setMessage("Order rejected.");
      setShowRequest(false);
      setOrderRequest(null);
      await loadOrders({ silent: true });
    } catch (err) {
      setError(err.message || "Failed to reject order");
    }
  };

  useEffect(() => {
    loadRiderState();
    loadOrders();

    // Socket payloads are small; refetch so rider popups/actions use full order data.
    const cleanups = [
      onNewOrder(() => {
        loadOrders({ silent: true });
      }),
      onOrderStatusUpdate(() => {
        loadOrders({ silent: true });
      }),
    ];
    return () => cleanups.forEach((fn) => fn());
  }, []);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => { });
    }
  }, []);

  // Unlock Web Audio API on first user interaction so alert sound plays
  // when a new order popup appears (browser autoplay policy requirement).
  useEffect(() => {
    const unlock = () => { unlockAlertSound(); };
    window.addEventListener("pointerdown", unlock, { once: true, passive: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  const syncRiderLocation = useCallback(async (location, { force = false } = {}) => {
    if (!location || !isOnlineRef.current) return false;

    const lastSync = lastLocationSyncRef.current;
    const movedEnough =
      lastSync.lat === null ||
      Math.abs(lastSync.lat - location.lat) > LOCATION_MOVEMENT_THRESHOLD ||
      Math.abs(lastSync.lng - location.lng) > LOCATION_MOVEMENT_THRESHOLD;
    const waitedEnough = Date.now() - lastSync.syncedAt > LOCATION_HEARTBEAT_MS;

    if (!force && (!movedEnough || !waitedEnough)) return false;

    setLocationStatus("syncing");
    try {
      await updateRiderLocation(location.lat, location.lng, {
        accuracy: location.accuracy,
        heading: location.heading,
        speed: location.speed,
        timestamp: location.timestamp,
      });
      lastLocationSyncRef.current = {
        lat: location.lat,
        lng: location.lng,
        syncedAt: Date.now(),
      };
      setLocationStatus("synced");
      return true;
    } catch {
      setLocationStatus("error");
      return false;
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsPageVisible(visible);
      if (visible && riderLocation) {
        syncRiderLocation(riderLocation, { force: true });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [riderLocation, syncRiderLocation]);

  useEffect(() => {
    let cancelled = false;

    const requestWakeLock = async () => {
      if (!isOnline || document.hidden) return;
      if (!("wakeLock" in navigator)) {
        setWakeLockSupported(false);
        return;
      }

      try {
        const lock = await navigator.wakeLock.request("screen");
        if (cancelled) {
          await lock.release();
          return;
        }
        wakeLockRef.current = lock;
        setWakeLockSupported(true);
        setWakeLockActive(true);
        lock.addEventListener("release", () => setWakeLockActive(false));
      } catch {
        setWakeLockActive(false);
      }
    };

    requestWakeLock();

    return () => {
      cancelled = true;
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
      setWakeLockActive(false);
    };
  }, [isOnline, isPageVisible]);

  useEffect(() => {
    if (!isOnline || !riderLocation) return undefined;
    const interval = window.setInterval(() => {
      syncRiderLocation(riderLocation, { force: true });
    }, 25000);
    return () => window.clearInterval(interval);
  }, [isOnline, riderLocation, syncRiderLocation]);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("unsupported");
      return undefined;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const nextLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
        };

        setRiderLocation(nextLocation);
        setLocationStatus((current) => (current === "syncing" ? current : "watching"));
        syncRiderLocation(nextLocation);
      },
      () => {
        setLocationStatus("error");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [syncRiderLocation]);

  const toggleOnlineStatus = async () => {
    setError("");

    try {
      const nextStatus = !isOnline;
      await updateRiderStatus(nextStatus);
      setIsOnline(nextStatus);
      isOnlineRef.current = nextStatus;
      setMessage(`You are now ${nextStatus ? "online" : "offline"}.`);
      if (nextStatus && riderLocation) {
        await syncRiderLocation(riderLocation, { force: true });
      }
      await loadOrders({ silent: true });
    } catch (requestError) {
      setError(requestError.message || "Failed to update rider status");
    }
  };

  const handleStatusUpdate = async (orderId, status, successMessage) => {
    setMessage("");
    setError("");

    try {
      await updateOrderStatus(orderId, status);
      setMessage(successMessage);
      await loadOrders({ silent: true });
      setSelectedOrder(null);
    } catch (requestError) {
      setError(requestError.message || "Failed to update rider order");
    }
  };

  const handleVerifyDeliveryOtp = async (orderId) => {
    const otp = String(deliveryOtpInputs[orderId] || "").trim();
    setMessage("");
    setError("");
    try {
      await verifyDeliveryOtp(orderId, otp);
      setMessage("Delivery completed with customer OTP.");
      setDeliveryOtpInputs((current) => ({ ...current, [orderId]: "" }));
      await loadOrders({ silent: true });
      setSelectedOrder(null);
    } catch (requestError) {
      setError(requestError.message || "Failed to verify delivery OTP");
    }
  };

  const availableOrders = useMemo(() => orders.filter((order) => order.isAvailable), [orders]);
  const activeOrders = useMemo(
    () => orders.filter((order) => !order.isAvailable && ["ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"].includes(order.status)),
    [orders],
  );
  const deliveredOrders = useMemo(() => orders.filter((order) => order.status === "DELIVERED"), [orders]);
  const earningOrders = useMemo(
    () => orders.filter((order) => order.status === "DELIVERED" || Number(order.riderCancellationEarning || 0) > 0),
    [orders],
  );
  const earnings = useMemo(
    () => earningOrders.reduce((sum, order) => (
      sum + (order.status === "CANCELLED" ? Number(order.riderCancellationEarning || 0) : Number(order.deliveryFee || 0))
    ), 0),
    [earningOrders],
  );
  const deliveredDistanceKm = useMemo(
    () => deliveredOrders.reduce((sum, order) => sum + Number(order.deliveryDistance || 0), 0),
    [deliveredOrders],
  );

  const renderPrimaryAction = (order, fullWidth = false) => {
    const className = fullWidth
      ? "w-full rounded-xl py-3 font-bold text-white"
      : "rounded-full px-4 py-2 text-sm font-semibold text-white";

    if (order.isAvailable) {
      return (
        <div className={`flex ${fullWidth ? "w-full gap-3" : "gap-2"}`}>
          <button
            onClick={() => handleStatusUpdate(order.id, order.status, "Order accepted successfully.")}
            className={`${fullWidth ? "flex-1" : ""} ${className} bg-indigo-700`}
          >
            Accept Order
          </button>
          <button
            onClick={() => handleStatusUpdate(order.id, "REJECTED", "Order rejected. It will move to the next rider.")}
            className={`${fullWidth ? "flex-1" : ""} ${className} bg-rose-600`}
          >
            Reject
          </button>
        </div>
      );
    }

    if (order.status === "READY_FOR_PICKUP") {
      return (
        <button
          onClick={() => handleStatusUpdate(order.id, "OUT_FOR_DELIVERY", "Pickup confirmed. Proceed to customer address.")}
          className={`${className} bg-blue-600`}
        >
          Picked Up
        </button>
      );
    }

    if (order.status === "OUT_FOR_DELIVERY") {
      return (
        <div className={`${fullWidth ? "w-full" : ""} flex gap-2`}>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={deliveryOtpInputs[order.id] || ""}
            onChange={(event) => setDeliveryOtpInputs((current) => ({ ...current, [order.id]: event.target.value.replace(/\D/g, "").slice(0, 4) }))}
            placeholder="OTP"
            className={`${fullWidth ? "flex-1" : "w-20"} rounded-xl border border-slate-300 px-3 py-2 text-center text-sm font-black tracking-[0.25em] outline-none focus:border-emerald-500`}
          />
          <button
            onClick={() => handleVerifyDeliveryOtp(order.id)}
            disabled={(deliveryOtpInputs[order.id] || "").length !== 4}
            className={`${fullWidth ? "flex-1" : ""} ${className} bg-emerald-600 disabled:bg-slate-400`}
          >
            Verify & Deliver
          </button>
        </div>
      );
    }

    return (
      <button disabled className={`${className} bg-slate-400`}>
        Waiting for Restaurant
      </button>
    );
  };

  const canChatOnOrder = (order) => !order.isAvailable && !["DELIVERED", "CANCELLED", "REJECTED"].includes(order.status);

  return (
    <div className="min-h-screen bg-gray-50 pt-4 pb-24 font-sans md:pt-24 md:pb-20">
      <div className="rounded-b-[40px] bg-indigo-700 p-6 text-white shadow-lg">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/50 bg-white/20">
              <span className="text-2xl">R</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">Rider Console</h2>
              <p className="text-sm font-medium uppercase tracking-wider text-indigo-200">
                Live delivery queue
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${isOnline ? "bg-green-400" : "bg-red-400"}`}>
              {isOnline ? "ONLINE" : "OFFLINE"}
            </span>
            <button onClick={toggleOnlineStatus} className="mt-2 text-xs underline opacity-80">
              Go {isOnline ? "Offline" : "Online"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4">
        <div className="-mt-8 grid grid-cols-2 gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-xl sm:grid-cols-4 sm:p-6">
          <div className="text-center">
            <p className="mb-1 text-sm font-medium text-gray-500">Available Orders</p>
            <h3 className="text-2xl font-extrabold text-gray-800">{availableOrders.length}</h3>
          </div>
          <div className="text-center">
            <p className="mb-1 text-sm font-medium text-gray-500">Completed Orders</p>
            <h3 className="text-2xl font-extrabold text-gray-800">{deliveredOrders.length}</h3>
          </div>
          <div className="text-center">
            <p className="mb-1 text-sm font-medium text-gray-500">Delivered Km</p>
            <h3 className="text-2xl font-extrabold text-gray-800">{formatDistance(deliveredDistanceKm)}</h3>
          </div>
          <div className="text-center">
            <p className="mb-1 text-sm font-medium text-gray-500">Delivery Earnings</p>
            <h3 className="text-2xl font-extrabold text-gray-800">{formatCurrency(earnings)}</h3>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-4xl space-y-6 px-4">
        {message ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
        {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        {isOnline ? (
          <div className="rounded-2xl border border-indigo-100 bg-white px-4 py-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-700">
              <span className="inline-flex items-center gap-2 text-indigo-700">
                <MapPin className="h-4 w-4" />
                {locationStatus === "synced" ? "Location synced" : locationStatus === "syncing" ? "Syncing location" : locationStatus === "error" ? "Location issue" : "Location watching"}
              </span>
              <span className={`inline-flex items-center gap-2 ${wakeLockActive ? "text-emerald-700" : "text-amber-700"}`}>
                <BatteryWarning className="h-4 w-4" />
                {wakeLockActive ? "Screen stay-awake active" : wakeLockSupported ? "Keep screen awake" : "Wake lock unsupported"}
              </span>
              <span className={`inline-flex items-center gap-2 ${isPageVisible ? "text-emerald-700" : "text-amber-700"}`}>
                {isPageVisible ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                {isPageVisible ? "Page active" : "Page backgrounded"}
              </span>
            </div>
            <p className="mt-2 text-xs font-medium text-slate-500">
              Web tracking can pause if the phone locks, browser closes, battery saver starts, or this page stays in background. Keep this screen open while delivering.
            </p>
          </div>
        ) : null}

        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <h3 className="mb-4 text-xl font-bold text-slate-900">Orders in your area</h3>
          {loading ? (
            <p className="text-slate-500">Loading orders...</p>
          ) : !isOnline ? (
            <p className="text-slate-500">Go online to receive new orders from your area.</p>
          ) : availableOrders.length === 0 ? (
            <p className="text-slate-500">No new orders available right now.</p>
          ) : (
            <div className="space-y-4">
              {availableOrders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-900">{order.restaurant?.name}</h4>
                      <p className="text-sm text-slate-600">{formatRestaurantAddress(order.restaurant)}</p>
                      <p className="text-sm text-slate-500">
                        {order.status === "READY_FOR_PICKUP" ? "Order ready for pickup" : "Restaurant has accepted this order"}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(order.deliveryFee)}</div>
                      <div className="text-xs text-slate-500">Delivery fee</div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      View
                    </button>
                    {renderPrimaryAction(order)}
                  </div>
                  <div className="mt-3 rounded-2xl bg-indigo-50 px-3 py-2 text-sm font-bold text-indigo-800">
                    Delivery km: {formatDistance(order.deliveryDistance)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <h3 className="mb-4 text-xl font-bold text-slate-900">Active deliveries</h3>
          {activeOrders.length === 0 ? (
            <p className="text-slate-500">No active deliveries yet.</p>
          ) : (
            <div className="space-y-4">
              {activeOrders.map((order) => {
                const pickedUp = order.status === "OUT_FOR_DELIVERY";

                return (
                  <div key={order.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-slate-900">{order.restaurant?.name}</h4>
                        <p className="text-sm text-slate-600">
                          {pickedUp ? formatCustomerAddress(order.address) : formatRestaurantAddress(order.restaurant)}
                        </p>
                        <p className="text-sm text-slate-500">
                          {pickedUp ? order.customer?.name || "Customer" : "Pickup from restaurant"}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(order.totalAmount)}</div>
                        <div className="text-xs text-slate-500">{order.status.replaceAll("_", " ")}</div>
                        <div className="mt-1 text-xs font-bold text-indigo-700">{formatDistance(order.deliveryDistance)}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                      >
                        View
                      </button>
                      {canChatOnOrder(order) ? (
                        <button
                          onClick={() => setChatOrder(order)}
                          className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Chat
                        </button>
                      ) : null}
                      {renderPrimaryAction(order)}
                    </div>
                    <div className="mt-3 rounded-2xl bg-indigo-50 px-3 py-2 text-sm font-bold text-indigo-800">
                      Delivery km for this order: {formatDistance(order.deliveryDistance)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {selectedOrder ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-2xl">
            <Suspense fallback={<div className="flex h-[400px] items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-500">
              Loading map...
            </div>}>
              <RiderMap
                pickup={{
                  lat: selectedOrder.restaurant?.latitude,
                  lng: selectedOrder.restaurant?.longitude,
                }}
                drop={
                  selectedOrder.address?.latitude && selectedOrder.address?.longitude
                    ? {
                      lat: selectedOrder.address.latitude,
                      lng: selectedOrder.address.longitude,
                    }
                    : null
                }
                rider={riderLocation}
              />
            </Suspense>

            <div className="mb-4 flex items-start justify-between">
              <div>
                <span className="rounded bg-indigo-100 px-2 py-1 text-xs font-bold text-indigo-700">
                  {selectedOrder.isAvailable ? "AVAILABLE ORDER" : "ASSIGNED ORDER"}
                </span>
                <h4 className="mt-2 text-xl font-black text-gray-800">{selectedOrder.restaurant?.name}</h4>
              </div>
              <p className="font-bold text-green-600">{formatCurrency(Number(selectedOrder.deliveryFee || 0) + Number(selectedOrder.tipAmount || 0))}</p>
            </div>

            <div className="mb-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-indigo-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">Delivery km</p>
                  <p className="mt-1 text-xl font-black text-indigo-900">{formatDistance(selectedOrder.deliveryDistance)}</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-500">Earning</p>
                  <p className="mt-1 text-xl font-black text-emerald-900">
                    {formatCurrency(Number(selectedOrder.deliveryFee || 0) + Number(selectedOrder.tipAmount || 0))}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-gray-800">Pickup Address</p>
                <p className="text-xs text-gray-500">{formatRestaurantAddress(selectedOrder.restaurant)}</p>
              </div>

              {selectedOrder.status === "OUT_FOR_DELIVERY" ? (
                <div className="border-t pt-4">
                  <p className="text-sm font-bold text-gray-800">{selectedOrder.customer?.name || "Customer"}</p>
                  <p className="text-xs text-gray-500">{selectedOrder.customer?.phone || "Phone unavailable"}</p>
                  <p className="mt-2 text-sm font-bold text-gray-800">Drop Address</p>
                  <p className="text-xs text-gray-500">{formatCustomerAddress(selectedOrder.address)}</p>
                </div>
              ) : (
                <div className="border-t pt-4">
                  <p className="text-sm font-bold text-gray-800">{selectedOrder.customer?.name || "Customer"}</p>
                  <p className="text-xs text-gray-500">{selectedOrder.customer?.phone || "Phone unavailable"}</p>
                  <p className="mt-2 text-sm font-bold text-gray-800">Delivery Address</p>
                  <p className="text-xs text-gray-500">Customer address will appear after pickup.</p>
                </div>
              )}

              {(selectedOrder.deliveryInstructions || Number(selectedOrder.tipAmount || 0) > 0) ? (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  {Number(selectedOrder.tipAmount || 0) > 0 ? (
                    <p className="text-sm font-bold text-blue-900">Rider tip: {formatCurrency(selectedOrder.tipAmount)}</p>
                  ) : null}
                  {selectedOrder.deliveryInstructions ? (
                    <div className={Number(selectedOrder.tipAmount || 0) > 0 ? "mt-2" : ""}>
                      <p className="text-sm font-bold text-blue-900">Customer instructions</p>
                      <p className="mt-1 text-sm text-blue-800">{selectedOrder.deliveryInstructions}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="border-t pt-4">
                {selectedOrder.items.map((item) => (
                  <p key={item.id} className="text-sm text-gray-700">
                    {item.quantity}x {item.menuItem?.name}
                  </p>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pb-4">
              <button
                onClick={() =>
                  openNavigation(
                    selectedOrder.status === "OUT_FOR_DELIVERY"
                      ? buildNavigationTarget(selectedOrder.address, formatCustomerAddress(selectedOrder.address))
                      : buildNavigationTarget(selectedOrder.restaurant, formatRestaurantAddress(selectedOrder.restaurant)),
                  )
                }
                className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white"
              >
                {selectedOrder.status === "OUT_FOR_DELIVERY" ? "Navigate to Customer" : "Navigate to Restaurant"}
              </button>
              {!selectedOrder.isAvailable && selectedOrder.customer?.phone ? (
                <button
                  onClick={() => {
                    window.location.href = `tel:${selectedOrder.customer.phone}`;
                  }}
                  className="rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white"
                >
                  Call
                </button>
              ) : null}
              {canChatOnOrder(selectedOrder) ? (
                <button
                  onClick={() => setChatOrder(selectedOrder)}
                  className="rounded-xl bg-slate-950 px-4 py-3 font-bold text-white"
                >
                  <MessageCircle className="h-5 w-5" />
                </button>
              ) : null}
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-1/3 rounded-2xl bg-gray-100 py-4 font-bold text-gray-600 transition hover:bg-gray-200"
              >
                Close
              </button>
            </div>

            {renderPrimaryAction(selectedOrder, true)}
          </div>
        </div>
      ) : null}

      {chatOrder ? (
        <Suspense fallback={<div className="fixed inset-0 z-[90] bg-slate-950/40" />}>
          <OrderChatModal
            order={chatOrder}
            onClose={() => setChatOrder(null)}
            title="Chat with Customer"
            subtitle={chatOrder.customer?.name || "Customer"}
            participantName={chatOrder.customer?.name || "Customer"}
            disabled={!canChatOnOrder(chatOrder)}
            disabledReason="Customer chat closes after the order is delivered or cancelled."
          />
        </Suspense>
      ) : null}

      {showRequest && orderRequest ? (
        <Suspense fallback={null}>
          <OrderRequestPopup
            order={orderRequest}
            type="rider"
            onAccept={handleAcceptOrder}
            onReject={handleRejectOrder}
            onClose={() => { setShowRequest(false); setOrderRequest(null); }}
          />
        </Suspense>
      ) : null}

    </div>
  );
};

export default RiderDashboard;


