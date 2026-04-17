import React, { useEffect, useMemo, useState } from "react";

import RiderNavbar from "./RiderNav";
import { getRiderOrders, updateOrderStatus } from "../../services/orderService";

const formatCurrency = (amount) => `₹${Number(amount || 0).toFixed(0)}`;

const RiderDashboard = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getRiderOrders();
      setOrders(data);
    } catch (requestError) {
      setError(requestError.message || "Failed to load rider orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const availableOrders = useMemo(() => orders.filter((order) => order.isAvailable), [orders]);
  const activeOrders = useMemo(
    () => orders.filter((order) => ["OUT_FOR_DELIVERY"].includes(order.status) && !order.isAvailable),
    [orders],
  );
  const deliveredOrders = useMemo(() => orders.filter((order) => order.status === "DELIVERED"), [orders]);
  const earnings = useMemo(
    () => deliveredOrders.reduce((sum, order) => sum + Number(order.deliveryFee || 0), 0),
    [deliveredOrders],
  );

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
              <span className="text-2xl">R</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">Rider Console</h2>
              <p className="text-indigo-200 text-sm font-medium uppercase tracking-wider">
                Live delivery queue
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${isOnline ? "bg-green-400" : "bg-red-400"}`}>
              {isOnline ? "ONLINE" : "OFFLINE"}
            </span>
            <button onClick={() => setIsOnline(!isOnline)} className="mt-2 text-xs underline opacity-80">
              Go {isOnline ? "Offline" : "Online"}
            </button>
          </div>
        </div>
      </div>

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
            <h3 className="text-2xl font-extrabold text-gray-800">{formatCurrency(earnings)}</h3>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        {message ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
        {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <section className="bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Available for pickup</h3>
          {loading ? (
            <p className="text-slate-500">Loading orders...</p>
          ) : availableOrders.length === 0 ? (
            <p className="text-slate-500">No pickup-ready orders right now.</p>
          ) : (
            <div className="space-y-4">
              {availableOrders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-900">{order.restaurant?.name}</h4>
                      <p className="text-sm text-slate-600">{order.address?.line1 || "Address pending"}</p>
                      <p className="text-sm text-slate-500">{order.customer?.name}</p>
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
                    <button
                      onClick={() => handleStatusUpdate(order.id, "OUT_FOR_DELIVERY")}
                      className="rounded-full bg-indigo-700 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Accept Delivery
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Active deliveries</h3>
          {activeOrders.length === 0 ? (
            <p className="text-slate-500">No active deliveries yet.</p>
          ) : (
            <div className="space-y-4">
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
            </div>
          )}
        </section>
      </div>

      {selectedOrder ? (
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
          </div>
        </div>
      ) : null}

      <RiderNavbar />
    </div>
  );
};

export default RiderDashboard;
