import React, { useEffect, useMemo, useState } from "react";
import { Clock3, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import cart from "../../assets/logos/cart.png";
import SearchBar from "../../components/common/Searchbar.jsx";
import { cancelOrder, getMyOrders } from "../../services/orderService.js";

export default function Orders() {
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadOrders = async () => {
    try {
      const data = await getMyOrders();
      setOrders(data);
    } catch (requestError) {
      console.error("Failed to load orders", requestError);
      setError(requestError.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const cancellableStatuses = ["PENDING", "ACCEPTED", "PREPARING", "READY_FOR_PICKUP"];

  const handleCancelOrder = async (event, orderId) => {
    event.preventDefault();
    event.stopPropagation();
    setMessage("");
    setError("");

    try {
      await cancelOrder(orderId);
      setMessage("Order cancelled successfully.");
      await loadOrders();
    } catch (requestError) {
      setError(requestError.message || "Failed to cancel order");
    }
  };

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const items = order.items?.map((item) => item.menuItem?.name || "").join(" ");
        return (
          (order.restaurant?.name || "").toLowerCase().includes(search.toLowerCase()) ||
          items.toLowerCase().includes(search.toLowerCase())
        );
      }),
    [orders, search],
  );

  return (
    <div className="min-h-screen bg-gray-100 sm:pl-80 sm:pr-10 px-4 py-8 flex flex-col items-center">
      <div className="w-full max-w-4xl mb-8">
        <SearchBar
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search orders, restaurants or dishes..."
        />
      </div>

      <div className="w-full max-w-7xl flex flex-col gap-4">
        {message ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
        {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-3xl shadow-md border border-indigo-100">
          <div>
            <h1 className="text-3xl font-bold text-indigo-900">My Orders</h1>
            <p className="text-gray-600">Track your recent meals and open the restaurant page directly.</p>
          </div>
          <div className="inline-flex items-center gap-2 text-sm text-indigo-700 font-semibold">
            <Clock3 className="w-5 h-5" />
            Recent Orders
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold text-indigo-900 mb-2">Loading orders...</h2>
          </div>
        ) : orders.length > 0 ? (
          filteredOrders.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {filteredOrders.map((order) => (
                <Link
                  to={order.restaurant?.id ? `/restaurant/${order.restaurant.id}` : "/"}
                  key={order.id}
                  className="group bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition duration-300"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={order.restaurant?.imageUrl || cart}
                      alt={order.restaurant?.name || "Order"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-4 left-4 bg-indigo-900 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {order.status}
                    </span>
                  </div>

                  <div className="p-5 flex flex-col gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-indigo-900">{order.restaurant?.name || "Restaurant"}</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {order.items?.map((item) => item.menuItem?.name).filter(Boolean).join(", ")}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-sm text-gray-600">
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      <span className="font-bold text-indigo-900">?{order.totalAmount}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-yellow-600 font-semibold">{order.paymentMethod}</div>
                      <div className="flex items-center gap-3">
                        {cancellableStatuses.includes(order.status) ? (
                          <button
                            onClick={(event) => handleCancelOrder(event, order.id)}
                            className="rounded-full bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                          >
                            Cancel Order
                          </button>
                        ) : null}
                        <span className="inline-flex items-center gap-2 text-indigo-700 font-semibold hover:text-indigo-900">
                          Open Restaurant <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-md border border-gray-200">
              <img src={cart} alt="No Orders" className="w-60 mb-4 opacity-60" />
              <h2 className="text-2xl font-semibold text-indigo-900 mb-2">No matching orders</h2>
              <p className="text-gray-500">Try searching for another restaurant or dish.</p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-md border border-gray-200">
            <img src={cart} alt="No Orders" className="w-60 mb-4 opacity-60" />
            <h2 className="text-2xl font-semibold text-indigo-900 mb-2">No orders yet</h2>
            <p className="text-gray-500">Your order history will show up here once you place a meal.</p>
          </div>
        )}
      </div>
    </div>
  );
}
