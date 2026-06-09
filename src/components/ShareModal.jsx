import React, { useState } from "react";
import {
  Copy,
  ExternalLink,
  Mail,
  MessageCircle,
  Send,
  MessageSquare,
  X,
} from "lucide-react";
import {
  shareOnWhatsApp,
  shareOnTelegram,
  shareOnSMS,
  shareOnEmail,
  copyToClipboard,
  shareNative,
} from "../utils/share.js";

const platforms = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    bg: "bg-emerald-500",
    action: shareOnWhatsApp,
  },
  {
    id: "telegram",
    label: "Telegram",
    icon: Send,
    bg: "bg-sky-500",
    action: shareOnTelegram,
  },
  {
    id: "sms",
    label: "SMS",
    icon: MessageSquare,
    bg: "bg-blue-500",
    action: shareOnSMS,
  },
  {
    id: "email",
    label: "Email",
    icon: Mail,
    bg: "bg-gray-600",
    action: shareOnEmail,
  },
];

const ShareModal = ({ url, text, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    const ok = await shareNative(url, text);
    if (ok) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900">Share</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-4">
          {platforms.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => {
                  p.action(url, text);
                  onClose();
                }}
                className="group flex flex-col items-center gap-2"
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${p.bg} text-white shadow-lg transition-transform group-active:scale-90`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-[11px] font-bold text-slate-600">
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={handleCopy}
            className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
          >
            <Copy className="h-5 w-5 text-slate-400" />
            {copied ? "Copied!" : "Copy Link"}
          </button>

          {navigator.share && (
            <button
              onClick={handleNativeShare}
              className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
            >
              <ExternalLink className="h-5 w-5 text-slate-400" />
              More
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
