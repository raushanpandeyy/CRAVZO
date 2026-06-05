import React, { useEffect, useMemo, useState, lazy, Suspense, useRef } from "react";
import { AlertCircle, Clock, IndianRupee, ShoppingBag, Store } from "lucide-react";

import { getVendorOrders, updateOrderStatus } from "../../services/orderService.js";
import { getMyRestaurant, updateRestaurantAvailability } from "../../services/vendorService.js";
import { VerifiedBadge, ProfileProgress } from "../../components/vendors/VerifiedBadge.jsx";

const OrderRequestPopup = lazy(() => import("../../components/OrderRequestPopup.jsx"));

const formatCurrency = (amount) => `Rs ${Math.floor(amount || 0)}`;

const VendorDashboard = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [orderRequest, setOrderRequest] = useState(null);
  const [showRequest, setShowRequest] = useState(false);
  const previousPendingCountRef = useRef(0);
  const isFirstLoadRef = useRef(true);
  const pendingOrderIdsRef = useRef([]);

  const loadDashboard = async () => {
    setError("");

    try {
      // First load - fetch all data
      if (isFirstLoadRef.current) {
        setLoading(true);
        const [restaurantData, vendorData] = await Promise.all([getMyRestaurant(), getVendorOrders()]);
        const orderData = Array.isArray(vendorData?.orders) ? vendorData.orders : [];
        
        const pendingOrders = orderData.filter((order) => order.status === "PENDING");
        previousPendingCountRef.current = pendingOrders.length;
        pendingOrderIdsRef.current = pendingOrders.map(o => o.id);

        if (pendingOrders.length > 0) {
          setOrderRequest(pendingOrders[0]);
          setShowRequest(true);
          triggerNotification(pendingOrders[0]);
        }

        setRestaurant(restaurantData);
        setOrders(orderData);
        isFirstLoadRef.current = false;
        setLoading(false);
        return;
      }

      // Smart polling - only fetch pending count first
      const vendorData = await getVendorOrders();
      const orderData = Array.isArray(vendorData?.orders) ? vendorData.orders : [];
      const currentPendingOrders = orderData.filter((order) => order.status === "PENDING");
      const currentPendingCount = currentPendingOrders.length;

      // Only fetch full data if pending count increased
      if (currentPendingCount > previousPendingCountRef.current) {
        // New order came! Show popup
        const currentPendingIds = currentPendingOrders.map(o => o.id);
        const newOrderIds = currentPendingIds.filter(id => !pendingOrderIdsRef.current.includes(id));
        
        if (newOrderIds.length > 0) {
          const newOrder = currentPendingOrders.find(o => o.id === newOrderIds[0]) || currentPendingOrders[0];
          setOrderRequest(newOrder);
          setShowRequest(true);
          triggerNotification(newOrder);
        }
      }

      // Always update refs
      previousPendingCountRef.current = currentPendingCount;
      pendingOrderIdsRef.current = currentPendingOrders.map(o => o.id);

      // Only update orders if there are changes (or on first few checks)
      setOrders(orderData);

      // Also update restaurant occasionally (every 5th call)
      const randomCheck = Math.random() < 0.2;
      if (randomCheck) {
        const restaurantData = await getMyRestaurant();
        setRestaurant(restaurantData);
      }

    } catch (requestError) {
      console.error("Polling error:", requestError);
    }
  };

  const triggerNotification = (order) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Cravzo - New Order!", {
        body: `Order from ${order.customer?.name || "Customer"} - ₹${Math.floor(order.totalAmount || 0)}`,
        icon: "/cravzologo.png",
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
    // Smart polling - check every 10 seconds but only full fetch on new orders
    const intervalId = setInterval(loadDashboard, 10000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => { });
    }
  }, []);

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
            <div className="py-12 text-center text-sm text-gray-500">Loading dashboard...</div>
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
