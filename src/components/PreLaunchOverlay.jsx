import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Sparkles, Tag, Zap, X } from "lucide-react";
import { dodagologo } from "../assets/images/logos.js";

const STORAGE_KEY = "dodago_prelaunch_dismissed";

// ── helpers ──────────────────────────────────────────────────────────────────

function getTimeLeft(targetDate) {
  const diff = targetDate - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  };
}

function pad(n) {
  return String(n).padStart(2, "0");
}

// ── CountdownUnit ─────────────────────────────────────────────────────────────

const CountdownUnit = ({ value, label }) => (
  <div className="flex flex-col items-center gap-1">
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-inner">
      <span className="text-3xl font-black tabular-nums text-white leading-none">
        {pad(value)}
      </span>
    </div>
    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">
      {label}
    </span>
  </div>
);

// ── PreLaunchOverlay ──────────────────────────────────────────────────────────

const LAUNCH_DATE = new Date(
  import.meta.env.VITE_LAUNCH_DATE ?? "2026-10-21T00:00:00"
);

const PreLaunchOverlay = ({ onDismiss }) => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(LAUNCH_DATE));
  const [visible, setVisible] = useState(false);

  // Fade in after mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Tick every second
  useEffect(() => {
    if (timeLeft.expired) return;
    const id = setInterval(() => setTimeLeft(getTimeLeft(LAUNCH_DATE)), 1000);
    return () => clearInterval(id);
  }, [timeLeft.expired]);

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1");
    onDismiss();
  }, [onDismiss]);

  const handleSignUp = useCallback(() => {
    // Mark dismissed so overlay won't re-appear after returning from signup
    localStorage.setItem(STORAGE_KEY, "1");
    navigate("/signin?mode=signup");
  }, [navigate, dismiss]);

  return (
    <div
      className={`fixed inset-0 z-[500] flex items-center justify-center p-4 transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ background: "rgba(15,10,40,0.92)", backdropFilter: "blur(8px)" }}
    >
      {/* Card */}
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-950 shadow-2xl overflow-hidden">

        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-16 -left-16 h-56 w-56 rounded-full bg-purple-500 opacity-20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-pink-500 opacity-20 blur-3xl" />

        {/* Skip / close */}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Skip pre-launch screen"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 transition hover:bg-white/20 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative px-6 pb-8 pt-8">
          {/* Logo + badge */}
          <div className="mb-5 flex items-center gap-3">
            <img src={dodagologo} alt="Dodago" className="h-12 w-12 rounded-2xl object-cover shadow-lg" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">
                Coming Soon
              </p>
              <h1 className="text-2xl font-black leading-tight text-white">
                DODAGO
              </h1>
            </div>
          </div>

          {/* Headline */}
          <p className="mb-6 text-base font-semibold leading-relaxed text-indigo-100">
            We're launching in Delhi NCR very soon.{" "}
            <span className="text-yellow-300 font-black">Sign up now</span> to get
            early access and the best deals on your favourite dishes.
          </p>

          {/* Countdown */}
          {!timeLeft.expired ? (
            <div className="mb-7">
              <p className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-indigo-300">
                App goes live in
              </p>
              <div className="flex items-start justify-center gap-3">
                <CountdownUnit value={timeLeft.days} label="Days" />
                <span className="mt-3 text-2xl font-black text-white/40 leading-none">:</span>
                <CountdownUnit value={timeLeft.hours} label="Hours" />
                <span className="mt-3 text-2xl font-black text-white/40 leading-none">:</span>
                <CountdownUnit value={timeLeft.minutes} label="Min" />
                <span className="mt-3 text-2xl font-black text-white/40 leading-none">:</span>
                <CountdownUnit value={timeLeft.seconds} label="Sec" />
              </div>
            </div>
          ) : (
            <div className="mb-7 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 px-4 py-3 text-center">
              <p className="font-black text-emerald-300 text-lg">🎉 We're Live!</p>
              <p className="text-sm text-emerald-200 mt-0.5">Download the app and start ordering.</p>
            </div>
          )}

          {/* Value props */}
          <div className="mb-7 space-y-2.5">
            <div className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
                <Tag className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-black text-white">No Platform Fees</p>
                <p className="text-xs text-indigo-300">Pay only for food + delivery. Nothing hidden.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-yellow-500/20">
                <Sparkles className="h-4 w-4 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-black text-white">Best Deals on Your Favourite Dishes</p>
                <p className="text-xs text-indigo-300">Prices that actually make sense.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20">
                <Zap className="h-4 w-4 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-black text-white">Fast Delivery, Honest Pricing</p>
                <p className="text-xs text-indigo-300">Delhi NCR's new favourite food app.</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={handleSignUp}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 py-4 font-black text-white shadow-lg shadow-indigo-900/50 transition active:scale-95 hover:from-indigo-400 hover:to-purple-400"
          >
            <Bell className="h-5 w-5" />
            Notify Me — Sign Up Free
          </button>

          {/* Skip link */}
          <button
            type="button"
            onClick={dismiss}
            className="mt-3 w-full text-center text-xs font-bold text-indigo-400 hover:text-indigo-200 transition"
          >
            Already signed up? Skip →
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreLaunchOverlay;
export { STORAGE_KEY };
