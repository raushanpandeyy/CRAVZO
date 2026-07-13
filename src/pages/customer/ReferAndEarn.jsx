import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Copy, Gift, Loader2, MessageCircle, Send, ShieldAlert, Ticket, Users } from "lucide-react";

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
  const verified = stats?.verifiedReferrals || 0;
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
                Free delivery unlocks after 3 verified friends and any 1 paid order among them. INR 200 off unlocks after 5 friends complete their first paid orders.
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
                <div key={step} className={`h-3 rounded-full ${verified >= step ? "bg-indigo-700" : "bg-slate-200"}`} />
              ))}
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-2xl font-black text-slate-900">{verified}</p>
                <p className="text-xs font-bold text-slate-500">Verified</p>
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
          {(stats?.milestonesConfig || []).map((tier) => {
            const progressValue = tier.rewardType === "FREE_DELIVERY" ? verified : completed;
            return (
              <div key={tier.tier} className="rounded-[28px] bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                    <Gift className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900">
                      {tier.rewardType === "FREE_DELIVERY" ? "3 verified friends + 1 paid order" : "5 paid-order friends"}
                    </h3>
                    <p className="text-sm font-semibold text-slate-500">
                      {tier.rewardType === "FREE_DELIVERY" ? "Free delivery voucher" : `INR ${tier.rewardValue} off on INR ${tier.minOrderValue}+`}
                    </p>
                  </div>
                </div>
                <div className="mt-4 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-indigo-700" style={{ width: `${Math.min(100, (progressValue / tier.threshold) * 100)}%` }} />
                </div>
                <p className="mt-3 text-xs font-bold text-slate-500">
                  {tier.rewardType === "FREE_DELIVERY"
                    ? `${Math.min(verified, 3)}/3 verified, ${Math.min(completed, 1)}/1 paid order`
                    : `${Math.min(completed, 5)}/5 paid orders`}
                </p>
              </div>
            );
          })}
        </section>


        <section className="rounded-[28px] bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Referral Rules</h2>
              <p className="text-sm font-semibold text-slate-500">Rewards are vouchers, not cash balance.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="font-black text-emerald-800">Free delivery</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-emerald-700">
                3 friends must create accounts and verify OTP. From those 3 friends, any 1 friend must complete a first paid order.
              </p>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
              <p className="font-black text-indigo-800">INR 200 off</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-indigo-700">
                5 friends must create accounts, verify OTP, and each complete their first paid order. Minimum order value is INR 250.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
              <div className="flex gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" />
                <p className="text-sm font-semibold leading-6 text-slate-600">
                  Self-referrals, fake accounts, same-device abuse, cancelled/refunded orders, or suspicious activity may be rejected or held for review. Vouchers are non-transferable and expire in 30 days.
                </p>
              </div>
            </div>
          </div>
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


