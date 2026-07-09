import React, { useEffect, useMemo, useState } from "react";
import { Copy, Gift, Loader2, MessageCircle, Send, Ticket, Users } from "lucide-react";

import { buildReferralLink, copyReferralLink, getMyReferral } from "../../services/referralService.js";

const formatReward = (voucher) => {
  if (!voucher) return "Reward";
  if (voucher.rewardType === "FREE_DELIVERY") return "Free delivery";
  return `INR ${Math.floor(voucher.rewardValue)} off`;
};

const maskStatus = (status) => status?.replace(/_/g, " ") || "ISSUED";

const ReferAndEarn = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const referralLink = useMemo(() => buildReferralLink(stats?.referralCode), [stats?.referralCode]);
  const completed = stats?.qualifiedReferrals || 0;

  useEffect(() => {
    let mounted = true;
    getMyReferral()
      .then((data) => {
        if (mounted) setStats(data);
      })
      .catch((requestError) => {
        if (mounted) setError(requestError.message || "Failed to load referral details");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const handleCopy = async () => {
    setMessage("");
    try {
      await copyReferralLink(stats?.referralCode);
      setMessage("Referral link copied.");
    } catch {
      setError("Copy failed. Please copy the link manually.");
    }
  };

  const shareText = encodeURIComponent(`Join CRAVZO with my referral link: ${referralLink}`);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading referral rewards...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] px-3 py-3 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[28px] bg-indigo-950 p-5 text-white shadow-xl shadow-indigo-950/15 sm:rounded-3xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-200">Refer & Earn</p>
              <h1 className="text-3xl font-black sm:text-4xl">Invite friends. Unlock food rewards.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100">
                Rewards unlock after your friend verifies their account and completes their first paid order. Same-device or suspicious referrals may need review.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs font-bold uppercase text-indigo-200">Your code</p>
              <p className="mt-1 text-2xl font-black tracking-wide">{stats?.referralCode || "CRAVZO"}</p>
            </div>
          </div>
        </section>

        {message ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</div> : null}
        {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div> : null}

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6">
            <h2 className="text-lg font-black text-slate-900">Share Link</h2>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                readOnly
                value={referralLink}
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
              />
              <button onClick={handleCopy} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-950 px-5 py-3 text-sm font-black text-white">
                <Copy className="h-4 w-4" /> Copy
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <a className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700" href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
              <a className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-50 px-4 py-3 text-sm font-black text-sky-700" href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${shareText}`} target="_blank" rel="noreferrer">
                <Send className="h-4 w-4" /> Telegram
              </a>
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6">
            <h2 className="text-lg font-black text-slate-900">Progress</h2>
            <div className="mt-5 grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className={`h-3 rounded-full ${completed >= step ? "bg-indigo-700" : "bg-slate-200"}`} />
              ))}
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-2xl font-black text-slate-900">{stats?.pendingReferrals || 0}</p>
                <p className="text-xs font-bold text-slate-500">Pending</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-2xl font-black text-slate-900">{completed}</p>
                <p className="text-xs font-bold text-slate-500">Qualified</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-2xl font-black text-slate-900">{stats?.suspectReferrals || 0}</p>
                <p className="text-xs font-bold text-slate-500">Review</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {(stats?.milestonesConfig || []).map((tier) => (
            <div key={tier.tier} className="rounded-[28px] bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900">{tier.threshold} qualified friends</h3>
                  <p className="text-sm font-semibold text-slate-500">{tier.rewardType === "FREE_DELIVERY" ? "Free delivery voucher" : `INR ${tier.rewardValue} off on INR ${tier.minOrderValue}+`}</p>
                </div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-indigo-700" style={{ width: `${Math.min(100, (completed / tier.threshold) * 100)}%` }} />
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-[28px] bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">Your Vouchers</h2>
            <Ticket className="h-5 w-5 text-indigo-700" />
          </div>
          {stats?.vouchers?.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {stats.vouchers.map((voucher) => (
                <div key={voucher.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-900">{formatReward(voucher)}</p>
                      <p className="mt-1 font-mono text-sm font-bold text-indigo-700">{voucher.voucherCode}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{maskStatus(voucher.status)}</span>
                  </div>
                  <p className="mt-3 text-xs font-semibold text-slate-500">Expires {new Date(voucher.expiresAt).toLocaleDateString("en-IN")}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
              <Users className="mx-auto mb-2 h-6 w-6" /> Invite friends to unlock your first voucher.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ReferAndEarn;
