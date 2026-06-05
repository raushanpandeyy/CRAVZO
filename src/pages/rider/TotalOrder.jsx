import React, {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getRiderOrders } from "../../services/orderService.js";

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

  // Earnings data
  const earningsData = useMemo(() => {
    const totals = new Map();

    deliveredOrders.forEach((order) => {
      const date = new Date(
        order.updatedAt
      ).toLocaleDateString("en-IN", {
        weekday: "short",
      });

      totals.set(
        date,
        (totals.get(date) || 0) +
          Number(order.deliveryFee || 0)
      );
    });

    return Array.from(totals.entries()).map(
      ([day, earnings]) => ({
        day,
        earnings,
      })
    );
  }, [deliveredOrders]);

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
      earnings: deliveredOrders.reduce(
        (sum, order) =>
          sum + Number(order.deliveryFee || 0),
        0
      ),

      orders: deliveredOrders.length,

      active: orders.filter(
        (order) =>
          order.status === "OUT_FOR_DELIVERY"
      ).length,
    };
  }, [deliveredOrders, orders]);

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
        <div className="grid md:grid-cols-3 gap-6 mb-6">
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

