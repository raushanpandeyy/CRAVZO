import React, { useEffect, useMemo, useRef, useState } from "react";
import { BellRing, Clock3, Megaphone, Plus, Store, Volume2, X } from "lucide-react";

const playAlertTone = () => {
  if (typeof window === "undefined") return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const context = new AudioContext();
  const notes = [740, 880, 740];
  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, context.currentTime + index * 0.22);
    gain.gain.setValueAtTime(0.0001, context.currentTime + index * 0.22);
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + index * 0.22 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + index * 0.22 + 0.18);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(context.currentTime + index * 0.22);
    oscillator.stop(context.currentTime + index * 0.22 + 0.2);
  });
  setTimeout(() => context.close().catch(() => {}), 1000);
};

const VendorHoursAlert = ({ alert, restaurant, saving, onExtend, onGoOnline, onSnooze, onClose }) => {
  const [soundBlocked, setSoundBlocked] = useState(false);
  const playedRef = useRef(false);

  useEffect(() => {
    if (!alert || playedRef.current) return;
    playedRef.current = true;
    try {
      playAlertTone();
    } catch {
      setSoundBlocked(true);
    }
  }, [alert]);

  const copy = useMemo(() => {
    if (alert?.type === "opening") {
      return {
        icon: Store,
        eyebrow: "Opening reminder",
        title: "Open karne ka time ho gaya hai",
        body: `${restaurant?.name || "Restaurant"} ka opening time ${restaurant?.openingTime || "set time"} hai. Online kar doge toh customers order place kar paayenge.`,
        tone: "emerald",
      };
    }
    return {
      icon: Megaphone,
      eyebrow: "Closing reminder",
      title: "Restaurant band hone waala hai",
      body: `${restaurant?.name || "Restaurant"} ${alert?.minutesUntilClose ?? "few"} min me close hone wala hai. Agar aaj aur orders lena hai toh timing extend kar do.`,
      tone: "amber",
    };
  }, [alert, restaurant]);

  if (!alert) return null;

  const Icon = copy.icon;
  const toneClass = copy.tone === "emerald" ? "bg-emerald-600" : "bg-amber-500";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl shadow-slate-950/30">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${toneClass} text-white`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff6b5f]">{copy.eyebrow}</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">{copy.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{copy.body}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close alert">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700 sm:grid-cols-2">
          <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-indigo-700" /> Opens {restaurant?.openingTime || "--:--"}</span>
          <span className="inline-flex items-center gap-2"><BellRing className="h-4 w-4 text-indigo-700" /> Closes {restaurant?.closingTime || "--:--"}</span>
        </div>

        {soundBlocked ? (
          <button type="button" onClick={playAlertTone} className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-700">
            <Volume2 className="h-4 w-4" /> Play alert sound
          </button>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {alert.type === "closing" ? (
            <>
              <button type="button" disabled={saving} onClick={() => onExtend(30)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-700 px-4 py-3 text-sm font-black text-white hover:bg-indigo-800 disabled:opacity-60">
                <Plus className="h-4 w-4" /> Extend 30 min
              </button>
              <button type="button" disabled={saving} onClick={() => onExtend(60)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white hover:bg-slate-950 disabled:opacity-60">
                <Plus className="h-4 w-4" /> Extend 1 hour
              </button>
            </>
          ) : (
            <button type="button" disabled={saving || restaurant?.isOpen} onClick={onGoOnline} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60">
              <Store className="h-4 w-4" /> {restaurant?.isOpen ? "Already online" : "Go online"}
            </button>
          )}
          <button type="button" onClick={onSnooze} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50">
            Remind in 10 min
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorHoursAlert;
