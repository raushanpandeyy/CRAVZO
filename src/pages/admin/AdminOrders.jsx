import React, { useState, useEffect } from "react";
import { Search, CalendarRange, X } from "lucide-react";
import { API_ENDPOINTS } from "../../constants/apiEndpoints.js";
import { apiRequest } from "../../services/api.js";
import { onAdminOrderAlert } from "../../services/chatSocket.js";

const formatCurrency = (amount) => `Rs ${Number(amount || 0).toFixed(0)}`;

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [liveAlert, setLiveAlert] = useState(null);
  const [refundAction, setRefundAction] = useState(false);
  const [refundError, setRefundError] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await apiRequest(
        API_ENDPOINTS.admin.overview({
          page,
          limit: 10,
          from: fromDate,
          to: toDate,
          status: statusFilter,
        })
      );
      setOrders(response.data?.recentOrders || []);
      setTotalPages(response.meta?.recentOrders?.totalPages || 1);
    } catch (err) {
      console.error("Failed to load orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page, fromDate, toDate, statusFilter]);

  useEffect(() => {
    const unsubscribe = onAdminOrderAlert((alert) => {
      setLiveAlert(alert);

      if (alert.order) {
        setOrders((currentOrders) => {
          const exists = currentOrders.some((order) => order.id === alert.order.id);
          if (!exists) return [alert.order, ...currentOrders].slice(0, 10);

          return currentOrders.map((order) =>
            order.id === alert.order.id
              ? {
                  ...order,
                  ...alert.order,
                  customer: alert.order.customer || order.customer,
                  restaurant: alert.order.restaurant || order.restaurant,
                  rider: alert.order.rider || order.rider,
                }
              : order,
          );
        });

        setSelectedOrder((currentOrder) =>
          currentOrder?.id === alert.order.id
            ? {
                ...currentOrder,
                ...alert.order,
                customer: alert.order.customer || currentOrder.customer,
                restaurant: alert.order.restaurant || currentOrder.restaurant,
                rider: alert.order.rider || currentOrder.rider,
              }
            : currentOrder,
        );
      }
    });

    return unsubscribe;
  }, []);

  const runRefundAction = async (action) => {
    if (!selectedOrder || refundAction) return;
    const isInitiate = action === "initiate";
    if (isInitiate && !window.confirm(`Initiate an irreversible refund of ${formatCurrency(selectedOrder.refundAmount ?? selectedOrder.totalAmount)}?`)) return;

    setRefundAction(true);
    setRefundError("");
    try {
      const response = await apiRequest(
        isInitiate
          ? API_ENDPOINTS.admin.initiateRefund(selectedOrder.id)
          : API_ENDPOINTS.admin.reconcileRefund(selectedOrder.id),
        {
          method: "POST",
          body: JSON.stringify(isInitiate ? { confirmation: "REFUND" } : {}),
          skipCache: true,
        },
      );
      const updated = response.data;
      setSelectedOrder((current) => ({ ...current, ...updated }));
      setOrders((current) => current.map((order) => order.id === updated.id ? { ...order, ...updated } : order));
    } catch (err) {
      setRefundError(err.message || "Refund action failed");
    } finally {
      setRefundAction(false);
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "DELIVERED": return "bg-emerald-50 text-emerald-700";
      case "CANCELLED": return "bg-red-50 text-red-700";
      case "OUT_FOR_DELIVERY": return "bg-blue-50 text-blue-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-20 md:pb-4">
      <div className="mx-2 md:mx-0 bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-4 md:p-6 text-white">
        <h1 className="text-xl md:text-2xl font-bold">Orders</h1>
        <p className="text-indigo-200 text-sm">Manage customer orders</p>
      </div>

      {liveAlert?.severity === "danger" && (
        <div className="mx-2 rounded-lg border-2 border-red-500 bg-red-600 p-4 text-white shadow-xl md:mx-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase">Urgent order alert</p>
              <p className="mt-1 text-lg font-black">{liveAlert.title}</p>
              <p className="mt-1 text-sm text-red-50">{liveAlert.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setLiveAlert(null)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-700 hover:bg-red-800"
              aria-label="Dismiss urgent order alert"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mx-2 md:mx-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm overflow-x-auto [scrollbar-width:none]">
        <div className="flex gap-2 min-w-max">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => { setPage(1); setFromDate(e.target.value); }}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => { setPage(1); setToDate(e.target.value); }}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="PREPARING">Preparing</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="mx-2 md:mx-0 space-y-3">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">No orders found</div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2 gap-2">
                <div className="min-w-0">
                  <p className="font-black text-slate-900">#{order.id.slice(-6)}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    👤 {order.customer?.name || "Customer"} &nbsp;·&nbsp; 🏪 {order.restaurant?.name || "Restaurant"}
                  </p>
                  {order.rider ? (
                    <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                      🛵 {order.rider.name}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-500 font-semibold mt-0.5">🛵 No rider yet</p>
                  )}
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${getStatusColor(order.status)}`}>
                  {order.status.replaceAll("_", " ")}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 mt-2 pt-2 border-t border-slate-100">
                <span className="font-semibold">{formatCurrency(order.totalAmount)}</span>
                <span className="text-slate-400">
                  {order.createdAt ? new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}
                </span>
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  View Details →
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mx-2 md:mx-0 flex items-center justify-between py-2 px-4 bg-white rounded-2xl border border-slate-200">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            className="text-sm font-semibold text-slate-600 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
            className="text-sm font-semibold text-slate-600 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(e) => e.target === e.currentTarget && setSelectedOrder(null)}>
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Order #{selectedOrder.id.slice(-6)}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status.replaceAll("_", " ")}
                </span>
                <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4 text-sm">

              {/* ── 3-column overview ── */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-indigo-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-black uppercase text-indigo-500 tracking-wide">Amount</p>
                  <p className="text-lg font-black text-indigo-700 mt-1">{formatCurrency(selectedOrder.totalAmount)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-wide">Payment</p>
                  <p className="text-sm font-bold text-slate-700 mt-1">{selectedOrder.paymentMethod || "—"}</p>
                  <p className={`text-[10px] font-bold mt-0.5 ${selectedOrder.paymentStatus === "PAID" ? "text-emerald-600" : "text-amber-600"}`}>{selectedOrder.paymentStatus}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-wide">Distance</p>
                  <p className="text-sm font-bold text-slate-700 mt-1">
                    {selectedOrder.deliveryDistance ? `${Number(selectedOrder.deliveryDistance).toFixed(1)} km` : "—"}
                  </p>
                </div>
              </div>

              {/* ── Customer ── */}
              <div className="rounded-xl border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                  <p className="text-[11px] font-black uppercase text-slate-500 tracking-wide">👤 Customer</p>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{selectedOrder.customer?.name || "Unknown"}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{selectedOrder.customer?.phone || "No phone"}</p>
                  </div>
                  {selectedOrder.customer?.phone && (
                    <a href={`tel:${selectedOrder.customer.phone}`} className="text-indigo-600 font-semibold text-xs px-3 py-1.5 bg-indigo-50 rounded-lg hover:bg-indigo-100">
                      Call
                    </a>
                  )}
                </div>
              </div>

              {/* ── Restaurant ── */}
              <div className="rounded-xl border border-slate-100 overflow-hidden">
                <div className="bg-orange-50 px-4 py-2 border-b border-orange-100">
                  <p className="text-[11px] font-black uppercase text-orange-600 tracking-wide">🏪 Restaurant</p>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{selectedOrder.restaurant?.name || "Unknown"}</p>
                    <p className="text-slate-500 text-xs mt-0.5">Vendor: {selectedOrder.restaurant?.vendor?.name || "—"}</p>
                    {selectedOrder.restaurant?.vendor?.phone && (
                      <p className="text-slate-500 text-xs">{selectedOrder.restaurant.vendor.phone}</p>
                    )}
                  </div>
                  {selectedOrder.restaurant?.vendor?.phone && (
                    <a href={`tel:${selectedOrder.restaurant.vendor.phone}`} className="text-orange-600 font-semibold text-xs px-3 py-1.5 bg-orange-50 rounded-lg hover:bg-orange-100">
                      Call
                    </a>
                  )}
                </div>
              </div>

              {/* ── Rider ── */}
              <div className="rounded-xl border border-slate-100 overflow-hidden">
                <div className={`px-4 py-2 border-b ${selectedOrder.rider ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100"}`}>
                  <p className={`text-[11px] font-black uppercase tracking-wide ${selectedOrder.rider ? "text-emerald-600" : "text-slate-500"}`}>
                    🛵 Rider {selectedOrder.rider ? "Assigned" : "— Not Assigned Yet"}
                  </p>
                </div>
                {selectedOrder.rider ? (
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{selectedOrder.rider.name}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{selectedOrder.rider.phone || "No phone"}</p>
                    </div>
                    {selectedOrder.rider.phone && (
                      <a href={`tel:${selectedOrder.rider.phone}`} className="text-emerald-600 font-semibold text-xs px-3 py-1.5 bg-emerald-50 rounded-lg hover:bg-emerald-100">
                        Call
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="px-4 py-3">
                    <p className="text-slate-400 text-xs italic">
                      {["PENDING", "ACCEPTED", "PREPARING"].includes(selectedOrder.status)
                        ? "Waiting for restaurant to confirm before assigning a rider."
                        : "No rider was assigned to this order."}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Order Items ── */}
              {selectedOrder.items?.length > 0 && (
                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                    <p className="text-[11px] font-black uppercase text-slate-500 tracking-wide">🍽️ Order Items ({selectedOrder.items.length})</p>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={item.id || idx} className="px-4 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black flex items-center justify-center">
                            {item.quantity || 1}
                          </span>
                          <span className="font-medium text-slate-800 truncate">
                            {item.menuItem?.name || item.name || `Item ${idx + 1}`}
                          </span>
                        </div>
                        <span className="text-slate-600 font-semibold flex-shrink-0 ml-2">
                          {item.price ? formatCurrency(Number(item.price) * (item.quantity || 1)) : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Delivery Address ── */}
              {selectedOrder.address && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                  <p className="text-[11px] font-black uppercase text-blue-600 tracking-wide mb-1">📍 Delivery Address</p>
                  <p className="text-slate-700 font-medium leading-snug">
                    {[
                      selectedOrder.address.addressLine1,
                      selectedOrder.address.addressLine2,
                      selectedOrder.address.city,
                      selectedOrder.address.state,
                      selectedOrder.address.postalCode,
                    ].filter(Boolean).join(", ")}
                  </p>
                </div>
              )}

              {/* ── Fee Breakdown ── */}
              <div className="rounded-xl border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                  <p className="text-[11px] font-black uppercase text-slate-500 tracking-wide">💰 Fee Breakdown</p>
                </div>
                <div className="px-4 py-3 space-y-1.5">
                  {[
                    ["Subtotal",      selectedOrder.subtotal],
                    ["Delivery Fee",  selectedOrder.deliveryFee],
                    ["Packaging",     selectedOrder.packagingFee],
                    ["Tax",           selectedOrder.totalTax],
                    ["Platform Fee",  selectedOrder.platformFee],
                    ["Gateway Fee",   selectedOrder.gatewayFee],
                    ["COD Charge",    selectedOrder.codCharge],
                    ["Discount",      selectedOrder.discount ? -Number(selectedOrder.discount) : null],
                    ["Tip",           selectedOrder.tipAmount],
                  ]
                    .filter(([, v]) => v != null && Number(v) !== 0)
                    .map(([label, val]) => (
                      <div key={label} className="flex justify-between text-slate-600">
                        <span>{label}</span>
                        <span className={`font-semibold ${Number(val) < 0 ? "text-emerald-600" : ""}`}>
                          {Number(val) < 0 ? `− ${formatCurrency(Math.abs(val))}` : formatCurrency(val)}
                        </span>
                      </div>
                    ))
                  }
                  <div className="flex justify-between font-black text-slate-900 pt-1.5 border-t border-slate-200 mt-1">
                    <span>Total</span>
                    <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* ── Timestamps ── */}
              <div className="rounded-xl border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                  <p className="text-[11px] font-black uppercase text-slate-500 tracking-wide">🕐 Timeline</p>
                </div>
                <div className="px-4 py-3 space-y-1.5">
                  {[
                    ["Placed",       selectedOrder.createdAt],
                    ["Accepted",     selectedOrder.acceptedAt],
                    ["Preparing",    selectedOrder.preparingAt],
                    ["Picked Up",    selectedOrder.pickedUpAt],
                    ["Delivered",    selectedOrder.deliveredAt],
                    ["Cancelled",    selectedOrder.cancelledAt],
                  ]
                    .filter(([, v]) => v)
                    .map(([label, ts]) => (
                      <div key={label} className="flex justify-between text-slate-600">
                        <span className="text-slate-500">{label}</span>
                        <span className="font-semibold">
                          {new Date(ts).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))
                  }
                  {selectedOrder.cancelledByRole && (
                    <div className="flex justify-between text-slate-600">
                      <span className="text-slate-500">Cancelled by</span>
                      <span className="font-semibold text-rose-600">{selectedOrder.cancelledByRole}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Special instructions ── */}
              {selectedOrder.restaurantInstructions && (
                <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                  <p className="text-[11px] font-black uppercase text-amber-600 tracking-wide mb-1">📝 Restaurant Instructions</p>
                  <p className="text-amber-800">{selectedOrder.restaurantInstructions}</p>
                </div>
              )}
              {selectedOrder.deliveryInstructions && (
                <div className="rounded-xl bg-sky-50 border border-sky-100 px-4 py-3">
                  <p className="text-[11px] font-black uppercase text-sky-600 tracking-wide mb-1">📝 Delivery Instructions</p>
                  <p className="text-sky-800">{selectedOrder.deliveryInstructions}</p>
                </div>
              )}

              {/* ── Refund ── */}
              {(selectedOrder.refundId || selectedOrder.refundAmount) && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-[11px] font-black uppercase text-amber-700 tracking-wide mb-1">↩ Refund</p>
                  <p className="text-amber-900 font-semibold">{formatCurrency(selectedOrder.refundAmount)} · {selectedOrder.refundStatus || selectedOrder.paymentStatus}</p>
                  {selectedOrder.refundId && <p className="text-amber-700 text-xs mt-1 break-all">{selectedOrder.refundId}</p>}
                </div>
              )}
              {refundError && <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-rose-700">{refundError}</div>}
            </div>

            {/* Refund action buttons at bottom */}
            {(selectedOrder.status === "CANCELLED" && selectedOrder.paymentMethod !== "COD" && selectedOrder.paymentStatus === "PAID" && !selectedOrder.refundId) || selectedOrder.refundId ? (
              <div className="px-5 pb-5 pt-3 border-t border-slate-100">
                {selectedOrder.status === "CANCELLED" && !selectedOrder.refundId && (
                  <button type="button" disabled={refundAction} onClick={() => runRefundAction("initiate")}
                    className="w-full rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-3 font-bold text-white disabled:opacity-50 transition-colors">
                    {refundAction ? "Processing..." : `Initiate Refund — ${formatCurrency(selectedOrder.refundAmount ?? selectedOrder.totalAmount)}`}
                  </button>
                )}
                {selectedOrder.refundId && (
                  <button type="button" disabled={refundAction} onClick={() => runRefundAction("reconcile")}
                    className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-3 font-bold text-white disabled:opacity-50 transition-colors">
                    {refundAction ? "Checking Razorpay..." : "Reconcile with Razorpay"}
                  </button>
                )}
              </div>
            ) : null}

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
