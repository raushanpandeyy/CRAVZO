import React, { useState, useEffect, useRef } from "react";
import { X, MapPin, Package, Clock, Navigation, Phone, ChevronRight, Check } from "lucide-react";
import { playAlertSound, stopAlertSound } from "../utils/alertSound.js";

const VENDOR_COUNTDOWN_SECONDS = 30;

const OrderRequestPopup = ({ order, onAccept, onReject, onClose, onCountdownExpire, type = "rider" }) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [countdown, setCountdown] = useState(type === "vendor" ? VENDOR_COUNTDOWN_SECONDS : null);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (order) {
      playAlertSound(true, "urgent");
    }
    return () => stopAlertSound();
  }, [order]);

  // 30-second countdown for vendor — auto-reject when it hits 0
  useEffect(() => {
    if (type !== "vendor" || countdown === null) return;
    if (countdown <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true;
        stopAlertSound();
        onCountdownExpire?.();
      }
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [type, countdown, onCountdownExpire]);

  const handleAccept = async () => {
    stopAlertSound();
    setIsAccepting(true);
    try {
      await onAccept(order.id);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    stopAlertSound();
    setIsRejecting(true);
    try {
      await onReject(order.id);
    } finally {
      setIsRejecting(false);
    }
  };

if (!order) return null;

  const formatCurrency = (amount) => `₹${Math.floor(amount || 0)}`;

  if (type === "rider") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
        <div className="w-full max-w-md animate-bounce-in rounded-3xl bg-white shadow-2xl">
          <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 text-white">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full bg-white/20 p-1 hover:bg-white/30"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="text-center">
              <p className="text-sm font-medium uppercase tracking-wider text-indigo-200">New Order Request</p>
              <h2 className="mt-2 text-2xl font-black">You Have a Delivery!</h2>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/20 p-4 text-center">
                <p className="text-xs text-indigo-200">Your Earnings</p>
                <p className="mt-1 text-3xl font-black">{formatCurrency(order.deliveryFee)}</p>
              </div>
              <div className="rounded-2xl bg-white/20 p-4 text-center">
                <p className="text-xs text-indigo-200">Distance</p>
                <p className="mt-1 text-3xl font-black">{order.deliveryDistance ? `${Math.round(order.deliveryDistance)} km` : "N/A"}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-4 flex items-start gap-4 rounded-2xl bg-slate-50 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <Package className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-900">{order.restaurant?.name || "Restaurant"}</p>
                <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                  <MapPin className="h-4 w-4" />
                  {order.restaurant?.addressLine1 || "Restaurant address"}
                </p>
              </div>
            </div>

            {order.items && order.items.length > 0 && (
              <div className="mb-4 rounded-2xl border border-slate-200 p-4">
                <p className="mb-2 text-sm font-bold text-slate-500">Order Items ({order.items.length})</p>
                <div className="space-y-1">
                  {order.items.slice(0, 3).map((item, idx) => (
                    <p key={idx} className="text-sm text-slate-700">
                      {item.quantity}x {item.menuItem?.name || "Item"}
                    </p>
                  ))}
                  {order.items.length > 3 && (
                    <p className="text-xs text-slate-500">+{order.items.length - 3} more items</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock className="h-4 w-4" />
              <span>Order placed {new Date(order.createdAt).toLocaleTimeString()}</span>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleReject}
                disabled={isRejecting || isAccepting}
                className="flex-1 rounded-2xl border-2 border-slate-300 py-4 font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                {isRejecting ? "Rejecting..." : "Reject"}
              </button>
              <button
                onClick={handleAccept}
                disabled={isRejecting || isAccepting}
                className="flex-1 rounded-2xl bg-emerald-600 py-4 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {isAccepting ? "Accepting..." : "Accept Order"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "vendor") {
    // SVG progress ring values
    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const progress = countdown !== null ? countdown / VENDOR_COUNTDOWN_SECONDS : 1;
    const dashOffset = circumference * (1 - progress);
    const isUrgent = countdown !== null && countdown <= 10;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
        <div className="w-full max-w-md animate-bounce-in rounded-3xl bg-white shadow-2xl">
          <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-orange-500 to-red-600 p-6 text-white">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full bg-white/20 p-1 hover:bg-white/30"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center">
              <p className="text-sm font-medium uppercase tracking-wider text-orange-200">New Order Received!</p>
              <h2 className="mt-2 text-2xl font-black">Order #{order.id?.slice(-6) || "New"}</h2>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/20 p-4 text-center">
                <p className="text-xs text-orange-200">Order Value</p>
                <p className="mt-1 text-2xl font-black">{formatCurrency(order.totalAmount)}</p>
              </div>
              <div className="rounded-2xl bg-white/20 p-4 text-center">
                <p className="text-xs text-orange-200">Items</p>
                <p className="mt-1 text-2xl font-black">{order.items?.length || 0}</p>
              </div>
            </div>

            {/* Countdown ring */}
            {countdown !== null && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <svg width="52" height="52" className="shrink-0 -rotate-90">
                  <circle cx="26" cy="26" r={radius} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                  <circle
                    cx="26" cy="26" r={radius}
                    fill="none"
                    stroke={isUrgent ? "#fca5a5" : "#ffffff"}
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.3s" }}
                  />
                </svg>
                <p className={`text-sm font-bold ${isUrgent ? "text-red-200 animate-pulse" : "text-orange-100"}`}>
                  Auto-reject in <span className="text-xl font-black text-white">{countdown}s</span>
                </p>
              </div>
            )}
          </div>

          <div className="p-6">
            {order.items && order.items.length > 0 && (
              <div className="mb-4 rounded-2xl bg-slate-50 p-4">
                <p className="mb-3 text-sm font-bold text-slate-500">Order Items</p>
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-slate-700">{item.quantity}x {item.menuItem?.name || "Item"}</span>
                      <span className="text-sm font-medium text-slate-600">{formatCurrency(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {order.customer && (
              <div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <span className="font-bold">{order.customer.name?.[0] || "C"}</span>
                </div>
                <div>
                  <p className="font-bold text-slate-900">{order.customer.name || "Customer"}</p>
                  <p className="text-sm text-slate-500">{order.customer.phone || "No phone"}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock className="h-4 w-4" />
              <span>Ordered at {new Date(order.createdAt).toLocaleTimeString()}</span>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleReject}
                disabled={isRejecting || isAccepting}
                className="flex-1 rounded-2xl border-2 border-red-300 py-4 font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                {isRejecting ? "Rejecting..." : "Reject"}
              </button>
              <button
                onClick={handleAccept}
                disabled={isRejecting || isAccepting}
                className="flex-1 rounded-2xl bg-emerald-600 py-4 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {isAccepting ? "Accepting..." : "Accept Order"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default OrderRequestPopup;