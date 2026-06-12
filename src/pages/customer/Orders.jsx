import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ArrowRight, Clock3, Loader2, MessageCircle, Star, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { cart } from "../../assets/images/logos.js";
import SearchBar from "../../components/common/Searchbar.jsx";
import OrderProgressBar from "../../components/OrderProgressBar.jsx";
import OrderCard from "../../components/OrderCard.jsx";
import { SkeletonCard } from "../../components/Skeleton.jsx";
import { cancelOrder, getMyOrders } from "../../services/orderService.js";
import { getCloudinaryUrl } from "../../utils/cloudinary.js";

const getOrderImage = (url, width = 400) => {
  if (!url) return null;
  if (url.includes("cloudinary.com")) return getCloudinaryUrl(url, { width, height: 160 });
  return url;
};

const formatCurrency = (value) => `Rs ${Number(value || 0).toFixed(0)}`;
const OrderChatModal = lazy(() => import("../../components/OrderChatModal.jsx"));
const OrderFeedbackModal = lazy(() => import("../../components/OrderFeedbackModal.jsx"));

const riderChatClosedStatuses = ["DELIVERED", "CANCELLED", "REJECTED"];
const SUBMITTED_KEY = "cravzo_feedback_submitted";
const DISMISSED_KEY = "cravzo_feedback_dismissed";

// Returns Set of order IDs the user has already submitted feedback for
const getSubmittedIds = () => {
  try { return new Set(JSON.parse(localStorage.getItem(SUBMITTED_KEY) || "[]")); }
  catch { return new Set(); }
};

// Returns Set of order IDs the user has dismissed the feedback prompt for
const getDismissedIds = () => {
  try { return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]")); }
  catch { return new Set(); }
};

// Mark an order as dismissed so the popup never auto-shows again
const markDismissed = (orderId) => {
  const ids = getDismissedIds();
  ids.add(orderId);
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
};

// Auto-polling interval for active orders (ms)
const POLL_INTERVAL_MS = 15000;

