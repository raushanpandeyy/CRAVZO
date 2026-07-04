import React, { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { MessageCircle } from "lucide-react";

import { getRiderOrders, updateOrderStatus } from "../../services/orderService.js";
import { updateRiderLocation, updateRiderStatus } from "../../services/riderService.js";
import { getProfile } from "../../services/userService.js";
import { onNewOrder, onOrderStatusUpdate } from "../../services/chatSocket.js";

const OrderRequestPopup = lazy(() => import("../../components/OrderRequestPopup.jsx"));
const RiderMap = lazy(() => import("./LazyRiderMap.jsx"));
const OrderChatModal = lazy(() => import("../../components/OrderChatModal.jsx"));

const formatCurrency = (amount) => `Rs ${Math.floor(amount || 0)}`;

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
  const [riderLocation, setRiderLocation] = useState(null);
  const [orderRequest, setOrderRequest] = useState(null);
  const [showRequest, setShowRequest] = useState(false);
  const firstLoadRef = useRef(true);
  const availableIdsRef = useRef([]);
  const lastLocationSyncRef = useRef({ lat: null, lng: null, syncedAt: 0 });
  const isOnlineRef = useRef(false);
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
          const latestOrder = data.find(o => o.isAvailable);
          if (latestOrder) {
            setOrderRequest(latestOrder);
            setShowRequest(true);
            
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("Dodago - New Order!", {
                body: `${latestOrder.restaurant?.name || "New order"} - Earn ₹${Math.floor(latestOrder.deliveryFee || 0)}`,
                icon: "/dodagologo.png",
                tag: "new-order",
                requireInteraction: true,
              });
            }
          }
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
                body: `${latestOrder.restaurant?.name || "New order"} - Earn ₹${Math.floor(latestOrder.deliveryFee || 0)}`,
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

    // Real-time order updates via Socket.IO — replaces 45s polling
    const cleanups = [
      onNewOrder((data) => {
        setOrderRequest(data);
        setShowRequest(true);
      }),
      onOrderStatusUpdate(({ orderId }) => {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
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
            .catch(() => { });
        }
      },
      () => { },
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
    [orders],
  );
  const deliveredOrders = useMemo(() => orders.filter((order) => order.status === "DELIVERED"), [orders]);
  const earnings = useMemo(
    () => deliveredOrders.reduce((sum, order) => sum + Number(order.deliveryFee || 0), 0),
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
            <h3 className="text-2xl font-extrabold text-gray-800">{formatCurrency(earnings)}</h3>
          </div>
        </div>
      </div>

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
