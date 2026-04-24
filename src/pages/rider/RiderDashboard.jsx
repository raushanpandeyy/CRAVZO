<<<<<<< HEAD
import React, { useEffect, useMemo, useRef, useState } from "react";

import RiderNavbar from "./RiderNav.jsx";
import { getRiderOrders, updateOrderStatus } from "../../services/orderService.js";
import { updateRiderLocation, updateRiderStatus } from "../../services/riderService.js";
import { getProfile } from "../../services/userService.js";
import RiderMap from "./RiderMap.jsx";

const formatCurrency = (amount) => `Rs ${Number(amount || 0).toFixed(0)}`;

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
=======
import React, { useEffect, useMemo, useState } from "react";

import RiderNavbar from "./RiderNav";
import { getRiderOrders, updateOrderStatus } from "../../services/orderService";

const formatCurrency = (amount) => `₹${Number(amount || 0).toFixed(0)}`;

const RiderDashboard = () => {
  const [isOnline, setIsOnline] = useState(true);
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
<<<<<<< HEAD
  const [riderLocation, setRiderLocation] = useState(null);
  const firstLoadRef = useRef(true);
  const availableIdsRef = useRef([]);
  const lastLocationSyncRef = useRef({ lat: null, lng: null, syncedAt: 0 });
  const isOnlineRef = useRef(false);

  const openNavigation = (target) => {
    if (!target) {
      setError("Location not available for navigation yet.");
      return;
    }

    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(target)}`, "_blank");
  };

  const notifyForNewOrders = (nextOrders) => {
    const nextAvailableIds = nextOrders.filter((order) => order.isAvailable).map((order) => order.id);

    if (firstLoadRef.current) {
      availableIdsRef.current = nextAvailableIds;
      firstLoadRef.current = false;
      return;
    }

    const previousIds = new Set(availableIdsRef.current);
    const freshOrders = nextOrders.filter((order) => order.isAvailable && !previousIds.has(order.id));

    if (freshOrders.length) {
      setMessage("New order available in your area.");

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Cravzo Rider", {
          body: `${freshOrders.length} new order${freshOrders.length > 1 ? "s" : ""} available in your area.`,
        });
      }
    }

    availableIdsRef.current = nextAvailableIds;
  };

  const loadOrders = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

=======

  const loadOrders = async () => {
    setLoading(true);
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
    setError("");

    try {
      const data = await getRiderOrders();
<<<<<<< HEAD
      notifyForNewOrders(data);
=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
      setOrders(data);
    } catch (requestError) {
      setError(requestError.message || "Failed to load rider orders");
    } finally {
<<<<<<< HEAD
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
=======
      setLoading(false);
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
    }
  };

  useEffect(() => {
<<<<<<< HEAD
    loadRiderState();
    loadOrders();

    const intervalId = window.setInterval(() => {
      loadOrders({ silent: true });
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const nextLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        setRiderLocation(nextLocation);

        const lastSync = lastLocationSyncRef.current;
        const movedEnough =
          lastSync.lat === null ||
          Math.abs(lastSync.lat - nextLocation.lat) > 0.0008 ||
          Math.abs(lastSync.lng - nextLocation.lng) > 0.0008;
        const waitedEnough = Date.now() - lastSync.syncedAt > 15000;

        if (isOnlineRef.current && movedEnough && waitedEnough) {
          updateRiderLocation(nextLocation.lat, nextLocation.lng)
            .then(() => {
              lastLocationSyncRef.current = {
                lat: nextLocation.lat,
                lng: nextLocation.lng,
                syncedAt: Date.now(),
              };
            })
            .catch(() => {});
        }
      },
      () => {},
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const toggleOnlineStatus = async () => {
    setError("");

    try {
      const nextStatus = !isOnline;
      await updateRiderStatus(nextStatus);
      setIsOnline(nextStatus);
      setMessage(`You are now ${nextStatus ? "online" : "offline"}.`);
      if (nextStatus && riderLocation) {
        await updateRiderLocation(riderLocation.lat, riderLocation.lng);
        lastLocationSyncRef.current = {
          lat: riderLocation.lat,
          lng: riderLocation.lng,
          syncedAt: Date.now(),
        };
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

  const availableOrders = useMemo(() => orders.filter((order) => order.isAvailable), [orders]);
  const activeOrders = useMemo(
    () => orders.filter((order) => !order.isAvailable && ["ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"].includes(order.status)),
=======
    loadOrders();
  }, []);

  const availableOrders = useMemo(() => orders.filter((order) => order.isAvailable), [orders]);
  const activeOrders = useMemo(
    () => orders.filter((order) => ["OUT_FOR_DELIVERY"].includes(order.status) && !order.isAvailable),
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
    [orders],
  );
  const deliveredOrders = useMemo(() => orders.filter((order) => order.status === "DELIVERED"), [orders]);
  const earnings = useMemo(
    () => deliveredOrders.reduce((sum, order) => sum + Number(order.deliveryFee || 0), 0),
    [deliveredOrders],
  );

<<<<<<< HEAD
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
        <button
          onClick={() => handleStatusUpdate(order.id, "DELIVERED", "Order marked delivered.")}
          className={`${className} bg-emerald-600`}
        >
          Mark Delivered
        </button>
      );
    }

    return (
      <button disabled className={`${className} bg-slate-400`}>
        Waiting for Restaurant
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20 font-sans">
      <div className="rounded-b-[40px] bg-indigo-700 p-6 text-white shadow-lg">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/50 bg-white/20">
=======
  const handleStatusUpdate = async (orderId, status) => {
    setMessage("");
    setError("");

    try {
      await updateOrderStatus(orderId, status);
      setMessage("Order updated successfully.");
      await loadOrders();
      setSelectedOrder(null);
    } catch (requestError) {
      setError(requestError.message || "Failed to update rider order");
    }
  };

  return (
    <div className="bg-gray-50 pt-24 min-h-screen font-sans pb-20">
      <div className="bg-indigo-700 text-white p-6 rounded-b-[40px] shadow-lg">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/50">
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
              <span className="text-2xl">R</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">Rider Console</h2>
<<<<<<< HEAD
              <p className="text-sm font-medium uppercase tracking-wider text-indigo-200">
=======
              <p className="text-indigo-200 text-sm font-medium uppercase tracking-wider">
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
                Live delivery queue
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end">
<<<<<<< HEAD
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${isOnline ? "bg-green-400" : "bg-red-400"}`}>
              {isOnline ? "ONLINE" : "OFFLINE"}
            </span>
            <button onClick={toggleOnlineStatus} className="mt-2 text-xs underline opacity-80">