export default function Orders() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [chatOrder, setChatOrder] = useState(null);
  const [chatVendorOrder, setChatVendorOrder] = useState(null);
  const [cancelConfirmOrder, setCancelConfirmOrder] = useState(null);
  const [feedbackOrder, setFeedbackOrder] = useState(null);
  const [submittedIds, setSubmittedIds] = useState(getSubmittedIds);
  const [dismissedIds, setDismissedIds] = useState(getDismissedIds);

  // Track whether we've already auto-shown the popup this session
  const autoPopupShownRef = useRef(false);
  const pollingRef = useRef(null);

  const loadOrders = async (silent = false) => {
    try {
      const data = await getMyOrders();
      const orders = Array.isArray(data) ? data : (data?.orders ?? data?.data ?? []);
      setOrders(Array.isArray(orders) ? orders : []);
      return Array.isArray(orders) ? orders : [];
    } catch (requestError) {
      if (!silent) {
        console.error("Failed to load orders", requestError);
        setError(requestError.message || "Failed to load orders");
      }
      return null;
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Initial load — auto-show popup only once per session for the most recent unrated delivery
  useEffect(() => {
    const init = async () => {
      const data = await loadOrders(false);
      if (!data || autoPopupShownRef.current) return;

      const submitted = getSubmittedIds();
      const dismissed = getDismissedIds();

      // Find the most recent DELIVERED order that has neither been submitted nor dismissed
      const pending = data.find(
        (o) => o.status === "DELIVERED" && !submitted.has(o.id) && !dismissed.has(o.id),
      );

      if (pending) {
        autoPopupShownRef.current = true;
        setTimeout(() => setFeedbackOrder(pending), 800);
      }
    };

    init();
  }, []);

  // Auto-poll while active orders exist — pauses when tab is hidden to save data/battery
  useEffect(() => {
    const activeStatuses = ["PENDING", "ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"];
    const hasActive = orders.some((o) => activeStatuses.includes(o.status));

    if (!hasActive) return;

    const tick = async () => {
      // Skip polling when tab is backgrounded — saves mobile data
      if (document.visibilityState === "hidden") return;
      const fresh = await loadOrders(true);
      if (!fresh) return;
      setSelectedOrder((prev) => {
        if (!prev) return prev;
        return fresh.find((o) => o.id === prev.id) || prev;
      });
    };

    pollingRef.current = setInterval(tick, POLL_INTERVAL_MS);

    return () => clearInterval(pollingRef.current);
  }, [orders]);

  const calcCancelFee = (order) => {
    if (["PENDING", "ACCEPTED"].includes(order.status)) return 0;
    if (order.status === "PREPARING" && order.preparingAt) {
      const mins = (Date.now() - new Date(order.preparingAt).getTime()) / 60000;
      if (mins < 2) return 0;
      if (mins >= 10) return 20;
      return 15;
    }
    return 20;
  };

  const handleCancelRequest = useCallback((event, order) => {
    event.preventDefault();
    event.stopPropagation();
    setCancelConfirmOrder(order);
  }, []);

  const handleCancelConfirm = useCallback(async () => {
    if (!cancelConfirmOrder) return;
    setMessage("");
    setError("");
    try {
      const data = await cancelOrder(cancelConfirmOrder.id);
      const fee = data?.cancelFee;
      if (fee && fee > 0) {
        setMessage(`Order cancelled. ${data.cancelFeePercent}% fee deducted: ${formatCurrency(fee)}. Refund: ${formatCurrency(data.refundAmount)}`);
      } else {
        setMessage("Order cancelled successfully.");
      }
      setOrders((prev) =>
        prev.map((o) => (o.id === cancelConfirmOrder.id ? { ...o, status: "CANCELLED" } : o)),
      );
      setCancelConfirmOrder(null);
    } catch (requestError) {
      setError(requestError.message || "Failed to cancel order");
      setCancelConfirmOrder(null);
    }
  }, [cancelConfirmOrder]);

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const items = order.items?.map((item) => item.menuItem?.name || "").join(" ");
        return (
          (order.restaurant?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          items.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }),
    [orders, searchQuery],
  );

  const getOrderItemsTotal = (order) =>
    order.items?.reduce(
      (total, item) => total + Number(item.unitPrice || item.price || 0) * Number(item.quantity || 1),
      0,
    ) || 0;

  const canChatWithRider = useCallback(
    (order) => Boolean(order.rider?.id) && !riderChatClosedStatuses.includes(order.status),
    [],
  );

  const openRiderChat = useCallback((event, order) => {
    event.preventDefault();
    event.stopPropagation();
    setChatOrder(order);
  }, []);

  const canChatWithVendor = useCallback(
    (order) => Boolean(order.restaurant?.vendorId) && !riderChatClosedStatuses.includes(order.status),
    [],
  );

  const openVendorChat = useCallback((event, order) => {
    event.preventDefault();
    event.stopPropagation();
    setChatVendorOrder(order);
  }, []);

  const openFeedback = useCallback((event, order) => {
    event.preventDefault();
    event.stopPropagation();
    setFeedbackOrder(order);
  }, []);

  // Called when user submits feedback — mark submitted, update state
  const handleFeedbackSubmitted = () => {
    const updated = getSubmittedIds();
    setSubmittedIds(new Set(updated));
    setFeedbackOrder(null);
  };

  // Called when user taps "Skip for now" — mark dismissed so popup never auto-shows again
  const handleFeedbackDismissed = (orderId) => {
    markDismissed(orderId);
    setDismissedIds(getDismissedIds());
    setFeedbackOrder(null);
  };

  // An order "needs feedback" only if delivered AND not yet submitted
  // (dismissed ones still show the Rate button so user can come back later)
  const needsFeedback = (order) =>
    order.status === "DELIVERED" && !submittedIds.has(order.id);

  const statusBadgeClass = (status) => {
    switch (status) {
      case "DELIVERED": return "bg-emerald-600";
      case "CANCELLED":
      case "REJECTED": return "bg-red-600";
      case "OUT_FOR_DELIVERY": return "bg-blue-600";
      case "PENDING": return "bg-amber-500";
      default: return "bg-indigo-950";
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] px-3 py-3 sm:px-8 sm:py-8">
      <div className="mx-auto mb-4 w-full max-w-3xl sm:mb-5">
        <SearchBar
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            startTransition(() => setSearchQuery(event.target.value));
          }}
          placeholder="Search orders, restaurants or dishes..."
          showResults={false}
        />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        {message ? (
          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>
        ) : null}
        {error ? (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="flex flex-col gap-3 rounded-[28px] border border-indigo-900 bg-indigo-950 p-5 text-white shadow-xl shadow-indigo-950/15 sm:rounded-3xl sm:border-slate-100 sm:bg-white sm:text-slate-950 sm:shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-200 sm:hidden">
              Order history
            </p>
            <h1 className="text-2xl font-black sm:text-3xl sm:text-slate-950">My Orders</h1>
            <p className="mt-1 text-sm text-indigo-100 sm:text-slate-500">
              Tap any order card to see the full bill and live status.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-sm font-bold text-indigo-100 sm:text-indigo-700">
            <Clock3 className="w-5 h-5" />
            Recent Orders
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : orders.length > 0 ? (
          filteredOrders.length > 0 ? (
             <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onSelect={setSelectedOrder}
                  onCancelRequest={handleCancelRequest}
                  onChat={openRiderChat}
                  onChatVendor={canChatWithVendor(order) ? openVendorChat : null}
                  onFeedback={openFeedback}
                  needsFeedback={needsFeedback}
                  canChatWithRider={canChatWithRider}
                />
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

      {/* ── Order Detail Modal ── */}
      {selectedOrder ? (
        <div className="fixed inset-0 z-[80] flex items-end bg-slate-950/45 px-3 pb-3 sm:items-center sm:justify-center sm:p-6">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">Order Bill</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  {selectedOrder.restaurant?.name || "Restaurant"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
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

            {/* ── Order Progress Bar ── */}
            <div className="mb-4">
              <OrderProgressBar status={selectedOrder.status} />
            </div>

            {/* ── Order Items ── */}
            <div className="space-y-3">
              {selectedOrder.items?.map((item) => (
                <div key={item.id} className="flex justify-between gap-3 rounded-2xl bg-slate-50 p-3 text-sm">
                  <div>
                    <p className="font-bold text-slate-900">{item.menuItem?.name || "Item"}</p>
                    <p className="mt-1 text-xs text-slate-500">Qty {item.quantity || 1}</p>
                  </div>
                  <p className="font-black text-slate-950">
                    {formatCurrency(
                      Number(item.unitPrice || item.price || 0) * Number(item.quantity || 1),
                    )}
                  </p>
                </div>
              ))}
            </div>

            {/* ── Bill Summary ── */}
            <div className="mt-4 space-y-2 rounded-3xl bg-indigo-950 p-4 text-white">
              <div className="flex justify-between text-sm text-indigo-100">
                <span>Items total</span>
                <span>
                  {formatCurrency(
                    getOrderItemsTotal(selectedOrder) || selectedOrder.totalAmount,
                  )}
                </span>
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

            {/* ── Action Buttons ── */}
            <button
              type="button"
              onClick={() =>
                navigate(
                  selectedOrder.restaurant?.id ? `/restaurant/${selectedOrder.restaurant.id}` : "/",
                )
              }
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-700 px-4 py-3 text-sm font-black text-white transition-all duration-200 active:scale-95"
            >
              Open Restaurant <ArrowRight className="h-4 w-4" />
            </button>

            {canChatWithVendor(selectedOrder) ? (
              <button
                type="button"
                onClick={(event) => openVendorChat(event, selectedOrder)}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white transition-all duration-200 active:scale-95"
              >
                <MessageCircle className="h-4 w-4" />
                Chat with {selectedOrder.restaurant?.name || "Restaurant"}
              </button>
            ) : null}
            {canChatWithRider(selectedOrder) ? (
              <button
                type="button"
                onClick={(event) => openRiderChat(event, selectedOrder)}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition-all duration-200 active:scale-95"
              >
                <MessageCircle className="h-4 w-4" />
                Chat with Rider
              </button>
            ) : null}

            {/* Feedback button inside modal for delivered orders */}
            {needsFeedback(selectedOrder) ? (
              <button
                type="button"
                onClick={(event) => {
                  setSelectedOrder(null);
                  openFeedback(event, selectedOrder);
                }}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-sm font-black text-amber-950 transition-all duration-200 active:scale-95"
              >
                <Star className="h-4 w-4" />
                Rate your experience
              </button>
            ) : submittedIds.has(selectedOrder.id) ? (
              <div className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                <Star className="h-4 w-4 fill-emerald-500 text-emerald-500" />
                You've rated this order
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ── Restaurant Chat Modal ── */}
      {chatVendorOrder ? (
        <Suspense fallback={<div className="fixed inset-0 z-[90] bg-slate-950/40" />}>
          <OrderChatModal
            order={chatVendorOrder}
            onClose={() => setChatVendorOrder(null)}
            chatType="vendor"
            title={`Chat with ${chatVendorOrder.restaurant?.name || "Restaurant"}`}
            subtitle={chatVendorOrder.restaurant?.name || "Restaurant partner"}
            participantName={chatVendorOrder.restaurant?.name || "Restaurant"}
            disabled={!canChatWithVendor(chatVendorOrder)}
            disabledReason="Restaurant chat is available only while the order is active."
          />
        </Suspense>
      ) : null}

      {/* ── Rider Chat Modal ── */}
      {chatOrder ? (
        <Suspense fallback={<div className="fixed inset-0 z-[90] bg-slate-950/40" />}>
          <OrderChatModal
            order={chatOrder}
            onClose={() => setChatOrder(null)}
            title="Chat with Rider"
            subtitle={chatOrder.rider?.name || "Assigned rider"}
            participantName={chatOrder.rider?.name || "Assigned rider"}
            disabled={!canChatWithRider(chatOrder)}
            disabledReason="Rider chat is available only while the order is active."
          />
        </Suspense>
      ) : null}

      {/* ── Cancel Confirmation Modal ── */}
      {cancelConfirmOrder ? (
        <div className="fixed inset-0 z-[90] flex items-end bg-slate-950/55 p-3 sm:items-center sm:justify-center sm:p-6">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-black text-slate-950">Cancel Order?</h2>
            <p className="mt-2 text-sm text-slate-500">
              Order #{cancelConfirmOrder.id.slice(-6)} &middot; {cancelConfirmOrder.status.replace(/_/g, " ")}
            </p>
            {(() => {
              const pct = calcCancelFee(cancelConfirmOrder);
              const amt = Number(cancelConfirmOrder.totalAmount);
              const fee = Math.round(amt * pct / 100 * 100) / 100;
              const refund = amt - fee;
              return pct > 0 ? (
                <div className="mt-4 space-y-2 rounded-2xl bg-rose-50 p-4 text-sm">
                  <div className="flex justify-between"><span>Cancellation fee ({pct}%)</span><span className="font-bold text-rose-600">-{formatCurrency(fee)}</span></div>
                  <div className="flex justify-between border-t border-rose-200 pt-2"><span className="font-bold">Amount to refund</span><span className="font-bold">{formatCurrency(refund)}</span></div>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">
                  No cancellation fee for this order.
                </div>
              );
            })()}
            <div className="mt-5 flex gap-3">
              <button onClick={() => setCancelConfirmOrder(null)} className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-700">Go Back</button>
              <button onClick={handleCancelConfirm} className="flex-1 rounded-xl bg-rose-600 py-3 text-sm font-bold text-white">Yes, Cancel</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Feedback Modal ── */}
      {feedbackOrder ? (
        <Suspense fallback={<div className="fixed inset-0 z-[90] bg-slate-950/40" />}>
          <OrderFeedbackModal
            order={feedbackOrder}
            onClose={() => handleFeedbackDismissed(feedbackOrder.id)}
            onSubmitted={handleFeedbackSubmitted}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
