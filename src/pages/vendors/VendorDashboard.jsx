import React, { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { AlertCircle, Clock, IndianRupee, ShoppingBag, Store } from "lucide-react";

import { getVendorOrders, updateOrderStatus } from "../../services/orderService.js";
import { getMyRestaurant, updateRestaurantAvailability, updateRestaurantHours } from "../../services/vendorService.js";
import { VerifiedBadge, ProfileProgress } from "../../components/vendors/VerifiedBadge.jsx";
import { Skeleton, SkeletonCard, SkeletonRow } from "../../components/Skeleton.jsx";
import { onNewOrder, onOrderStatusUpdate } from "../../services/chatSocket.js";
import VendorHoursAlert from "../../components/vendors/VendorHoursAlert.jsx";
import { getExtendedClosingTime, getRestaurantHoursStatus } from "../../utils/restaurantHours.js";

const OrderRequestPopup = lazy(() => import("../../components/OrderRequestPopup.jsx"));

const HOURS_ALERT_CHECK_MS = 60 * 1000;
const HOURS_ALERT_SNOOZE_MS = 10 * 60 * 1000;

const formatCurrency = (amount) => `Rs ${Math.floor(amount || 0)}`;

const VendorDashboard = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [orderRequest, setOrderRequest] = useState(null);
  const [showRequest, setShowRequest] = useState(false);
  const [hoursAlert, setHoursAlert] = useState(null);
  const [hoursSaving, setHoursSaving] = useState(false);
  const [hoursSnoozedUntil, setHoursSnoozedUntil] = useState(0);

  const loadDashboard = async () => {
    setError("");

    try {
      // Initial load - fetch all data in parallel
      const [restaurantData, vendorData] = await Promise.all([getMyRestaurant(), getVendorOrders({ skipCache: true })]);
      const orderData = Array.isArray(vendorData?.orders) ? vendorData.orders : [];

      const pendingOrders = orderData.filter((order) => order.status === "PENDING");

      if (pendingOrders.length > 0) {
        setOrderRequest(pendingOrders[0]);
        setShowRequest(true);
        triggerNotification(pendingOrders[0]);
      }

      setRestaurant(restaurantData);
      setOrders(orderData);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load dashboard", err);
      setError(err.message || "Failed to load dashboard");
      setLoading(false);
    }
  };

  const triggerNotification = (order) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Dodago - New Order!", {
        body: `Order from ${order.customer?.name || "Customer"} - ₹${Math.floor(order.totalAmount || 0)}`,
        icon: "/dodagologo.png",
        tag: "new-order",
        requireInteraction: true,
      });
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      await updateOrderStatus(orderId, "ACCEPTED");
      setMessage("Order accepted!");
      setShowRequest(false);
      setOrderRequest(null);
      await loadDashboard();
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
      await loadDashboard();
    } catch (err) {
      setError(err.message || "Failed to reject order");
    }
  };

  useEffect(() => {
    loadDashboard();
    // Socket payloads are intentionally small, so refresh the full vendor order
    // list before showing the restaurant popup.
    const cleanups = [
      onNewOrder(() => {
        loadDashboard();
      }),
      onOrderStatusUpdate(({ orderId, status }) => {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
        );
        setOrderRequest(null);
      }),
    ];
    return () => cleanups.forEach((fn) => fn());
  }, []);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => { });
    }
  }, []);
  useEffect(() => {
    if (!restaurant?.id || !restaurant.openingTime || !restaurant.closingTime) return undefined;

    const checkHoursAlert = () => {
      if (Date.now() < hoursSnoozedUntil) return;
      const status = getRestaurantHoursStatus(restaurant, { closingSoonMinutes: 30, openingWindowMinutes: 20 });
      const today = new Date().toISOString().slice(0, 10);

      if (status.closingSoon && restaurant.isOpen !== false) {
        const key = `dodago-hours-alert:${restaurant.id}:closing:${today}:${restaurant.closingTime}`;
        if (sessionStorage.getItem(key) !== "done") {
          sessionStorage.setItem(key, "done");
          setHoursAlert({ type: "closing", key, minutesUntilClose: status.minutesUntilClose });
        }
        return;
      }

      if (status.openingNow && restaurant.isOpen === false) {
        const key = `dodago-hours-alert:${restaurant.id}:opening:${today}:${restaurant.openingTime}`;
        if (sessionStorage.getItem(key) !== "done") {
          sessionStorage.setItem(key, "done");
          setHoursAlert({ type: "opening", key });
        }
      }
    };

    checkHoursAlert();
    const interval = window.setInterval(checkHoursAlert, HOURS_ALERT_CHECK_MS);
    return () => window.clearInterval(interval);
  }, [hoursSnoozedUntil, restaurant]);


  const handleExtendHours = async (extraMinutes) => {
    if (!restaurant?.id) return;
    const nextClosingTime = getExtendedClosingTime(restaurant.closingTime, extraMinutes);
    if (!nextClosingTime) {
      setError("Closing time is not valid. Please update restaurant profile timings.");
      return;
    }

    setHoursSaving(true);
    setMessage("");
    setError("");
    try {
      const updatedRestaurant = await updateRestaurantHours(restaurant.id, { closingTime: nextClosingTime, isOpen: true });
      setRestaurant((current) => ({ ...(current || {}), ...updatedRestaurant }));
      setHoursAlert(null);
      setMessage(`Closing time extended to ${nextClosingTime}.`);
    } catch (requestError) {
      setError(requestError.message || "Failed to extend closing time");
    } finally {
      setHoursSaving(false);
    }
  };

  const handleGoOnlineFromAlert = async () => {
    if (!restaurant?.id || restaurant.isOpen) return;
    setHoursSaving(true);
    setMessage("");
    setError("");
    try {
      const updatedRestaurant = await updateRestaurantAvailability(restaurant.id, true);
      setRestaurant((current) => ({ ...(current || {}), ...updatedRestaurant }));
      setHoursAlert(null);
      setMessage("Restaurant is online now.");
    } catch (requestError) {
      setError(requestError.message || "Failed to open restaurant");
    } finally {
      setHoursSaving(false);
    }
  };

  const handleHoursSnooze = () => {
    setHoursSnoozedUntil(Date.now() + HOURS_ALERT_SNOOZE_MS);
    setHoursAlert(null);
  };
  const handleToggleRestaurant = async () => {
    if (!restaurant) {
      return;
    }

    setMessage("");
    setError("");

    try {
      const updatedRestaurant = await updateRestaurantAvailability(restaurant.id, !restaurant.isOpen);
      setRestaurant((current) => ({
        ...(current || {}),
        ...updatedRestaurant,
      }));
      setMessage(`Restaurant is now ${updatedRestaurant.isOpen ? "online" : "offline"}.`);
    } catch (requestError) {
      setError(requestError.message || "Failed to update restaurant availability");
    }
  };

  const stats = useMemo(() => {
    const activeOrders = orders.filter((order) => ["PENDING", "ACCEPTED", "PREPARING"].includes(order.status));
    const completedOrders = orders.filter((order) => order.status === "DELIVERED");
    const earnings = completedOrders.reduce((sum, order) => sum + Math.floor(Number(order.totalAmount || 0)), 0);

    return {
      totalOrders: orders.length,
      activeOrders: activeOrders.length,
      menuItems: restaurant?.menuItems?.length || 0,
      earnings,
    };
  }, [orders, restaurant]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  return (
    <div className="px-6 py-6 bg-[#F4F7FB] min-h-screen">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-4xl font-bold text-gray-900">{restaurant?.name || "Vendor Dashboard"}</h1>
            <VerifiedBadge restaurant={restaurant} />
          </div>
          <p className="text-gray-600 text-sm mt-1">
            {restaurant
              ? `${restaurant.cuisine || "Restaurant"} in ${restaurant.city || "your city"}`
              : "Create your restaurant profile to start receiving and managing orders."}
          </p>
          {restaurant && (
            <div className="mt-3 max-w-sm">
              <ProfileProgress restaurant={restaurant} />
            </div>
          )}
        </div>
        <button
          onClick={loadDashboard}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}
      {message ? (
        <div className="mb-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>
      ) : null}

      {!restaurant && !loading ? (
        <div className="mb-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-semibold">Restaurant profile missing</p>
              <p className="mt-1 text-sm">
                Complete your profile from the vendor profile page, then add menu items to go live.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Restaurant Status</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{restaurant?.status || "Not set"}</p>
              {restaurant ? (
                <button
                  onClick={handleToggleRestaurant}
                  className={`mt-3 rounded-full px-4 py-2 text-xs font-semibold text-white ${
                    restaurant.isOpen ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  Go {restaurant.isOpen ? "Offline" : "Online"}
                </button>
              ) : null}
            </div>
            <div className="rounded-2xl bg-slate-100 p-3">
              <Store className="h-6 w-6 text-slate-700" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Orders</p>
              <p className="mt-2 text-2xl font-bold text-orange-600">{stats.activeOrders}</p>
            </div>
            <div className="rounded-2xl bg-orange-100 p-3">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Menu Items</p>
              <p className="mt-2 text-2xl font-bold text-indigo-600">{stats.menuItems}</p>
            </div>
            <div className="rounded-2xl bg-indigo-100 p-3">
              <ShoppingBag className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Delivered Earnings</p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">{formatCurrency(stats.earnings)}</p>
            </div>
            <div className="rounded-2xl bg-emerald-100 p-3">
              <IndianRupee className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Recent Orders</h2>
              <p className="mt-1 text-sm text-slate-500">Latest backend orders for your restaurant</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {stats.totalOrders} total
            </span>
          </div>

          {loading ? (
            <div className="space-y-4">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : recentOrders.length ? (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">Order #{order.id.slice(-6)}</p>
                      <p className="mt-1 text-sm text-slate-600">{order.customer?.name || "Customer"}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {order.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                    <span>{order.items?.length || 0} items</span>
                    <span>{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-gray-500">No orders have reached this restaurant yet.</div>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Store Snapshot</h2>
          <div className="mt-5 space-y-4 text-sm text-slate-600">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Open for orders</p>
              <p className="mt-1">{restaurant?.isOpen ? "Yes, customers can place orders." : "No, the storefront is closed."}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Address</p>
              <p className="mt-1">
                {[restaurant?.addressLine1, restaurant?.city, restaurant?.state, restaurant?.postalCode]
                  .filter(Boolean)
                  .join(", ") || "Add your restaurant address from the profile page."}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Menu readiness</p>
              <p className="mt-1">
                {stats.menuItems
                  ? `${stats.menuItems} items currently configured for this restaurant.`
                  : "Add menu items so customers can start ordering."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <VendorHoursAlert
        alert={hoursAlert}
        restaurant={restaurant}
        saving={hoursSaving}
        onExtend={handleExtendHours}
        onGoOnline={handleGoOnlineFromAlert}
        onSnooze={handleHoursSnooze}
        onClose={() => setHoursAlert(null)}
      />
      {showRequest && orderRequest ? (
        <Suspense fallback={null}>
          <OrderRequestPopup
            order={orderRequest}
            type="vendor"
            onAccept={handleAcceptOrder}
            onReject={handleRejectOrder}
            onClose={() => { setShowRequest(false); setOrderRequest(null); }}
          />
        </Suspense>
      ) : null}
    </div>
  );
};

export default VendorDashboard;