=======
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${isOnline ? "bg-green-400" : "bg-red-400"}`}>
              {isOnline ? "ONLINE" : "OFFLINE"}
            </span>
            <button onClick={() => setIsOnline(!isOnline)} className="mt-2 text-xs underline opacity-80">
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
              Go {isOnline ? "Offline" : "Online"}
            </button>
          </div>
        </div>
      </div>

<<<<<<< HEAD
      <div className="mx-auto max-w-4xl px-4">
        <div className="-mt-8 flex items-center justify-around rounded-3xl border border-gray-100 bg-white p-6 shadow-xl">
          <div className="text-center">
            <p className="mb-1 text-sm font-medium text-gray-500">Available Orders</p>
            <h3 className="text-2xl font-extrabold text-gray-800">{availableOrders.length}</h3>
          </div>
          <div className="h-10 w-px bg-gray-200" />
          <div className="text-center">
            <p className="mb-1 text-sm font-medium text-gray-500">Completed Orders</p>
            <h3 className="text-2xl font-extrabold text-gray-800">{deliveredOrders.length}</h3>
          </div>
          <div className="h-10 w-px bg-gray-200" />
          <div className="text-center">
            <p className="mb-1 text-sm font-medium text-gray-500">Delivery Earnings</p>
=======
      <div className="max-w-4xl mx-auto px-4 -mt-8">
        <div className="bg-white rounded-3xl shadow-xl p-6 flex justify-around items-center border border-gray-100">
          <div className="text-center">
            <p className="text-gray-500 text-sm font-medium mb-1">Available Orders</p>
            <h3 className="text-2xl font-extrabold text-gray-800">{availableOrders.length}</h3>
          </div>
          <div className="h-10 w-[1px] bg-gray-200"></div>
          <div className="text-center">
            <p className="text-gray-500 text-sm font-medium mb-1">Completed Orders</p>
            <h3 className="text-2xl font-extrabold text-gray-800">{deliveredOrders.length}</h3>
          </div>
          <div className="h-10 w-[1px] bg-gray-200"></div>
          <div className="text-center">
            <p className="text-gray-500 text-sm font-medium mb-1">Delivery Earnings</p>
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
            <h3 className="text-2xl font-extrabold text-gray-800">{formatCurrency(earnings)}</h3>
          </div>
        </div>
      </div>

<<<<<<< HEAD
      <div className="mx-auto mt-6 max-w-4xl space-y-6 px-4">
        {message ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
        {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <h3 className="mb-4 text-xl font-bold text-slate-900">Orders in your area</h3>
          {loading ? (
            <p className="text-slate-500">Loading orders...</p>
          ) : !isOnline ? (
            <p className="text-slate-500">Go online to receive new orders from your area.</p>
          ) : availableOrders.length === 0 ? (
            <p className="text-slate-500">No new orders available right now.</p>
=======
      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        {message ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
        {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <section className="bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Available for pickup</h3>
          {loading ? (
            <p className="text-slate-500">Loading orders...</p>
          ) : availableOrders.length === 0 ? (
            <p className="text-slate-500">No pickup-ready orders right now.</p>
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
          ) : (
            <div className="space-y-4">
              {availableOrders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-900">{order.restaurant?.name}</h4>
<<<<<<< HEAD
                      <p className="text-sm text-slate-600">{formatRestaurantAddress(order.restaurant)}</p>
                      <p className="text-sm text-slate-500">
                        {order.status === "READY_FOR_PICKUP" ? "Order ready for pickup" : "Restaurant has accepted this order"}
                      </p>
=======
                      <p className="text-sm text-slate-600">{order.address?.line1 || "Address pending"}</p>
                      <p className="text-sm text-slate-500">{order.customer?.name}</p>
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
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
<<<<<<< HEAD
                    {renderPrimaryAction(order)}
=======
                    <button
                      onClick={() => handleStatusUpdate(order.id, "OUT_FOR_DELIVERY")}
                      className="rounded-full bg-indigo-700 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Accept Delivery
                    </button>
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

<<<<<<< HEAD
        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <h3 className="mb-4 text-xl font-bold text-slate-900">Active deliveries</h3>
=======
        <section className="bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Active deliveries</h3>
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
          {activeOrders.length === 0 ? (
            <p className="text-slate-500">No active deliveries yet.</p>
          ) : (
            <div className="space-y-4">
<<<<<<< HEAD
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
                  </div>
                );
              })}
=======
              {activeOrders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-900">{order.restaurant?.name}</h4>
                      <p className="text-sm text-slate-600">{order.address?.line1 || "Address pending"}</p>
                      <p className="text-sm text-slate-500">{order.customer?.name}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(order.totalAmount)}</div>
                      <div className="text-xs text-slate-500">{order.status.replaceAll("_", " ")}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(order.id, "DELIVERED")}
                      className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Mark Delivered
                    </button>
                  </div>
                </div>
              ))}
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
            </div>
          )}
        </section>
      </div>

      {selectedOrder ? (
<<<<<<< HEAD
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-2xl">
            <RiderMap
              pickup={{
                lat: selectedOrder.restaurant?.latitude,
                lng: selectedOrder.restaurant?.longitude,
              }}
              drop={
                selectedOrder.status === "OUT_FOR_DELIVERY"
                  ? {
                      lat: selectedOrder.address?.latitude,
                      lng: selectedOrder.address?.longitude,
                    }
                  : null
              }
              rider={riderLocation}
            />

            <div className="mb-4 flex items-start justify-between">
              <div>
                <span className="rounded bg-indigo-100 px-2 py-1 text-xs font-bold text-indigo-700">
                  {selectedOrder.isAvailable ? "AVAILABLE ORDER" : "ASSIGNED ORDER"}
                </span>
                <h4 className="mt-2 text-xl font-black text-gray-800">{selectedOrder.restaurant?.name}</h4>
              </div>
              <p className="font-bold text-green-600">{formatCurrency(selectedOrder.deliveryFee)}</p>
            </div>

            <div className="mb-6 space-y-4">
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

=======
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded">
                  {selectedOrder.isAvailable ? "AVAILABLE ORDER" : "ACTIVE ORDER"}
                </span>
                <h4 className="text-xl font-black mt-2 text-gray-800">{selectedOrder.restaurant?.name}</h4>
              </div>
              <p className="text-green-600 font-bold">{formatCurrency(selectedOrder.deliveryFee)}</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm font-bold text-gray-800">{selectedOrder.customer?.name}</p>
                <p className="text-xs text-gray-500">{selectedOrder.customer?.phone}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-bold text-gray-800">{selectedOrder.address?.line1 || "Address pending"}</p>
                <p className="text-xs text-gray-500">{selectedOrder.address?.city}</p>
              </div>
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
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
<<<<<<< HEAD
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
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-1/3 rounded-2xl bg-gray-100 py-4 font-bold text-gray-600 transition hover:bg-gray-200"
              >
                Close
              </button>
            </div>

            {renderPrimaryAction(selectedOrder, true)}
=======
                onClick={() => setSelectedOrder(null)}
                className="w-1/3 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-200 transition"
              >
                Close
              </button>
              {selectedOrder.isAvailable ? (
                <button
                  onClick={() => handleStatusUpdate(selectedOrder.id, "OUT_FOR_DELIVERY")}
                  className="w-2/3 bg-indigo-700 text-white py-4 rounded-2xl font-bold hover:bg-indigo-800 transition"
                >
                  Accept Order
                </button>
              ) : (
                <button
                  onClick={() => handleStatusUpdate(selectedOrder.id, "DELIVERED")}
                  className="w-2/3 bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition"
                >
                  Mark Delivered
                </button>
              )}
            </div>
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
          </div>
        </div>
      ) : null}

      <RiderNavbar />
    </div>
  );
};

export default RiderDashboard;
