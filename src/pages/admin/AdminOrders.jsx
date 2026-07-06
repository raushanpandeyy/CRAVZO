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
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-slate-900">#{order.id.slice(-6)}</p>
                  <p className="text-xs text-slate-500">{order.customer?.name || "Customer"} Ã¢â‚¬Â¢ {order.restaurant?.name || "Restaurant"}</p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${getStatusColor(order.status)}`}>
                  {order.status.replaceAll("_", " ")}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 mt-2">
                <span>Amount: {formatCurrency(order.totalAmount)}</span>
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="text-indigo-600 font-semibold"
                >
                  View
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Order #{selectedOrder.id.slice(-6)}</h3>
              <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="bg-slate-50 p-3 rounded-xl">
                <p className="font-semibold">Status</p>
                <p className="text-slate-600">{selectedOrder.status.replaceAll("_", " ")}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <p className="font-semibold">Payment</p>
                <p className="text-slate-600">{selectedOrder.paymentMethod} Ã¢â‚¬Â¢ {selectedOrder.paymentStatus}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <p className="font-semibold">Total</p>
                <p className="text-slate-900 font-bold">{formatCurrency(selectedOrder.totalAmount)}</p>
              </div>              {Number(selectedOrder.tipAmount || 0) > 0 ? <div className="rounded-xl bg-emerald-50 p-3 text-emerald-800"><p className="font-semibold">Rider tip</p><p className="font-bold">{formatCurrency(selectedOrder.tipAmount)}</p></div> : null}
              {selectedOrder.restaurantInstructions ? <div className="rounded-xl bg-amber-50 p-3"><p className="font-semibold text-amber-900">Restaurant instructions</p><p className="mt-1 text-amber-800">{selectedOrder.restaurantInstructions}</p></div> : null}
              {selectedOrder.deliveryInstructions ? <div className="rounded-xl bg-blue-50 p-3"><p className="font-semibold text-blue-900">Rider instructions</p><p className="mt-1 text-blue-800">{selectedOrder.deliveryInstructions}</p></div> : null}
              {selectedOrder.refundId || selectedOrder.refundAmount ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
                  <p className="font-semibold">Refund</p>
                  <p>{formatCurrency(selectedOrder.refundAmount)} â€¢ {selectedOrder.refundStatus || selectedOrder.paymentStatus}</p>
                  {selectedOrder.refundId ? <p className="mt-1 break-all text-xs">{selectedOrder.refundId}</p> : null}
                </div>
              ) : null}
              {refundError ? <div className="rounded-xl bg-rose-50 p-3 text-rose-700">{refundError}</div> : null}
              {selectedOrder.status === "CANCELLED" && selectedOrder.paymentMethod !== "COD" && selectedOrder.paymentStatus === "PAID" && !selectedOrder.refundId ? (
                <button type="button" disabled={refundAction} onClick={() => runRefundAction("initiate")} className="w-full rounded-xl bg-rose-600 px-4 py-3 font-bold text-white disabled:opacity-50">
                  {refundAction ? "Processing..." : "Initiate Refund"}
                </button>
              ) : null}
              {selectedOrder.refundId ? (
                <button type="button" disabled={refundAction} onClick={() => runRefundAction("reconcile")} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white disabled:opacity-50">
                  {refundAction ? "Checking Razorpay..." : "Reconcile with Razorpay"}
                </button>
              ) : null}
              <div className="p-3 rounded-xl">
                <p className="font-semibold">Customer</p>
                <p className="text-slate-600">{selectedOrder.customer?.name || "NA"}</p>
                <p className="text-xs text-slate-500">{selectedOrder.customer?.phone || "No phone"}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
