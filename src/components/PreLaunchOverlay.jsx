import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Gift, X, Zap, ShieldCheck, Heart } from "lucide-react";
import { dodagologo } from "../assets/images/logos.js";
import {
  burger, biryaniplate, momos, dosa,
  chinese, rolls, icecream,
} from "../assets/images/foodimages.js";

const STORAGE_KEY = "dodago_prelaunch_dismissed";

// ── helpers ───────────────────────────────────────────────────────────────────

const LAUNCH_DATE = new Date(
  import.meta.env.VITE_LAUNCH_DATE ?? "2026-10-21T00:00:00"
);

function getTimeLeft() {
  const diff = LAUNCH_DATE - Date.now();
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

// ── CountdownBox ──────────────────────────────────────────────────────────────

const CountdownBox = ({ value, label }) => (
  <div className="flex flex-col items-center gap-1">
    <div
      className="flex h-14 w-14 items-center justify-center rounded-xl shadow-lg"
      style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}
    >
      <span className="text-2xl font-black tabular-nums text-white leading-none">
        {pad(value)}
      </span>
    </div>
    <span className="text-[9px] font-bold uppercase tracking-widest text-yellow-300">
      {label}
    </span>
  </div>
);

// ── Floating food image ────────────────────────────────────────────────────────

const FloatingFood = ({ src, className }) => (
  <img
    src={src}
    alt=""
    aria-hidden="true"
    loading="eager"
    className={`pointer-events-none absolute select-none drop-shadow-2xl ${className}`}
  />
);

// ── PreLaunchOverlay ──────────────────────────────────────────────────────────

