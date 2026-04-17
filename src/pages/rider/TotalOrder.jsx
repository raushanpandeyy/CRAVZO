import React, { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import RiderNavbar from "./RiderNav";
import { getRiderOrders } from "../../services/orderService";

const RiderAnalytics = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("weekly");

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await getRiderOrders();
        setOrders(data.filter((order) => !order.isAvailable));
      } catch (error) {
        console.error("Failed to load rider analytics", error);
      }
    };

    loadOrders();
  }, []);

  const deliveredOrders = orders.filter((order) => order.status === "DELIVERED");

  const earningsData = useMemo(() => {
    const totals = new Map();

    deliveredOrders.forEach((order) => {
      const date = new Date(order.updatedAt).toLocaleDateString("en-IN", { weekday: "short" });
      totals.set(date, (totals.get(date) || 0) + Number(order.deliveryFee || 0));
    });

    return Array.from(totals.entries()).map(([day, earnings]) => ({ day, earnings }));
  }, [deliveredOrders]);

  const areaData = useMemo(() => {
    const totals = new Map();

    deliveredOrders.forEach((order) => {
      const area = order.address?.city || "Unknown";
      totals.set(area, (totals.get(area) || 0) + 1);
    });

    return Array.from(totals.entries()).map(([area, ordersCount]) => ({ area, orders: ordersCount }));
  }, [deliveredOrders]);

  const summary = {
    earnings: deliveredOrders.reduce((sum, order) => sum + Number(order.deliveryFee || 0), 0),
    orders: deliveredOrders.length,
    active: orders.filter((order) => order.status === "OUT_FOR_DELIVERY").length,
  };

  const hotZone = areaData.length
    ? areaData.reduce((best, current) => (best.orders > current.orders ? best : current))
    : { area: "No zone yet" };

  return (
    <div className="min-h-screen bg-gray-100 pt-24 px-4 md:px-8 pb-24">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Rider Analytics Dashboard</h1>

        <div className="flex gap-3 mb-6">
          {["daily", "weekly", "monthly"].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`px-4 py-2 rounded-xl font-semibold ${filter === item ? "bg-purple-700 text-white" : "bg-white shadow"}`}
            >
              {item.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-2xl shadow">
            <h2>Total Delivery Earnings</h2>
            <p className="text-3xl font-bold text-purple-700">₹{summary.earnings.toFixed(0)}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow">
            <h2>Delivered Orders</h2>
            <p className="text-3xl font-bold text-purple-700">{summary.orders}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow">
            <h2>Active Deliveries</h2>
            <p className="text-3xl font-bold text-green-600">{summary.active}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow mb-6">
          <h2 className="mb-4 font-semibold">Earnings Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={earningsData}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="earnings" stroke="#6d28d9" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow mb-6">
          <h2 className="mb-4 font-semibold">Area Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={areaData}>
              <XAxis dataKey="area" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="orders" fill="#7c3aed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="mb-2 font-semibold">Hot Zone</h2>
          <p className="text-xl font-bold text-purple-700">{hotZone.area}</p>
          <p className="text-gray-500">Highest delivery completions so far</p>
        </div>
      </div>
      <RiderNavbar />
    </div>
  );
};

export default RiderAnalytics;
