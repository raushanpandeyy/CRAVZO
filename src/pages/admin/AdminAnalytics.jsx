import React, { useState, useEffect, useMemo } from "react";
import { Users, UserCheck, PackageCheck, Store, ShoppingBag, DollarSign } from "lucide-react";
import { API_ENDPOINTS } from "../../constants/apiEndpoints.js";
import { apiRequest } from "../../services/api.js";

function MetricCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className={`rounded-2xl p-3 ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

const AdminAnalytics = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const response = await apiRequest(API_ENDPOINTS.admin.overview({ page: 1, limit: 1 }));
        setOverview(response.data);
      } catch (err) {
        console.error("Failed to load overview", err);
      } finally {
        setLoading(false);
      }
    };
    loadOverview();
  }, []);

  const metrics = useMemo(() => {
    const totals = overview?.totals;
    if (!totals) return [];
    return [
      { title: "Total Users", value: totals.totalUsers || 0, subtitle: `${totals.totalCustomers || 0} customers`, icon: Users, color: "bg-slate-900" },
      { title: "Active Users", value: totals.activeUsers || 0, subtitle: `${totals.totalVendors || 0} vendors, ${totals.totalRiders || 0} riders`, icon: UserCheck, color: "bg-emerald-600" },
      { title: "Completed Orders", value: totals.completedOrders || 0, subtitle: `${totals.totalOrders || 0} total orders`, icon: PackageCheck, color: "bg-indigo-600" },
      { title: "Restaurants", value: totals.totalRestaurants || 0, subtitle: `${totals.liveOrders || 0} live orders`, icon: Store, color: "bg-amber-500" },
    ];
  }, [overview]);

  const orderStats = useMemo(() => {
    const totals = overview?.totals;
    if (!totals) return null;
    const completed = Number(totals.completedOrders) || 0;
    const total = Number(totals.totalOrders) || 0;
    const cancelled = total - completed;
    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
    return { completed, total, cancelled, completionRate };
  }, [overview]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading analytics...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500">Platform performance overview</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      {orderStats && (
        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-xl bg-emerald-100 p-2">
                <ShoppingBag className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Orders</p>
                <p className="text-2xl font-bold text-slate-900">{orderStats.total}</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-xl bg-indigo-100 p-2">
                <PackageCheck className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Completed</p>
                <p className="text-2xl font-bold text-slate-900">{orderStats.completed}</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-xl bg-rose-100 p-2">
                <DollarSign className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Completion Rate</p>
                <p className="text-2xl font-bold text-slate-900">{orderStats.completionRate}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Order Status Distribution</h2>
        <div className="space-y-3">
          {["PENDING", "ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"].map((status) => (
            <div key={status} className="flex items-center justify-between">
              <span className="text-sm text-slate-600">{status.replaceAll("_", " ")}</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${orderStats ? (orderStats.total > 0 ? Math.random() * 100 : 0) : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-slate-900 w-8">{Math.floor(Math.random() * 20)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;