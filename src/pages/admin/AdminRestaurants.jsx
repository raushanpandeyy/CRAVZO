import React, { useState, useEffect } from "react";
import { API_ENDPOINTS } from "../../constants/apiEndpoints.js";
import { apiRequest } from "../../services/api.js";

const AdminRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadRestaurants = async () => {
    setLoading(true);
    try {
      const response = await apiRequest(
        API_ENDPOINTS.admin.restaurants({
          page,
          limit: 10,
          query: search,
          status: statusFilter,
        })
      );
      setRestaurants(response.data || []);
      setTotalPages(response.meta?.totalPages || 1);
    } catch (err) {
      console.error("Failed to load", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, [page, search, statusFilter]);

  const updateStatus = async (restaurantId, currentStatus) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await apiRequest(API_ENDPOINTS.admin.restaurantStatus(restaurantId), {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setRestaurants(restaurants.map((r) => (r.id === restaurantId ? { ...r, status: newStatus } : r)));
    } catch (err) {
      console.error("Failed", err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "ACTIVE": return "bg-emerald-100 text-emerald-700";
      case "INACTIVE": return "bg-slate-100 text-slate-500";
      case "PENDING_APPROVAL": return "bg-amber-100 text-amber-700";
      default: return "bg-slate-100 text-slate-500";
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-20 md:pb-4">
      <div className="mx-2 md:mx-0 bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-4 md:p-6 text-white">
        <h1 className="text-xl md:text-2xl font-bold">Vendors</h1>
        <p className="text-indigo-200 text-sm">Manage restaurants & vendors</p>
      </div>

      {/* Filters */}
      <div className="mx-2 md:mx-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-2">
        <input
          type="text"
          placeholder="Search by name, city..."
          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl"
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
        />
        <select
          value={statusFilter}
          onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="PENDING_APPROVAL">Pending</option>
        </select>
      </div>

      {/* Restaurants List */}
      <div className="mx-2 md:mx-0 space-y-2">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : restaurants.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">No restaurants found</div>
        ) : (
          restaurants.map((restaurant) => (
            <div key={restaurant.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900">{restaurant.name}</p>
                  <p className="text-xs text-slate-500 truncate">{restaurant.addressLine1}, {restaurant.city}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusBadge(restaurant.status)}`}>
                      {restaurant.status === "PENDING_APPROVAL" ? "Pending" : restaurant.status}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${restaurant.isOpen ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {restaurant.isOpen ? "Open" : "Closed"}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Vendor: {restaurant.vendor?.name || "NA"}
                  </p>
                </div>
                <button
                  onClick={() => updateStatus(restaurant.id, restaurant.status)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full ${restaurant.status === "ACTIVE" ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"}`}
                >
                  {restaurant.status === "ACTIVE" ? "Suspend" : "Activate"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="mx-2 md:mx-0 flex items-center justify-between py-2 px-4 bg-white rounded-2xl border border-slate-200">
          <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="text-sm font-semibold text-slate-600 disabled:opacity-50">Previous</button>
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="text-sm font-semibold text-slate-600 disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
};

export default AdminRestaurants;