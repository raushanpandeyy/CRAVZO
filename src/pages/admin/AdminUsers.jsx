import React, { useState, useEffect } from "react";
import { ChevronRight, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "../../constants/apiEndpoints.js";
import { apiRequest } from "../../services/api.js";

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await apiRequest(
        API_ENDPOINTS.admin.users({
          page,
          limit: 10,
          query: search,
          role: roleFilter,
          status: statusFilter,
        })
      );
      setUsers((response.data || []).filter((u) => u.role !== "ADMIN"));
      setTotalPages(response.meta?.totalPages || 1);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, search, roleFilter, statusFilter]);

  const updateStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === "BLOCKED" ? "ACTIVE" : "BLOCKED";
    try {
      await apiRequest(API_ENDPOINTS.admin.userStatus(userId), {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setUsers(users.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)));
    } catch (err) {
      console.error("Failed to update", err);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "VENDOR": return "bg-amber-100 text-amber-700";
      case "RIDER": return "bg-indigo-100 text-indigo-700";
      default: return "bg-emerald-100 text-emerald-700";
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-20 md:pb-4">
      <div className="mx-2 md:mx-0 bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-4 md:p-6 text-white">
        <h1 className="text-xl md:text-2xl font-bold">Users</h1>
        <p className="text-indigo-200 text-sm">Manage all users</p>
      </div>

      {/* Search & Filters */}
      <div className="mx-2 md:mx-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-2">
        <input
          type="text"
          placeholder="Search by name, phone, email..."
          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl"
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
        />
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
          <select
            value={roleFilter}
            onChange={(e) => { setPage(1); setRoleFilter(e.target.value); }}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl whitespace-nowrap"
          >
            <option value="">All Roles</option>
            <option value="CUSTOMER">Customer</option>
            <option value="VENDOR">Vendor</option>
            <option value="RIDER">Rider</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl whitespace-nowrap"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <div className="mx-2 md:mx-0 space-y-2">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">No users found</div>
        ) : (
          users.map((user) => (
            <div key={user.id} onClick={() => navigate(`/admin/users/${user.id}`)} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getRoleBadge(user.role)}`}>
                      {user.role}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${user.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {user.status}
                    </span>
                    {user.role === "RIDER" && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${user.isOnline ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        {user.isOnline ? "Online" : "Offline"}
                      </span>
                    )}
                    {user.referral?.received && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        <Gift size={10} /> Referred
                      </span>
                    )}
                    {(user.referral?.madeSummary?.total || 0) > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        <Gift size={10} /> {user.referral.madeSummary.qualified || 0}/{user.referral.madeSummary.total} qualified
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); updateStatus(user.id, user.status); }}
                      className={`text-xs font-bold px-3 py-1.5 rounded-full ${user.status === "BLOCKED" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}
                    >
                      {user.status === "BLOCKED" ? "Unblock" : "Block"}
                    </button>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
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

export default AdminUsers;