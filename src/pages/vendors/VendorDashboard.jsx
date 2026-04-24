import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Clock, IndianRupee, ShoppingBag, Store } from "lucide-react";

<<<<<<< HEAD
import { getVendorOrders } from "../../services/orderService.js";
import { getMyRestaurant, updateRestaurantAvailability } from "../../services/vendorService.js";
=======
import { getVendorOrders } from "../../services/orderService";
import { getMyRestaurant } from "../../services/vendorService";
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594

const formatCurrency = (amount) => `Rs ${Number(amount || 0).toFixed(0)}`;

const VendorDashboard = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
<<<<<<< HEAD
  const [message, setMessage] = useState("");
=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
<<<<<<< HEAD
    setMessage("");
=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
    setError("");

    try {
      const [restaurantData, orderData] = await Promise.all([getMyRestaurant(), getVendorOrders()]);
      setRestaurant(restaurantData);
      setOrders(orderData);
    } catch (requestError) {
      setError(requestError.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

<<<<<<< HEAD
  const handleToggleRestaurant = async () => {
    if (!restaurant) {
      return;
    }

    setMessage("");
    setError("");

    try {
      const updatedRestaurant = await updateRestaurantAvailability(restaurant.id, !restaurant.isOpen);
      setRestaurant((current) => ({
        ...(current || {}),
        ...updatedRestaurant,
      }));
      setMessage(`Restaurant is now ${updatedRestaurant.isOpen ? "online" : "offline"}.`);
    } catch (requestError) {
      setError(requestError.message || "Failed to update restaurant availability");
    }
  };

=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
  const stats = useMemo(() => {
    const activeOrders = orders.filter((order) => ["PENDING", "ACCEPTED", "PREPARING"].includes(order.status));
    const completedOrders = orders.filter((order) => order.status === "DELIVERED");
    const earnings = completedOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

    return {
      totalOrders: orders.length,
      activeOrders: activeOrders.length,
      menuItems: restaurant?.menuItems?.length || 0,
      earnings,
    };
  }, [orders, restaurant]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  return (
    <div className="px-6 py-6 bg-[#F4F7FB] min-h-screen">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">{restaurant?.name || "Vendor Dashboard"}</h1>
          <p className="text-gray-600 text-sm mt-1">
            {restaurant
              ? `${restaurant.cuisine || "Restaurant"} in ${restaurant.city || "your city"}`
              : "Create your restaurant profile to start receiving and managing orders."}
          </p>
        </div>
        <button
          onClick={loadDashboard}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}
<<<<<<< HEAD
      {message ? (
        <div className="mb-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>
      ) : null}
=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594

      {!restaurant && !loading ? (
        <div className="mb-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-semibold">Restaurant profile missing</p>
              <p className="mt-1 text-sm">
                Complete your profile from the vendor profile page, then add menu items to go live.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Restaurant Status</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{restaurant?.status || "Not set"}</p>
<<<<<<< HEAD
              {restaurant ? (
                <button
                  onClick={handleToggleRestaurant}
                  className={`mt-3 rounded-full px-4 py-2 text-xs font-semibold text-white ${
                    restaurant.isOpen ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  Go {restaurant.isOpen ? "Offline" : "Online"}
                </button>
              ) : null}
=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
            </div>
            <div className="rounded-2xl bg-slate-100 p-3">
              <Store className="h-6 w-6 text-slate-700" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Orders</p>
              <p className="mt-2 text-2xl font-bold text-orange-600">{stats.activeOrders}</p>
            </div>
            <div className="rounded-2xl bg-orange-100 p-3">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Menu Items</p>
              <p className="mt-2 text-2xl font-bold text-indigo-600">{stats.menuItems}</p>
            </div>
            <div className="rounded-2xl bg-indigo-100 p-3">
              <ShoppingBag className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Delivered Earnings</p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">{formatCurrency(stats.earnings)}</p>
            </div>
            <div className="rounded-2xl bg-emerald-100 p-3">
              <IndianRupee className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Recent Orders</h2>
              <p className="mt-1 text-sm text-slate-500">Latest backend orders for your restaurant</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {stats.totalOrders} total
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-gray-500">Loading dashboard...</div>
          ) : recentOrders.length ? (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">Order #{order.id.slice(-6)}</p>
                      <p className="mt-1 text-sm text-slate-600">{order.customer?.name || "Customer"}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {order.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                    <span>{order.items?.length || 0} items</span>
                    <span>{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-gray-500">No orders have reached this restaurant yet.</div>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Store Snapshot</h2>
          <div className="mt-5 space-y-4 text-sm text-slate-600">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Open for orders</p>
              <p className="mt-1">{restaurant?.isOpen ? "Yes, customers can place orders." : "No, the storefront is closed."}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Address</p>
              <p className="mt-1">
                {[restaurant?.addressLine1, restaurant?.city, restaurant?.state, restaurant?.postalCode]
                  .filter(Boolean)
                  .join(", ") || "Add your restaurant address from the profile page."}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Menu readiness</p>
              <p className="mt-1">
                {stats.menuItems
                  ? `${stats.menuItems} items currently configured for this restaurant.`
                  : "Add menu items so customers can start ordering."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
