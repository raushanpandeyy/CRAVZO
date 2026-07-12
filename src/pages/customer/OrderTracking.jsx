import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Bike, ChevronLeft, Clock3, Loader2, MapPin, Navigation, Phone, RefreshCw, ShieldCheck } from "lucide-react";

import GoogleTrackingMap from "../../components/GoogleTrackingMap.jsx";
import { getOrderTracking, requestDeliveryOtp } from "../../services/orderService.js";
import { onOrderStatusUpdate, onRiderLocationUpdate } from "../../services/chatSocket.js";

const formatStatus = (status) => (status || "").replaceAll("_", " ");
const formatEta = (seconds) => {
  if (!seconds) return "ETA pending";
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} min`;
};
const formatDistance = (km) => Number.isFinite(Number(km)) ? `${Number(km).toFixed(1)} km` : "Distance pending";

const buildAddress = (address) => [address?.line1, address?.line2, address?.city].filter(Boolean).join(", ");
const hasCoords = (point) => point?.latitude != null && point?.longitude != null;

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [tracking, setTracking] = useState(null);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadTracking = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setRefreshing(true);
    setError("");
    try {
      const data = await getOrderTracking(orderId);
      setTracking(data);
    } catch (requestError) {
      setError(requestError.message || "Tracking unavailable");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadTracking();
    const interval = window.setInterval(() => loadTracking({ silent: true }), 15000);
    return () => window.clearInterval(interval);
  }, [loadTracking]);

  useEffect(() => onOrderStatusUpdate(({ orderId: updatedOrderId, status }) => {
    if (updatedOrderId !== orderId) return;
    setTracking((current) => current ? { ...current, status } : current);
    loadTracking({ silent: true });
  }), [orderId, loadTracking]);

  useEffect(() => onRiderLocationUpdate((payload) => {
    if (payload.orderId !== orderId) return;
    setTracking((current) => current ? {
      ...current,
      rider: {
        ...current.rider,
        latitude: payload.latitude,
        longitude: payload.longitude,
      },
    } : current);
  }), [orderId]);

  const riderLoc = useMemo(() => hasCoords(tracking?.rider) ? tracking.rider : null, [tracking]);
  const restaurantLoc = useMemo(() => hasCoords(tracking?.restaurant) ? tracking.restaurant : null, [tracking]);
  const destinationLoc = useMemo(() => hasCoords(tracking?.destination) ? tracking.destination : null, [tracking]);

  const openGoogleNavigation = () => {
    const target = riderLoc || destinationLoc || restaurantLoc;
    if (!target) return;
    window.open(`https://www.google.com/maps/search/?api=1&query=${target.latitude},${target.longitude}`, "_blank", "noopener,noreferrer");
  };

  const generateOtp = async () => {
    setError("");
    try {
      const data = await requestDeliveryOtp(orderId);
      setOtp(data.otp);
    } catch (requestError) {
      setError(requestError.message || "OTP unavailable");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 pt-16 md:pt-6">
      <div className="mx-auto grid max-w-6xl gap-5 px-4 lg:grid-cols-[1.45fr_0.85fr]">
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm"
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => loadTracking()}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-indigo-700 shadow-sm disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          <div className="overflow-hidden rounded-3xl bg-white p-3 shadow-sm">
            <GoogleTrackingMap
              rider={riderLoc}
              restaurant={restaurantLoc}
              destination={destinationLoc}
              encodedPolyline={tracking?.route?.encodedPolyline}
            />
          </div>

          {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl bg-indigo-950 p-5 text-white shadow-lg shadow-indigo-950/15">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-200">Live tracking</p>
            <h1 className="mt-2 text-2xl font-black">Order #{orderId?.slice(-6)}</h1>
            <div className="mt-4 rounded-2xl bg-white/10 p-4">
              <p className="text-xs font-bold text-indigo-100">Current status</p>
              <p className="mt-1 text-lg font-black">{formatStatus(tracking?.status)}</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-white/10 p-3">
                <Clock3 className="h-4 w-4 text-indigo-200" />
                <p className="mt-2 font-black">{formatEta(tracking?.route?.durationSeconds)}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <Navigation className="h-4 w-4 text-indigo-200" />
                <p className="mt-2 font-black">{formatDistance(tracking?.route?.distanceKm || tracking?.deliveryDistance)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
                <Bike className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-slate-950">{tracking?.rider?.name || "Rider being assigned"}</p>
                <p className="mt-1 text-sm text-slate-500">Live location updates automatically.</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={openGoogleNavigation}
                className="rounded-2xl bg-indigo-600 px-3 py-3 text-sm font-black text-white"
              >
                Open map
              </button>
              <button
                type="button"
                disabled={!tracking?.rider?.phone}
                onClick={() => window.location.href = `tel:${tracking.rider.phone}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-3 py-3 text-sm font-black text-white disabled:opacity-50"
              >
                <Phone className="h-4 w-4" /> Call
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-black text-slate-950">Pickup</p>
            <p className="mt-1 text-sm text-slate-500">{tracking?.restaurant?.name || "Restaurant"}</p>
            <div className="my-4 h-px bg-slate-100" />
            <p className="text-sm font-black text-slate-950">Drop</p>
            <p className="mt-1 text-sm text-slate-500">{buildAddress(tracking?.destination) || "Delivery address"}</p>
            {tracking?.deliveryInstructions ? (
              <div className="mt-4 rounded-2xl bg-blue-50 p-3 text-sm text-blue-800">
                <p className="font-black text-blue-950">Rider instructions</p>
                <p className="mt-1">{tracking.deliveryInstructions}</p>
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl bg-amber-50 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-amber-900">
              <ShieldCheck className="h-5 w-5" />
              <p className="font-black">Delivery OTP</p>
            </div>
            <p className="mt-2 text-sm text-amber-800">Share this only after receiving your order.</p>
            {otp ? (
              <p className="mt-4 rounded-2xl bg-white py-4 text-center text-4xl font-black tracking-[10px] text-amber-900">{otp}</p>
            ) : (
              <button
                type="button"
                onClick={generateOtp}
                className="mt-4 w-full rounded-2xl bg-amber-600 px-4 py-3 text-sm font-black text-white"
              >
                Generate OTP
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
