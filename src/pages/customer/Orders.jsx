import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock3, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import cart from "../../assets/logos/cart.png";
import SearchBar from "../../components/common/Searchbar.jsx";
import { cancelOrder, getMyOrders } from "../../services/orderService.js";

const formatCurrency = (value) => `Rs ${Number(value || 0).toFixed(0)}`;

export default function Orders() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadOrders = async () => {
    try {
      const data = await getMyOrders();
      setOrders(data);
    } catch (requestError) {
      console.error("Failed to load orders", requestError);
      setError(requestError.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const cancellableStatuses = ["PENDING", "ACCEPTED", "PREPARING", "READY_FOR_PICKUP"];

  const handleCancelOrder = async (event, orderId) => {
    event.preventDefault();
    event.stopPropagation();
    setMessage("");
    setError("");

    try {
      await cancelOrder(orderId);
      setMessage("Order cancelled successfully.");
      await loadOrders();
    } catch (requestError) {
      setError(requestError.message || "Failed to cancel order");
    }
  };

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const items = order.items?.map((item) => item.menuItem?.name || "").join(" ");
        return (
          (order.restaurant?.name || "").toLowerCase().includes(search.toLowerCase()) ||
          items.toLowerCase().includes(search.toLowerCase())
        );
      }),
    [orders, search],
  );

  const getOrderItemsTotal = (order) =>
    order.items?.reduce((total, item) => total + Number(item.unitPrice || item.price || 0) * Number(item.quantity || 1), 0) || 0;

  return (
    <div className="min-h-screen bg-[#F4F7FB] px-4 py-4 sm:px-8 sm:py-8">
      <div className="mx-auto mb-5 w-full max-w-3xl">
        <SearchBar
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search orders, restaurants or dishes..."
          showResults={false}
        />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        {message ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
        {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        <div className="flex flex-col gap-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">My Orders</h1>
            <p className="mt-1 text-sm text-slate-500">Tap any order card to see the full bill.</p>
          </div>
          <div className="inline-flex items-center gap-2 text-sm font-bold text-indigo-700">
            <Clock3 className="w-5 h-5" />
            Recent Orders
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold text-indigo-900 mb-2">Loading orders...</h2>
          </div>
        ) : orders.length > 0 ? (
          filteredOrders.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredOrders.map((order) => (
                <button
                  type="button"
                  onClick={() => setSelectedOrder(order)}
                  key={order.id}
                  className="group overflow-hidden rounded-3xl border border-slate-100 bg-white text-left shadow-sm transition-all duration-200 active:scale-[0.99] hover:shadow-md"
                >
                  <div className="relative h-36 overflow-hidden sm:h-40">
                    <img
                      src={order.restaurant?.imageUrl || cart}
                      alt={order.restaurant?.name || "Order"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-indigo-950 px-3 py-1 text-xs font-black text-white">
                      {order.status}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3 p-4">
                    <div>
                      <h2 className="line-clamp-1 text-lg font-black text-slate-950">{order.restaurant?.name || "Restaurant"}</h2>
                      <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                        {order.items?.map((item) => item.menuItem?.name).filter(Boolean).join(", ")}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      <span className="font-black text-slate-950">{formatCurrency(order.totalAmount)}</span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-bold text-amber-600">{order.paymentMethod}</div>
                      <div className="flex items-center gap-2">
                        {cancellableStatuses.includes(order.status) ? (
                          <button
                            onClick={(event) => handleCancelOrder(event, order.id)}
                            className="rounded-full bg-rose-600 px-3 py-2 text-xs font-bold text-white"
                          >
                            Cancel
                          </button>
                        ) : null}
                        <span className="inline-flex items-center gap-1 text-xs font-black text-indigo-700">
                          View Bill <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-md border border-gray-200">
              <img src={cart} alt="No Orders" className="w-60 mb-4 opacity-60" />
              <h2 className="text-2xl font-semibold text-indigo-900 mb-2">No matching orders</h2>
              <p className="text-gray-500">Try searching for another restaurant or dish.</p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-md border border-gray-200">
            <img src={cart} alt="No Orders" className="w-60 mb-4 opacity-60" />
            <h2 className="text-2xl font-semibold text-indigo-900 mb-2">No orders yet</h2>
            <p className="text-gray-500">Your order history will show up here once you place a meal.</p>
          </div>
        )}
      </div>

      {selectedOrder ? (
        <div className="fixed inset-0 z-[80] flex items-end bg-slate-950/45 px-3 pb-3 sm:items-center sm:justify-center sm:p-6">
          <div className="max-h-[86vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">Order Bill</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">{selectedOrder.restaurant?.name || "Restaurant"}</h2>
                <p className="mt-1 text-sm text-slate-500">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700"
                aria-label="Close bill"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {selectedOrder.items?.map((item) => (
                <div key={item.id} className="flex justify-between gap-3 rounded-2xl bg-slate-50 p-3 text-sm">
                  <div>
                    <p className="font-bold text-slate-900">{item.menuItem?.name || "Item"}</p>
                    <p className="mt-1 text-xs text-slate-500">Qty {item.quantity || 1}</p>
                  </div>
                  <p className="font-black text-slate-950">
                    {formatCurrency(Number(item.unitPrice || item.price || 0) * Number(item.quantity || 1))}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 rounded-3xl bg-indigo-950 p-4 text-white">
              <div className="flex justify-between text-sm text-indigo-100">
                <span>Items total</span>
                <span>{formatCurrency(getOrderItemsTotal(selectedOrder) || selectedOrder.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-indigo-100">
                <span>Payment</span>
                <span>{selectedOrder.paymentMethod || "Online"}</span>
              </div>
              <div className="border-t border-white/15 pt-3">
                <div className="flex justify-between text-xl font-black">
                  <span>Total paid</span>
                  <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(selectedOrder.restaurant?.id ? `/restaurant/${selectedOrder.restaurant.id}` : "/")}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-700 px-4 py-3 text-sm font-black text-white transition-all duration-200 active:scale-95"
            >
              Open Restaurant <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
