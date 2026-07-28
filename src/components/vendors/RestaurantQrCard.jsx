import React, { useEffect, useMemo, useState } from "react";
import { Copy, Download, ExternalLink, Loader2, QrCode } from "lucide-react";
import QRCode from "qrcode";

import ShareButton from "../ShareButton.jsx";
import { copyToClipboard, getShareText, getShareUrl } from "../../utils/share.js";

const buildDownloadName = (restaurantName) => {
  const safeName = String(restaurantName || "restaurant")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `dodago-${safeName || "restaurant"}-qr.png`;
};

const RestaurantQrCard = ({ restaurant }) => {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const restaurantUrl = useMemo(
    () => (restaurant?.id ? getShareUrl.restaurant(restaurant.id).replace("ref=share", "ref=qr") : ""),
    [restaurant?.id]
  );

  const shareText = useMemo(
    () => getShareText.restaurant(restaurant?.name || "this restaurant"),
    [restaurant?.name]
  );

  useEffect(() => {
    if (!restaurantUrl) {
      setQrDataUrl("");
      setError("");
      return;
    }

    let active = true;
    setLoading(true);
    setError("");

    QRCode.toDataURL(restaurantUrl, {
      errorCorrectionLevel: "M",
      margin: 2,
      scale: 8,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then((nextQrDataUrl) => {
        if (active) setQrDataUrl(nextQrDataUrl);
      })
      .catch(() => {
        if (active) setError("QR code could not be generated.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [restaurantUrl]);

  const handleCopy = async () => {
    if (!restaurantUrl) return;
    const ok = await copyToClipboard(restaurantUrl);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!restaurant?.id) return null;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
            <QrCode size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Restaurant QR</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Customers can scan this QR to open your restaurant page directly.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ShareButton
            url={restaurantUrl}
            text={shareText}
            className="h-11 w-11 bg-slate-100 text-slate-700 hover:bg-slate-200"
          />
          <a
            href={restaurantUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
            aria-label="Open restaurant page"
            title="Open restaurant page"
          >
            <ExternalLink size={18} />
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            <Copy size={16} />
            {copied ? "Copied" : "Copy Link"}
          </button>
          <a
            href={qrDataUrl || undefined}
            download={buildDownloadName(restaurant.name)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white ${
              qrDataUrl ? "bg-indigo-600 hover:bg-indigo-700" : "pointer-events-none bg-slate-300"
            }`}
          >
            <Download size={16} />
            Download QR
          </a>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[220px_1fr] lg:items-center">
        <div className="flex aspect-square w-full max-w-[220px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-4">
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          ) : qrDataUrl ? (
            <img src={qrDataUrl} alt={`${restaurant.name} QR code`} className="h-full w-full object-contain" />
          ) : (
            <p className="text-center text-sm font-medium text-slate-400">{error || "QR unavailable"}</p>
          )}
        </div>

        <div className="min-w-0 rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-900">{restaurant.name}</p>
          <p className="mt-2 break-all text-sm leading-6 text-slate-600">{restaurantUrl}</p>
          <p className="mt-3 text-xs font-medium text-slate-500">
            Downloaded QR can be printed on tables, packaging, posters, or shared with customers online.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RestaurantQrCard;