const PreLaunchOverlay = ({ onDismiss }) => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (timeLeft.expired) return;
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, [timeLeft.expired]);

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1");
    onDismiss();
  }, [onDismiss]);

  const handleSignUp = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1");
    navigate("/signin?mode=signup");
  }, [navigate]);

  return (
    <div
      className={`fixed inset-0 z-[500] flex items-end justify-center transition-opacity duration-500 sm:items-center ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{ background: "rgba(10,6,40,0.88)", backdropFilter: "blur(6px)" }}
    >
      {/* ── Main card ── */}
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-t-3xl sm:rounded-3xl shadow-2xl"
        style={{
          background: "linear-gradient(160deg, #1a0a6e 0%, #2d0d8e 40%, #3b0fa8 70%, #1e0860 100%)",
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Skip"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full transition"
          style={{ background: "rgba(255,255,255,0.1)" }}
        >
          <X className="h-4 w-4 text-white/70" />
        </button>

        {/* ── HERO BANNER (mimics the image) ── */}
        <div
          className="relative flex flex-col items-center overflow-hidden pb-5 pt-7"
          style={{ minHeight: 230 }}
        >
          {/* Background glow blobs */}
          <div className="pointer-events-none absolute -left-10 top-0 h-40 w-40 rounded-full blur-3xl" style={{ background: "rgba(120,60,255,0.35)" }} />
          <div className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full blur-3xl" style={{ background: "rgba(80,20,200,0.35)" }} />
          <div className="pointer-events-none absolute bottom-0 left-1/2 h-32 w-64 -translate-x-1/2 rounded-full blur-3xl" style={{ background: "rgba(40,0,120,0.6)" }} />

          {/* Floating food — corners */}
          <FloatingFood src={burger}       className="h-16 w-16 object-contain -top-1 -left-2 rotate-[-12deg]" />
          <FloatingFood src={biryaniplate} className="h-14 w-14 object-contain top-4 -right-1 rotate-[10deg]" />
          <FloatingFood src={dosa}         className="h-12 w-12 object-contain bottom-16 -left-2 rotate-[-8deg]" />
          <FloatingFood src={chinese}      className="h-12 w-12 object-contain bottom-16 -right-2 rotate-[8deg]" />

          {/* Logo */}
          <img
            src={dodagologo}
            alt="Dodago"
            className="relative z-10 mb-2 h-14 w-14 rounded-2xl object-cover shadow-xl ring-2 ring-white/20"
          />

          {/* DODAGO wordmark */}
          <p className="relative z-10 text-xs font-bold uppercase tracking-[0.25em] text-blue-200">
            Good Food. Closer to You.
          </p>

          {/* COMING SOON */}
          <div className="relative z-10 mt-1 text-center leading-none">
            <p
              className="text-5xl font-black uppercase"
              style={{
                color: "white",
                textShadow: "0 0 30px rgba(160,120,255,0.8), 0 2px 0 rgba(0,0,50,0.5)",
                letterSpacing: "-0.02em",
              }}
            >
              COMING
            </p>
            <p
              className="text-5xl font-black uppercase"
              style={{
                color: "white",
                textShadow: "0 0 30px rgba(160,120,255,0.8), 0 2px 0 rgba(0,0,50,0.5)",
                letterSpacing: "-0.02em",
              }}
            >
              SOON
            </p>
          </div>

          {/* ZERO PLATFORM FEES badge */}
          <div
            className="relative z-10 mt-3 flex items-center gap-2 rounded-xl px-5 py-2 shadow-lg"
            style={{ background: "linear-gradient(90deg, #f5c000, #f0a800)" }}
          >
            <span className="text-xl font-black text-[#1a0a6e]">ZERO</span>
            <div className="text-left leading-tight">
              <p className="text-[11px] font-black uppercase text-[#1a0a6e]">Platform</p>
              <p className="text-[11px] font-black uppercase text-[#1a0a6e]">Fees</p>
            </div>
          </div>

          {/* Subtitle */}
          <p className="relative z-10 mt-2 px-4 text-center text-xs font-semibold text-blue-100">
            Get best deals on your{" "}
            <span className="font-black text-yellow-300">favourite dishes</span>{" "}
            in minutes ⏱️
          </p>
        </div>

        {/* ── BOTTOM SECTION ── */}
        <div
          className="px-5 pb-6 pt-4"
          style={{ background: "linear-gradient(180deg, transparent, rgba(10,5,60,0.95) 30%)" }}
        >
          {/* Countdown */}
          {!timeLeft.expired ? (
            <div className="mb-4">
              <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-blue-300">
                🚀 App goes live in
              </p>
              <div className="flex items-start justify-center gap-2">
                <CountdownBox value={timeLeft.days}    label="Days" />
                <span className="mt-2.5 text-xl font-black text-white/30">:</span>
                <CountdownBox value={timeLeft.hours}   label="Hours" />
                <span className="mt-2.5 text-xl font-black text-white/30">:</span>
                <CountdownBox value={timeLeft.minutes} label="Min" />
                <span className="mt-2.5 text-xl font-black text-white/30">:</span>
                <CountdownBox value={timeLeft.seconds} label="Sec" />
              </div>
            </div>
          ) : (
            <div className="mb-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/20 px-4 py-3 text-center">
              <p className="text-lg font-black text-emerald-300">🎉 We're Live!</p>
              <p className="mt-0.5 text-sm text-emerald-200">Start ordering now.</p>
            </div>
          )}

          {/* Icon bar */}
          <div className="mb-4 grid grid-cols-4 gap-1">
            {[
              { icon: "🍽️", label: "Delicious\nFood" },
              { icon: "⚡", label: "Fast\nDelivery" },
              { icon: "🛡️", label: "Safe\nDelivery" },
              { icon: "❤️", label: "Local\nFavourites" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1 rounded-xl py-2" style={{ background: "rgba(255,255,255,0.06)" }}>
                <span className="text-xl">{icon}</span>
                <span className="whitespace-pre-line text-center text-[9px] font-bold leading-tight text-blue-200">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* CTA — main */}
          <button
            type="button"
            onClick={handleSignUp}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 font-black text-[#1a0a6e] shadow-xl transition active:scale-95"
            style={{ background: "linear-gradient(90deg, #f5c000, #f0a800)", fontSize: "0.95rem" }}
          >
            <Gift className="h-5 w-5" />
            Sign Up &amp; Win Goodies 🎁
          </button>

          {/* Sub-text under CTA */}
          <p className="mt-1.5 text-center text-[11px] font-semibold text-blue-300">
            Become our very first customer &amp; win exclusive goodies!
          </p>

          {/* Skip */}
          <button
            type="button"
            onClick={dismiss}
            className="mt-3 w-full text-center text-xs font-bold text-blue-400 transition hover:text-blue-200"
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
