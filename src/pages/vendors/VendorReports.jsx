import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarDays, IndianRupee, Package, ReceiptText, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { getVendorReports } from "../../services/analyticsService.js";
import { SkeletonCard, SkeletonRow } from "../../components/Skeleton.jsx";

const rangeOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const formatCurrency = (amount) => `Rs ${Number(amount || 0).toFixed(0)}`;
const formatNumber = (amount) => Number(amount || 0).toLocaleString("en-IN");

const SummaryCard = ({ title, value, subtitle, icon: Icon, tone = "indigo" }) => {
  const toneClass = {
    indigo: "bg-indigo-50 text-indigo-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-100 text-slate-700",
  }[tone];

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
          {subtitle ? <p className="mt-1 text-xs font-semibold text-slate-400">{subtitle}</p> : null}
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClass}`}>
          {React.createElement(Icon, { className: "h-5 w-5" })}
        </span>
      </div>
    </div>
  );
};

const VendorReports = () => {
  const [range, setRange] = useState("daily");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getVendorReports(range)
      .then((data) => {
        if (active) setReport(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Failed to load reports");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [range]);

  const fees = useMemo(() => {
    const summary = report?.summary || {};
    return [
      ["Subtotal", summary.subtotal],
      ["Packaging", summary.packagingFee],
      ["Delivery", summary.deliveryFee],
      ["Tax", summary.tax],
      ["Platform", summary.platformFee],
      ["Gateway", summary.gatewayFee],
      ["COD charge", summary.codCharge],
      ["Discount", -Number(summary.discount || 0)],
      ["Tips", summary.tips],
    ];
  }, [report]);

  const statuses = useMemo(() => Object.entries(report?.statusBreakdown || {}), [report]);

  return (
    <div className="min-h-screen bg-[#F4F7FB] px-4 py-4 md:px-6 md:py-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-950 text-white">
              <BarChart3 className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-3xl font-black text-slate-950 md:text-4xl">Sales Reports</h1>
              <p className="text-sm text-slate-500">Daily, weekly, monthly sales and menu item performance.</p>
            </div>
          </div>
        </div>

        <div className="flex rounded-2xl bg-white p-1 shadow-sm">
          {rangeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRange(option.value)}
              className={`rounded-xl px-4 py-2 text-sm font-black transition ${range === option.value ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : report ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard title="Total Sales" value={formatCurrency(report.summary.totalSales)} subtitle="Delivered order revenue" icon={IndianRupee} tone="emerald" />
            <SummaryCard title="Delivered Orders" value={formatNumber(report.summary.deliveredOrders)} subtitle={`${formatNumber(report.summary.totalOrders)} total orders`} icon={ReceiptText} />
            <SummaryCard title="Average Order" value={formatCurrency(report.summary.averageOrderValue)} subtitle="AOV for delivered orders" icon={TrendingUp} tone="amber" />
            <SummaryCard title="Menu Sold" value={formatNumber(report.menuPopularity.reduce((sum, item) => sum + item.unitsSold, 0))} subtitle={`${report.menuPopularity.length} selling items`} icon={Package} tone="slate" />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
            <section className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-950">Sales Trend</h2>
                  <p className="text-xs font-semibold text-slate-400">{report.bucket} buckets for selected range</p>
                </div>
                <CalendarDays className="h-5 w-5 text-slate-400" />
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.salesTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value, name) => name === "sales" ? formatCurrency(value) : value} />
                    <Bar dataKey="sales" fill="#4f46e5" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">Fees & Taxes</h2>
              <div className="mt-4 space-y-3">
                {fees.map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                    <span className="font-bold text-slate-600">{label}</span>
                    <span className={`font-black ${Number(value) < 0 ? "text-emerald-600" : "text-slate-950"}`}>{formatCurrency(value)}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
            <section className="rounded-3xl bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">Order Status</h2>
              <div className="mt-4 space-y-3">
                {statuses.length ? statuses.map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-sm">
                    <span className="font-bold text-slate-600">{status.replaceAll("_", " ")}</span>
                    <span className="font-black text-slate-950">{count}</span>
                  </div>
                )) : <p className="py-8 text-center text-sm font-bold text-slate-400">No orders in this range.</p>}
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-950">Menu Popularity</h2>
                  <p className="text-xs font-semibold text-slate-400">Ranked by units sold, then revenue.</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="text-xs uppercase text-slate-400">
                    <tr>
                      <th className="py-3">Rank</th>
                      <th className="py-3">Item</th>
                      <th className="py-3">Category</th>
                      <th className="py-3 text-right">Units</th>
                      <th className="py-3 text-right">Revenue</th>
                      <th className="py-3 text-right">Order Lines</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.menuPopularity.map((item, index) => (
                      <tr key={item.menuItemId}>
                        <td className="py-3 font-black text-slate-500">#{index + 1}</td>
                        <td className="py-3 font-black text-slate-950">{item.name}</td>
                        <td className="py-3 text-slate-500">{item.category}</td>
                        <td className="py-3 text-right font-black text-indigo-700">{item.unitsSold}</td>
                        <td className="py-3 text-right font-black text-slate-950">{formatCurrency(item.revenue)}</td>
                        <td className="py-3 text-right text-slate-500">{item.orderLines}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!report.menuPopularity.length ? <p className="py-10 text-center text-sm font-bold text-slate-400">No delivered items in this range.</p> : null}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default VendorReports;

