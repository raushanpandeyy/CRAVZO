import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChefHat, Clock3, Printer, RefreshCw } from "lucide-react";

import { getVendorOrders, updateOrderStatus } from "../../services/orderService.js";
import { onNewOrder, onOrderStatusUpdate } from "../../services/chatSocket.js";
import { printOrderDocument } from "../../utils/orderPrint.js";
import { SkeletonRow } from "../../components/Skeleton.jsx";

const columns = [
  { status: "PENDING", title: "New", action: "Accept", next: "ACCEPTED", accent: "orange" },
  { status: "ACCEPTED", title: "Accepted", action: "Start", next: "PREPARING", accent: "blue" },
  { status: "PREPARING", title: "Preparing", action: "Ready", next: "READY_FOR_PICKUP", accent: "indigo" },
  { status: "READY_FOR_PICKUP", title: "Ready", action: null, next: null, accent: "emerald" },
];

const activeStatuses = columns.map((column) => column.status);
const accentClass = {
  orange: "border-orange-200 bg-orange-50 text-orange-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const formatTime = (value) => new Date(value).toLocaleTimeString("en-IN", {
  hour: "numeric",
  minute: "2-digit",
});

const minutesSince = (value) => Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));

const KitchenOrderCard = ({ order, column, onAdvance }) => {
  const instructionText = [order.restaurantInstructions, order.notes].filter(Boolean).join(" | ");

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-black text-slate-950">#{order.id.slice(-6)}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{formatTime(order.createdAt)} · {minutesSince(order.createdAt)} min</p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${accentClass[column.accent]}`}>
          {order.status.replaceAll("_", " ")}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {(order.items || []).map((item) => (
          <div key={item.id} className="rounded-xl bg-slate-50 p-3">
            <div className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-950 text-sm font-black text-white">
                {item.quantity}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-black text-slate-900">{item.menuItem?.name || item.name || "Item"}</p>
                {item.size ? <p className="text-xs font-bold text-indigo-600">Size: {item.size}</p> : null}
                {item.selectedSideDishes?.length ? (
                  <p className="mt-1 text-xs font-semibold text-amber-700">
                    Side: {item.selectedSideDishes.map((sd) => sd.name).join(", ")}
                  </p>
                ) : null}
                {item.notes ? <p className="mt-1 text-xs font-bold text-slate-600">Note: {item.notes}</p> : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {instructionText ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">
          {instructionText}
        </div>
      ) : null}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => printOrderDocument(order, "kitchen")}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200"
        >
          <Printer className="h-4 w-4" />
          Ticket
        </button>
        {column.next ? (
          <button
            type="button"
            onClick={() => onAdvance(order.id, column.next)}
            className="flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-black text-white hover:bg-indigo-700"
          >
            {column.action}
          </button>
        ) : null}
      </div>
    </article>
  );
};

const KitchenDisplay = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getVendorOrders({ skipCache: true });
      setOrders((data.orders || []).filter((order) => activeStatuses.includes(order.status)));
    } catch (requestError) {
      setError(requestError.message || "Failed to load kitchen orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    const cleanups = [
      onNewOrder((order) => {
        setOrders((current) => [order, ...current.filter((entry) => entry.id !== order.id)]);
      }),
      onOrderStatusUpdate(({ orderId, status }) => {
        setOrders((current) => current
          .map((order) => (order.id === orderId ? { ...order, status } : order))
          .filter((order) => activeStatuses.includes(order.status)));
      }),
    ];
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [loadOrders]);

  const groupedOrders = useMemo(() => {
    const grouped = Object.fromEntries(columns.map((column) => [column.status, []]));
    for (const order of orders) {
      if (grouped[order.status]) grouped[order.status].push(order);
    }
    return grouped;
  }, [orders]);

  const handleAdvance = async (orderId, status) => {
    setMessage("");
    setError("");
    try {
      await updateOrderStatus(orderId, status);
      setOrders((current) => current
        .map((order) => (order.id === orderId ? { ...order, status } : order))
        .filter((order) => activeStatuses.includes(order.status)));
      setMessage("Kitchen status updated.");
    } catch (requestError) {
      setError(requestError.message || "Failed to update order");
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] px-4 py-4 md:px-6 md:py-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-950 text-white">
              <ChefHat className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-3xl font-black text-slate-950 md:text-4xl">Kitchen Display</h1>
              <p className="text-sm text-slate-500">Live prep board for active restaurant orders.</p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={loadOrders}
          className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {message ? <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</div> : null}
      {error ? <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {columns.map((column) => (
          <div key={column.status} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase text-slate-500">{column.title}</p>
            <p className="mt-1 flex items-center gap-2 text-2xl font-black text-slate-950">
              {groupedOrders[column.status]?.length || 0}
              <Clock3 className="h-4 w-4 text-slate-400" />
            </p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4"><SkeletonRow /><SkeletonRow /><SkeletonRow /></div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-4">
          {columns.map((column) => (
            <section key={column.status} className="min-h-80 rounded-3xl border border-slate-200 bg-white/60 p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-black uppercase tracking-wide text-slate-700">{column.title}</h2>
                <span className={`rounded-full border px-2 py-0.5 text-xs font-black ${accentClass[column.accent]}`}>
                  {groupedOrders[column.status]?.length || 0}
                </span>
              </div>
              <div className="space-y-3">
                {(groupedOrders[column.status] || []).map((order) => (
                  <KitchenOrderCard key={order.id} order={order} column={column} onAdvance={handleAdvance} />
                ))}
                {!groupedOrders[column.status]?.length ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm font-bold text-slate-400">
                    No orders
                  </div>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default KitchenDisplay;
