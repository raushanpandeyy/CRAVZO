import React, {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getRiderOrders } from "../../services/orderService.js";
const formatDistance = (distance) => {
  const value = Number(distance || 0);
  if (!Number.isFinite(value) || value <= 0) return "N/A";
  return `${value.toFixed(value < 10 ? 1 : 0)} km`;
};

const formatCurrency = (amount) => `Rs ${Math.floor(Number(amount || 0))}`;

// Lazy Loaded Charts
const EarningsChart = lazy(() =>
  import("./EarningsChart.jsx")
);

const AreaChart = lazy(() =>
  import("./AreaChart.jsx")
);

const RiderAnalytics = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("weekly");

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);

        const rawData = await getRiderOrders();
        const data = Array.isArray(rawData) ? rawData : [];

        setOrders(
          data.filter((order) => !order.isAvailable)
        );
      } catch (error) {
        console.error(
          "Failed to load rider analytics",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  // Memoized delivered orders
  const deliveredOrders = useMemo(() => {
    return orders.filter(
      (order) => order.status === "DELIVERED"
    );
  }, [orders]);

  const earningOrders = useMemo(() => {
    return orders.filter(
      (order) => order.status === "DELIVERED" || Number(order.riderCancellationEarning || 0) > 0
    );
  }, [orders]);

  // Earnings data
  const earningsData = useMemo(() => {
    const totals = new Map();

    earningOrders.forEach((order) => {
      const date = new Date(
        order.updatedAt
      ).toLocaleDateString("en-IN", {
        weekday: "short",
      });

      totals.set(
        date,
        (totals.get(date) || 0) +
          (order.status === "CANCELLED" ? Number(order.riderCancellationEarning || 0) : Number(order.deliveryFee || 0))
      );
    });

    return Array.from(totals.entries()).map(
      ([day, earnings]) => ({
        day,
        earnings,
      })
    );
  }, [earningOrders]);

  // Area analytics
  const areaData = useMemo(() => {
    const totals = new Map();

    deliveredOrders.forEach((order) => {
      const area =
        order.address?.city || "Unknown";

      totals.set(
        area,
        (totals.get(area) || 0) + 1
      );
    });

    return Array.from(totals.entries()).map(
      ([area, ordersCount]) => ({
        area,
        orders: ordersCount,
      })
    );
  }, [deliveredOrders]);

  // Summary cards
  const summary = useMemo(() => {
    return {
      earnings: earningOrders.reduce(
        (sum, order) =>
          sum + (order.status === "CANCELLED" ? Number(order.riderCancellationEarning || 0) : Number(order.deliveryFee || 0)),
        0
      ),

      orders: deliveredOrders.length,

      active: orders.filter(
        (order) =>
          order.status === "OUT_FOR_DELIVERY"
      ).length,

      distance: deliveredOrders.reduce(
        (sum, order) => sum + Number(order.deliveryDistance || 0),
        0
      ),
    };
  }, [deliveredOrders, earningOrders, orders]);

  // Hot zone analytics
  const hotZone = useMemo(() => {
    return areaData.length
      ? areaData.reduce((best, current) =>
          best.orders > current.orders
            ? best
            : current
        )
      : { area: "No zone yet" };
  }, [areaData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 pt-4 pb-24 md:px-8 md:pt-24">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          Rider Analytics Dashboard
        </h1>

        {/* Filter Buttons */}
        <div className="flex gap-3 mb-6">
          {["daily", "weekly", "monthly"].map(
            (item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`px-4 py-2 rounded-xl font-semibold ${
                  filter === item
                    ? "bg-purple-700 text-white"
                    : "bg-white shadow"
                }`}
              >
                {item.toUpperCase()}
              </button>
            )
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 mb-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white p-6 rounded-2xl shadow">
            <h2>Total Delivery Earnings</h2>
            <p className="text-3xl font-bold text-purple-700">
              ₹{summary.earnings.toFixed(0)}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow">
            <h2>Delivered Orders</h2>
            <p className="text-3xl font-bold text-purple-700">
              {summary.orders}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow">
            <h2>Active Deliveries</h2>
            <p className="text-3xl font-bold text-green-600">
              {summary.active}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow">
            <h2>Total Delivered Km</h2>
            <p className="text-3xl font-bold text-indigo-700">
              {formatDistance(summary.distance)}
            </p>
          </div>
        </div>

        {/* Earnings Chart */}
        <div className="bg-white p-6 rounded-2xl shadow mb-6">
          <h2 className="mb-4 font-semibold">
            Earnings Trend
          </h2>

          <Suspense
            fallback={
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                Loading chart...
              </div>
            }
          >
            <EarningsChart data={earningsData} />
          </Suspense>
        </div>

        {/* Area Chart */}
        <div className="bg-white p-6 rounded-2xl shadow mb-6">
          <h2 className="mb-4 font-semibold">
            Area Performance
          </h2>

          <Suspense
            fallback={
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                Loading chart...
              </div>
            }
          >
            <AreaChart data={areaData} />
          </Suspense>
        </div>


        {/* Recent Delivered Distances */}
        <div className="bg-white p-6 rounded-2xl shadow mb-6">
          <h2 className="mb-4 font-semibold">
            Recent Completed Delivery Km
          </h2>

          {deliveredOrders.length === 0 ? (
            <p className="text-sm text-slate-500">No completed delivery distance yet.</p>
          ) : (
            <div className="space-y-3">
              {deliveredOrders.slice(0, 8).map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Order #{order.id?.slice(-6)}</p>
                    <p className="text-xs text-slate-500">{order.restaurant?.name || order.address?.city || "Delivered order"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-indigo-700">{formatDistance(order.deliveryDistance)}</p>
                    <p className="text-xs font-semibold text-slate-500">{formatCurrency(order.deliveryFee)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Hot Zone */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="mb-2 font-semibold">
            Hot Zone
          </h2>

          <p className="text-xl font-bold text-purple-700">
            {hotZone.area}
          </p>

          <p className="text-gray-500">
            Highest delivery completions so far
          </p>
        </div>
      </div>
    </div>
  );
};

export default RiderAnalytics;



