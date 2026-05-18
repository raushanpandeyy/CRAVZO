import React, { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";

const CookiesConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookiesConsent");
    if (!consent) {
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookiesConsent", "accepted");
    setShowBanner(false);
  };

  const handleReject = () => {
    localStorage.setItem("cookiesConsent", "rejected");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/30 p-4 md:items-center">
      <div className="w-full max-w-sm animate-slide-up rounded-t-2xl md:rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="bg-indigo-600 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <Cookie className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-base font-bold text-white">We value your privacy</h2>
            </div>
            <button onClick={handleReject} className="rounded-full bg-white/20 p-1.5 hover:bg-white/30">
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        <div className="p-4">
          <p className="text-slate-600 text-xs leading-relaxed">
            We use cookies to enhance your browsing experience and personalize content.
            By clicking "Accept All", you consent to our use of cookies.
          </p>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleReject}
              className="flex-1 rounded-xl border-2 border-indigo-200 py-2.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiesConsent;