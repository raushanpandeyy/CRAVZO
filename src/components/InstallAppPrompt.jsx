import React, { useState, useEffect, useRef } from "react";
import { Download, X, Smartphone, Star, Zap, Bell } from "lucide-react";

const STORAGE_KEYS = {
  installed: "dodago_app_installed",
  dismissed: "dodago_app_prompt_dismissed",
};

const InstallAppPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const autoShownRef = useRef(false);

  useEffect(() => {
    const alreadyInstalled = localStorage.getItem(STORAGE_KEYS.installed);
    const dismissed = localStorage.getItem(STORAGE_KEYS.dismissed);

    // Detect iOS — Safari doesn't fire beforeinstallprompt, needs manual guide
    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent) &&
      !window.navigator.standalone;
    setIsIOS(ios);

    // If already installed as PWA, never show
    if (alreadyInstalled || window.navigator.standalone) return;

    // ── Chrome / Android / Edge — wait for browser's install signal ──
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Auto-show once per session if not dismissed before
      if (!dismissed && !autoShownRef.current) {
        autoShownRef.current = true;
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    // ── iOS — show after a delay if not dismissed ──
    let iosTimer;
    if (ios && !dismissed) {
      iosTimer = setTimeout(() => {
        autoShownRef.current = true;
        setShowPrompt(true);
      }, 4000);
    }

    // ── Manual trigger from MobileBottomNav "App" button ──
    const handleManualTrigger = () => setShowPrompt(true);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("showInstallPrompt", handleManualTrigger);

    // Mark as installed when browser confirms
    const handleAppInstalled = () => {
      localStorage.setItem(STORAGE_KEYS.installed, "true");
      setShowPrompt(false);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("showInstallPrompt", handleManualTrigger);
      window.removeEventListener("appinstalled", handleAppInstalled);
      clearTimeout(iosTimer);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem(STORAGE_KEYS.installed, "true");
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEYS.dismissed, "true");
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  // ── iOS Guide ──
  if (isIOS) {
    return (
      <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 px-4 pb-4">
        <div className="w-full max-w-sm animate-slide-up overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div className="bg-indigo-600 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
                  <Smartphone className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">
                    Add to Home Screen
                  </p>
                  <h2 className="text-base font-black text-white">Install Dodago</h2>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="p-5">
            <p className="text-sm font-semibold text-slate-700 mb-4">
              Install Dodago in 2 taps:
            </p>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">
                  1
                </span>
                <p className="text-sm text-slate-600 pt-0.5">
                  Tap the{" "}
                  <span className="font-black text-slate-900">Share</span>{" "}
                  button{" "}
                  <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono">
                    ⬆
                  </span>{" "}
                  at the bottom of Safari
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">
                  2
                </span>
                <p className="text-sm text-slate-600 pt-0.5">
                  Scroll down and tap{" "}
                  <span className="font-black text-slate-900">
                    "Add to Home Screen"
                  </span>
                </p>
              </li>
            </ol>

            {/* Visual arrow hint */}
            <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-indigo-50 px-4 py-3">
              <span className="text-2xl">⬆</span>
              <p className="text-xs font-black text-indigo-700">
                Look for the Share button in Safari's bottom bar
              </p>
            </div>

            <button
              onClick={handleDismiss}
              className="mt-4 w-full text-xs text-slate-400 transition hover:text-slate-600"
            >
              Got it, maybe later
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Chrome / Android / Edge ──
  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 px-4 pb-4">
      <div className="w-full max-w-sm animate-slide-up overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="bg-indigo-600 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
                <Smartphone className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">
                  Free install
                </p>
                <h2 className="text-base font-black text-white">
                  Install Dodago App
                </h2>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Benefits */}
        <div className="p-5">
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-slate-50 p-3 text-center">
              <Zap className="h-5 w-5 text-indigo-600" />
              <p className="text-[11px] font-black text-slate-700">Faster</p>
              <p className="text-[10px] text-slate-500">No browser lag</p>
            </div>
            <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-slate-50 p-3 text-center">
              <Bell className="h-5 w-5 text-indigo-600" />
              <p className="text-[11px] font-black text-slate-700">Alerts</p>
              <p className="text-[10px] text-slate-500">Order updates</p>
            </div>
            <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-slate-50 p-3 text-center">
              <Star className="h-5 w-5 text-indigo-600" />
              <p className="text-[11px] font-black text-slate-700">Offline</p>
              <p className="text-[10px] text-slate-500">Works without net</p>
            </div>
          </div>

          {/* Install CTA */}
          <button
            onClick={handleInstall}
            disabled={!deferredPrompt}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-sm font-black text-white transition hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50"
          >
            <Download className="h-5 w-5" />
            {deferredPrompt ? "Install Now — It's Free" : "Open in Browser Settings to Install"}
          </button>

          <button
            onClick={handleDismiss}
            className="mt-3 w-full text-xs text-slate-400 transition hover:text-slate-600"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallAppPrompt;
