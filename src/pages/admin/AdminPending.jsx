import React, { useState, useEffect } from "react";
import { Store, UserCheck } from "lucide-react";
import { API_ENDPOINTS } from "../../constants/apiEndpoints.js";
import { apiRequest } from "../../services/api.js";

const AdminPending = () => {
  const [pendingVendors, setPendingVendors] = useState([]);
  const [pendingRiders, setPendingRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadPending = async () => {
    setLoading(true);
    try {
      const [vendorsRes, ridersRes] = await Promise.all([
        apiRequest(API_ENDPOINTS.admin.pendingVendors),
        apiRequest(API_ENDPOINTS.admin.pendingRiders),
      ]);
      setPendingVendors(vendorsRes.data || []);
      setPendingRiders(ridersRes.data || []);
    } catch (err) {
      console.error("Failed to load", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const approveVendor = async (vendorId) => {
    try {
      await apiRequest(API_ENDPOINTS.admin.approveVendor(vendorId), { method: "PATCH" });
      setPendingVendors(pendingVendors.filter((v) => v.id !== vendorId));
      setMessage("Vendor approved");
    } catch {
      setError("Failed to approve");
    }
  };

  const approveRider = async (riderId) => {
    try {
      await apiRequest(API_ENDPOINTS.admin.approveRider(riderId), { method: "PATCH" });
      setPendingRiders(pendingRiders.filter((r) => r.id !== riderId));
      setMessage("Rider approved");
    } catch {
      setError("Failed to approve");
    }
  };

  const getDetails = (user) => user.vendorOnboarding || user.riderOnboarding || {};

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-20 md:pb-4">
      <div className="mx-2 md:mx-0 bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-4 md:p-6 text-white">
        <h1 className="text-xl md:text-2xl font-bold">Pending Approvals</h1>
        <p className="text-indigo-200 text-sm">Review applications</p>
      </div>

      {message && (
        <div className="mx-2 md:mx-0 rounded-xl bg-emerald-50 px-4 py-2.5 text-emerald-700 text-sm font-medium">{message}</div>
      )}
      {error && (
        <div className="mx-2 md:mx-0 rounded-xl bg-red-50 px-4 py-2.5 text-red-700 text-sm font-medium">{error}</div>
      )}

      {/* Vendors */}
      <div className="mx-2 md:mx-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Store className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Pending Vendors</h2>
            <p className="text-xs text-slate-500">{pendingVendors.length} pending</p>
          </div>
        </div>

        {pendingVendors.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-500 bg-slate-50 rounded-xl">No pending vendors</div>
        ) : (
          <div className="space-y-2">
            {pendingVendors.map((user) => {
              const details = getDetails(user);
              return (
                <div key={user.id} className="border border-slate-200 rounded-xl p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    <button
                      onClick={() => approveVendor(user.id)}
                      className="bg-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-full"
                    >
                      Approve
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    {Object.entries(details).filter(([, v]) => v).slice(0, 4).map(([key, value]) => (
                      <div key={key} className="bg-slate-50 px-2 py-1 rounded">
                        <span className="font-semibold text-slate-600 capitalize">{key.replace(/([A-Z])/g, " $1")}: </span>
                        <span className="text-slate-500">{String(value).slice(0, 20)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Riders */}
      <div className="mx-2 md:mx-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <UserCheck className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Pending Riders</h2>
            <p className="text-xs text-slate-500">{pendingRiders.length} pending</p>
          </div>
        </div>

        {pendingRiders.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-500 bg-slate-50 rounded-xl">No pending riders</div>
        ) : (
          <div className="space-y-2">
            {pendingRiders.map((user) => {
              const details = getDetails(user);
              return (
                <div key={user.id} className="border border-slate-200 rounded-xl p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    <button
                      onClick={() => approveRider(user.id)}
                      className="bg-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-full"
                    >
                      Approve
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    {Object.entries(details).filter(([, v]) => v).slice(0, 4).map(([key, value]) => (
                      <div key={key} className="bg-slate-50 px-2 py-1 rounded">
                        <span className="font-semibold text-slate-600 capitalize">{key.replace(/([A-Z])/g, " $1")}: </span>
                        <span className="text-slate-500">{String(value).slice(0, 20)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPending;