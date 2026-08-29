import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle, Clock, Eye, MessageCircle, Printer, ShoppingBag } from "lucide-react";

import { getVendorOrders, updateOrderStatus } from "../../services/orderService.js";
import { onNewOrder, onOrderStatusUpdate } from "../../services/chatSocket.js";
import { SkeletonRow } from "../../components/Skeleton.jsx";
import { printOrderDocument } from "../../utils/orderPrint.js";

const vendorStatusFlow = {
  PENDING: "ACCEPTED",
  ACCEPTED: "PREPARING",
  PREPARING: "READY_FOR_PICKUP",
};

const vendorStatusLabel = {
  PENDING: "Accept",
  ACCEPTED: "Start Preparing",
  PREPARING: "Mark Ready",
};

const formatCurrency = (amount) => `Rs ${Number(amount || 0).toFixed(0)}`;
const OrderChatModal = lazy(() => import("../../components/OrderChatModal.jsx"));
const riderChatClosedStatuses = ["DELIVERED", "CANCELLED", "REJECTED"];

const formatOrderTime = (value) =>
  new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

const OrderPanel = () => {
  const [orders, setOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [chatOrderState, setChatOrderState] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getVendorOrders({ skipCache: true });
      setOrders(Array.isArray(data?.orders) ? data.orders : []);
    } catch (requestError) {
      setError(requestError.message || "Failed to load vendor orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    const cleanups = [
      onNewOrder(() => {
        loadOrders();
      }),
      onOrderStatusUpdate(() => {
        loadOrders();
      }),
    ];
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    if (selectedStatus === "all") {
      return orders;
    }

    return orders.filter((order) => order.status === selectedStatus);
  }, [orders, selectedStatus]);

  const stats = useMemo(
    () => ({
      pending: orders.filter((order) => order.status === "PENDING").length,
      processing: orders.filter((order) => ["ACCEPTED", "PREPARING"].includes(order.status)).length,
      ready: orders.filter((order) => order.status === "READY_FOR_PICKUP").length,
    }),
    [orders],
  );

  const handleStatusUpdate = useCallback(async (orderId, status) => {
    setMessage("");
    setError("");

    try {
      await updateOrderStatus(orderId, status);
      setMessage("Order status updated successfully.");
      await loadOrders();
    } catch (requestError) {
      setError(requestError.message || "Failed to update order");
    }
  }, [loadOrders]);

  const canChatWithRider = (order) => Boolean(order.rider?.id) && !riderChatClosedStatuses.includes(order.status);

  return (
    <div className="px-6 py-6 bg-[#F4F7FB] min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Order Management</h1>
        <p className="text-gray-600 text-sm mt-1">Track real restaurant orders from the backend</p>
      </div>

      {message ? <div className="mb-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
      {error ? <div className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button
          onClick={() => setSelectedStatus("PENDING")}
          className="bg-white rounded-lg shadow-md p-6 text-left hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Pending Orders</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">{stats.pending}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </button>

        <button
          onClick={() => setSelectedStatus("ACCEPTED")}
          className="bg-white rounded-lg shadow-md p-6 text-left hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Processing Orders</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{stats.processing}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </button>

        <button
          onClick={() => setSelectedStatus("READY_FOR_PICKUP")}
          className="bg-white rounded-lg shadow-md p-6 text-left hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Ready For Pickup</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{stats.ready}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedStatus === "all" ? "All Orders" : selectedStatus.replaceAll("_", " ")}
          </h2>
          <button onClick={() => setSelectedStatus("all")} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            Show All
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3 gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">Order #{order.id.slice(-6)}</h3>
                    <p className="text-gray-600 text-sm">{order.customer?.name || "Customer"}</p>
                    {order.restaurant?.name ? (
                      <p className="mt-1 inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {order.restaurant.name}
                      </p>
                    ) : null}
                    <p className="text-gray-500 text-xs">{formatOrderTime(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatCurrency(order.totalAmount)}</p>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {order.status.replaceAll("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-1">Items:</p>
                  {order.items.map((item) => (
                    <div key={item.id} className="text-sm">
                      <p>{item.quantity}x {item.menuItem?.name} - {formatCurrency(item.unitPrice)}</p>
                      {item.selectedSideDishes && item.selectedSideDishes.length > 0 ? (
                        <p className="text-xs text-amber-600 ml-4">
                          + Side: {item.selectedSideDishes.map((sd) => `${sd.name} (${formatCurrency(Number(sd.price))})`).join(", ")}
                        </p>
                      ) : null}
                      {item.notes ? (
                        <p className="text-xs text-slate-500 italic ml-4">Note: {item.notes}</p>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    <p>{order.customer?.phone || "No phone"}</p>
                    <p>{order.address?.line1 || "No address available"}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => printOrderDocument(order, "bill")}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1 rounded text-sm flex items-center gap-1"
                    >
                      <Printer className="w-4 h-4" />
                      Bill
                    </button>
                    <button
                      onClick={() => printOrderDocument(order, "kitchen")}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-1 rounded text-sm flex items-center gap-1"
                    >
                      <Printer className="w-4 h-4" />
                      Ticket
                    </button>

                    {vendorStatusFlow[order.status] ? (
                      <button
                        onClick={() => handleStatusUpdate(order.id, vendorStatusFlow[order.status])}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm"
                      >
                        {vendorStatusLabel[order.status]}
                      </button>
                    ) : null}
                    <button
                      onClick={() => setChatOrderState({ order, chatType: "vendor" })}
                      className="flex items-center gap-1 rounded bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-700"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Customer Chat
                    </button>
                    {canChatWithRider(order) ? (
                      <button
                        onClick={() => setChatOrderState({ order, chatType: "rider" })}
                        className="flex items-center gap-1 rounded bg-slate-950 px-3 py-1 text-sm text-white hover:bg-slate-800"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Rider Chat
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}

            {!filteredOrders.length ? <div className="py-10 text-center text-gray-500">No orders found.</div> : null}
          </div>
        )}
      </div>

      {selectedOrder ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Order Details #{selectedOrder.id.slice(-6)}</h3>

            <div className="space-y-3 mb-4">
              <p><strong>Restaurant:</strong> {selectedOrder.restaurant?.name || "NA"}</p>
              <p><strong>Customer:</strong> {selectedOrder.customer?.name}</p>
              <p><strong>Phone:</strong> {selectedOrder.customer?.phone || "NA"}</p>
              <p><strong>Address:</strong> {selectedOrder.address?.line1 || "NA"}</p>
              <p><strong>Payment:</strong> {selectedOrder.paymentMethod}</p>
              <p><strong>Order Time:</strong> {formatOrderTime(selectedOrder.createdAt)}</p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Items:</h4>
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="text-sm">
                  <div className="flex justify-between">
                    <span>{item.quantity}x {item.menuItem?.name}</span>
                    <span>{formatCurrency(item.totalPrice)}</span>
                  </div>
                  {item.selectedSideDishes && item.selectedSideDishes.length > 0 ? (
                    <p className="text-xs text-amber-600 ml-4">
                      + Side: {item.selectedSideDishes.map((sd) => `${sd.name} (${formatCurrency(Number(sd.price))})`).join(", ")}
                    </p>
                  ) : null}
                  {item.notes ? (
                    <p className="text-xs text-slate-500 italic ml-4">Note: {item.notes}</p>
                  ) : null}
                </div>
              ))}
              <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                <span>Total:</span>
                <span>{formatCurrency(selectedOrder.totalAmount)}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setSelectedOrder(null)} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded">
                Close
              </button>
              {selectedOrder.customer?.phone ? (
                <button
                  onClick={() => {
                    window.location.href = `tel:${selectedOrder.customer.phone}`;
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
                >
                  Call Customer
                </button>
              ) : null}
              <button onClick={() => printOrderDocument(selectedOrder, "bill")} className="flex-1 rounded bg-indigo-600 py-2 text-white hover:bg-indigo-700">
                Print Bill
              </button>
              <button onClick={() => printOrderDocument(selectedOrder, "kitchen")} className="flex-1 rounded bg-amber-600 py-2 text-white hover:bg-amber-700">
                Print Ticket
              </button>
              <button onClick={() => setChatOrderState({ order: selectedOrder, chatType: "vendor" })} className="flex-1 rounded bg-emerald-600 py-2 text-white hover:bg-emerald-700">
                Customer Chat
              </button>
              {canChatWithRider(selectedOrder) ? (
                <button onClick={() => setChatOrderState({ order: selectedOrder, chatType: "rider" })} className="flex-1 rounded bg-slate-950 py-2 text-white hover:bg-slate-800">
                  Rider Chat
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {chatOrderState ? (
        <Suspense fallback={<div className="fixed inset-0 z-[90] bg-slate-950/40" />}>
          <OrderChatModal
            order={chatOrderState.order}
            onClose={() => setChatOrderState(null)}
            chatType={chatOrderState.chatType}
            title={chatOrderState.chatType === "vendor" ? `Chat with ${chatOrderState.order.customer?.name || "Customer"}` : "Rider Chat"}
            subtitle={chatOrderState.order.customer?.name ? `Customer: ${chatOrderState.order.customer.name}` : ""}
            participantName={chatOrderState.chatType === "vendor" ? chatOrderState.order.customer?.name || "Customer" : chatOrderState.order.rider?.name || "Rider"}
            disabledReason="Order chat is available only while the order is active."
          />
        </Suspense>
      ) : null}
    </div>
  );
};

export default OrderPanel;
