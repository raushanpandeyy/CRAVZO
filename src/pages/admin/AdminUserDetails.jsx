import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Award, Banknote, ChefHat, Clock, Gift, Package, ShieldAlert, ShoppingBag, Star, TicketCheck, Truck, User, Users, X } from "lucide-react";
import { API_ENDPOINTS } from "../../constants/apiEndpoints.js";
import { apiRequest } from "../../services/api.js";

const formatCurrency = (amount) => `₹${Math.floor(amount || 0)}`;
const formatDate = (date) => date ? new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A";

const AdminUserDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderSearch, setOrderSearch] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [userRes, ordersRes] = await Promise.all([
          apiRequest(API_ENDPOINTS.admin.user(userId)),
          apiRequest(API_ENDPOINTS.admin.userOrders(userId))
        ]);
        setUser(userRes.data);
        setOrders(ordersRes.data || []);
      } catch (err) {
        console.error("Failed to load user", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userId]);

  const getRoleBadge = (role) => {
    switch (role) {
      case "VENDOR": return "bg-amber-100 text-amber-700";
      case "RIDER": return "bg-indigo-100 text-indigo-700";
      default: return "bg-emerald-100 text-emerald-700";
    }
  };

  const getReferralStatusBadge = (status) => {
    switch (status) {
      case "COMPLETED": return "bg-emerald-100 text-emerald-700";
      case "OTP_VERIFIED": return "bg-blue-100 text-blue-700";
      case "SUSPECT": return "bg-rose-100 text-rose-700";
      case "CANCELLED": return "bg-slate-200 text-slate-700";
      default: return "bg-amber-100 text-amber-700";
    }
  };

  const formatReferralStatus = (status) => status ? status.replaceAll("_", " ") : "N/A";

  const stats = {
    totalOrders: orders.length,
    completedOrders: orders.filter(o => o.status === "DELIVERED").length,
    totalSpent: orders.filter(o => o.status === "DELIVERED").reduce((sum, o) => sum + Number(o.totalAmount || 0), 0),
    totalEarnings: orders.filter(o => o.status === "DELIVERED").reduce((sum, o) => {
      if (user.role === "VENDOR") return sum + Number(o.vendorEarnings || 0);
      if (user.role === "RIDER") return sum + Number(o.riderEarnings || 0);
      return sum;
    }, 0),
  };

  const filteredOrders = orderSearch
    ? orders.filter(o => o.id.toLowerCase().includes(orderSearch.toLowerCase()))
    : orders.slice(0, 7);
  const showAllCount = !orderSearch && orders.length > 7;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
          <div className="h-64 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto p-4 text-center py-12">
        <p className="text-slate-500">User not found</p>
        <button onClick={() => navigate("/admin/users")} className="mt-4 text-indigo-600 font-semibold">Back to Users</button>
      </div>
    );
  }

  const referral = user.referral || {};
  const madeSummary = referral.madeSummary || {};
  const hasReferralActivity = Boolean(referral.received) || (madeSummary.total || 0) > 0 || (referral.milestones || []).length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-20 md:pb-4">
      <button onClick={() => navigate("/admin/users")} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium">
        <ArrowLeft size={20} /> Back to Users
      </button>

      {/* User Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            {user.role === "VENDOR" ? <ChefHat className="h-8 w-8 text-amber-600" /> : user.role === "RIDER" ? <Truck className="h-8 w-8 text-indigo-600" /> : <User className="h-8 w-8 text-emerald-600" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${getRoleBadge(user.role)}`}>{user.role}</span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${user.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{user.status}</span>
            </div>
            <p className="text-sm text-slate-500 mt-1">{user.email}</p>
            {user.phone && <p className="text-sm text-slate-500">{user.phone}</p>}
            {user.role === "RIDER" && (
              <p className={`text-xs font-bold mt-2 ${user.isOnline ? "text-green-600" : "text-slate-500"}`}>{user.isOnline ? "● Online" : "○ Offline"}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Joined</p>
            <p className="text-sm font-semibold text-slate-700">{formatDate(user.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {user.role === "CUSTOMER" ? (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-1"><ShoppingBag size={16} /><span className="text-xs">Total Orders</span></div>
              <p className="text-2xl font-bold text-slate-900">{stats.totalOrders}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-1"><Package size={16} /><span className="text-xs">Completed</span></div>
              <p className="text-2xl font-bold text-emerald-600">{stats.completedOrders}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 md:col-span-2">
              <div className="flex items-center gap-2 text-slate-500 mb-1"><Banknote size={16} /><span className="text-xs">Total Spent</span></div>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalSpent)}</p>
            </div>
          </>
        ) : user.role === "VENDOR" ? (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-1"><ShoppingBag size={16} /><span className="text-xs">Total Orders</span></div>
              <p className="text-2xl font-bold text-slate-900">{stats.totalOrders}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-1"><Package size={16} /><span className="text-xs">Completed</span></div>
              <p className="text-2xl font-bold text-emerald-600">{stats.completedOrders}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 md:col-span-2">
              <div className="flex items-center gap-2 text-slate-500 mb-1"><Banknote size={16} /><span className="text-xs">Total Earnings</span></div>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.totalEarnings)}</p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-1"><Package size={16} /><span className="text-xs">Completed</span></div>
              <p className="text-2xl font-bold text-slate-900">{stats.completedOrders}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-1"><Star size={16} /><span className="text-xs">Rating</span></div>
              <p className="text-2xl font-bold text-amber-600">{user.rating?.toFixed(1) || "N/A"}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 md:col-span-2">
              <div className="flex items-center gap-2 text-slate-500 mb-1"><Banknote size={16} /><span className="text-xs">Total Earnings</span></div>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.totalEarnings)}</p>
            </div>
          </>
        )}
      </div>

      {/* Referral Audit */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Gift size={20} />Referral Audit</h2>
          {user.referralCode && (
            <span className="self-start rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">Code: {user.referralCode}</span>
          )}
        </div>

        {!hasReferralActivity ? (
          <p className="text-sm text-slate-500">No referral activity found for this user.</p>
        ) : (
          <div className="space-y-4">
            {referral.received && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="font-semibold text-blue-900 flex items-center gap-2"><Users size={16} />Account came from referral</p>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${getReferralStatusBadge(referral.received.status)}`}>
                    {formatReferralStatus(referral.received.status)}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                  <div><p className="text-blue-700/70">Referrer</p><p className="font-semibold text-slate-900">{referral.received.referrer?.name || "N/A"}</p></div>
                  <div><p className="text-blue-700/70">Referrer Phone</p><p className="font-semibold text-slate-900">{referral.received.referrer?.phone || "N/A"}</p></div>
                  <div><p className="text-blue-700/70">Signup Tracked</p><p className="font-semibold text-slate-900">{formatDate(referral.received.createdAt)}</p></div>
                  <div><p className="text-blue-700/70">Qualified Order</p><p className="font-semibold text-slate-900">{referral.received.paidOrderId ? `#${referral.received.paidOrderId.slice(-6).toUpperCase()}` : "Not yet"}</p></div>
                </div>
                {referral.received.suspectFlag && (
                  <div className="mt-3 rounded-xl border border-rose-200 bg-white p-3 text-sm text-rose-700 flex gap-2">
                    <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                    <span>{referral.received.suspectReason || "Marked suspect for admin review."}</span>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Shared Signups</p>
                <p className="text-2xl font-bold text-slate-900">{madeSummary.verified || 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Paid Qualified</p>
                <p className="text-2xl font-bold text-emerald-600">{madeSummary.qualified || 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Pending</p>
                <p className="text-2xl font-bold text-amber-600">{madeSummary.pending || 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Suspect</p>
                <p className="text-2xl font-bold text-rose-600">{madeSummary.suspect || 0}</p>
              </div>
            </div>

            {(referral.milestones || []).length > 0 && (
              <div>
                <p className="mb-2 font-semibold text-slate-900 flex items-center gap-2"><Award size={16} />Rewards Issued</p>
                <div className="space-y-2">
                  {referral.milestones.map((milestone) => (
                    <div key={milestone.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 text-sm md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">Tier {milestone.tier} - {milestone.rewardType.replaceAll("_", " ")}</p>
                        <p className="text-xs text-slate-500">{milestone.voucherCode} | {formatCurrency(milestone.rewardValue)} | expires {formatDate(milestone.expiresAt)}</p>
                      </div>
                      <span className="self-start rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700 md:self-auto">{milestone.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(referral.made || []).length > 0 && (
              <div>
                <p className="mb-2 font-semibold text-slate-900 flex items-center gap-2"><TicketCheck size={16} />Recent Referred Accounts</p>
                <div className="space-y-2">
                  {referral.made.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{item.referred?.name || "N/A"}</p>
                          <p className="truncate text-xs text-slate-500">{item.referred?.phone || item.referred?.email || "No contact"}</p>
                        </div>
                        <span className={`self-start rounded-full px-2 py-1 text-[10px] font-bold md:self-auto ${getReferralStatusBadge(item.status)}`}>
                          {formatReferralStatus(item.status)}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-slate-500 md:grid-cols-3">
                        <span>Joined: {formatDate(item.createdAt)}</span>
                        <span>Qualified: {item.completedAt ? formatDate(item.completedAt) : "Not yet"}</span>
                        <span>Order: {item.paidOrderId ? `#${item.paidOrderId.slice(-6).toUpperCase()}` : "N/A"}</span>
                      </div>
                      {item.suspectFlag && <p className="mt-2 text-xs font-semibold text-rose-600">{item.suspectReason || "Suspect referral"}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Restaurant Details for Vendor */}
      {user.role === "VENDOR" && user.restaurant && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><ChefHat size={20} />Restaurant Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-slate-500">Restaurant Name</p><p className="font-semibold text-slate-900">{user.restaurant.name || "N/A"}</p></div>
            <div><p className="text-slate-500">Cuisine</p><p className="font-semibold text-slate-900">{user.restaurant.cuisine || "N/A"}</p></div>
            <div><p className="text-slate-500">Phone</p><p className="font-semibold text-slate-900">{user.restaurant.phone || "N/A"}</p></div>
            <div><p className="text-slate-500">Status</p><p className="font-semibold">{user.restaurant.status === "ACTIVE" ? <span className="text-emerald-600">Active</span> : <span className="text-slate-600">{user.restaurant.status}</span>}</p></div>
            <div className="col-span-2"><p className="text-slate-500">Address</p><p className="font-semibold text-slate-900">{[user.restaurant.addressLine1, user.restaurant.city, user.restaurant.state].filter(Boolean).join(", ") || "N/A"}</p></div>
            {user.restaurant.openDays?.length > 0 && (
              <div><p className="text-slate-500">Open Days</p><p className="font-semibold text-slate-900">{user.restaurant.openDays.join(", ")}</p></div>
            )}
            {(user.restaurant.openingTime || user.restaurant.closingTime) && (
              <div><p className="text-slate-500">Hours</p><p className="font-semibold text-slate-900">{user.restaurant.openingTime || "--:--"} - {user.restaurant.closingTime || "--:--"}</p></div>
            )}
            {user.restaurant.fssaiNumber && (
              <div><p className="text-slate-500">FSSAI</p><p className="font-semibold text-slate-900">{user.restaurant.fssaiNumber}</p></div>
            )}
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Clock size={20} />Orders</h2>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by Order ID..."
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        {orders.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No orders found</p>
        ) : (
          <div className="space-y-3">
            {filteredOrders.length === 0 && orderSearch ? (
              <p className="text-slate-500 text-center py-8">No orders found matching "{orderSearch}"</p>
            ) : (
              <>
                {filteredOrders.map((order) => (
                  <div key={order.id} onClick={() => setSelectedOrder(order)} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-all">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 text-sm">#{order.id.slice(-6).toUpperCase()}</p>
                      <p className="text-xs text-slate-500 truncate">{order.restaurant?.name || "Restaurant"}</p>
                      <p className="text-xs text-slate-400">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{formatCurrency(order.totalAmount)}</p>
                      <p className={`text-xs font-semibold ${order.status === "DELIVERED" ? "text-emerald-600" : "text-amber-600"}`}>{order.status.replace("_", " ")}</p>
                      {user.role === "VENDOR" && order.status === "DELIVERED" && (
                        <p className="text-xs text-emerald-600">You earned: {formatCurrency(order.vendorEarnings || 0)}</p>
                      )}
                      {user.role === "RIDER" && order.status === "DELIVERED" && (
                        <p className="text-xs text-emerald-600">You earned: {formatCurrency(order.riderEarnings || 0)}</p>
                      )}
                    </div>
                  </div>
                ))}
                {showAllCount && (
                  <p className="text-center text-sm text-slate-500 py-2">+ {orders.length - 7} more orders</p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Order Details</p>
                <h3 className="mt-1 text-2xl font-bold text-slate-900">#{selectedOrder.id.slice(-6).toUpperCase()}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="rounded-2xl bg-slate-50 p-4 space-y-2">
                <div className="flex justify-between"><span className="text-slate-500">Status</span><span className="font-semibold">{selectedOrder.status.replaceAll("_", " ")}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Placed On</span><span className="font-semibold">{formatDate(selectedOrder.createdAt)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Total Amount</span><span className="font-bold text-slate-900">{formatCurrency(selectedOrder.totalAmount)}</span></div>
                {selectedOrder.paymentMethod && <div className="flex justify-between"><span className="text-slate-500">Payment</span><span className="font-semibold">{selectedOrder.paymentMethod} ({selectedOrder.paymentStatus})</span></div>}
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
                <p className="font-semibold text-slate-900">Customer</p>
                <div className="flex justify-between"><span className="text-slate-500">Name</span><span>{selectedOrder.customer?.name || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Phone</span><span>{selectedOrder.customer?.phone || "N/A"}</span></div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
                <p className="font-semibold text-slate-900">Restaurant</p>
                <div className="flex justify-between"><span className="text-slate-500">Name</span><span>{selectedOrder.restaurant?.name || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Phone</span><span>{selectedOrder.restaurant?.phone || "N/A"}</span></div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
                <p className="font-semibold text-slate-900">Rider</p>
                {selectedOrder.rider ? (
                  <>
                    <div className="flex justify-between"><span className="text-slate-500">Name</span><span>{selectedOrder.rider.name}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Phone</span><span>{selectedOrder.rider.phone || "N/A"}</span></div>
                  </>
                ) : <p className="text-slate-500">Not assigned</p>}
              </div>

              {selectedOrder.items?.length > 0 && (
                <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
                  <p className="font-semibold text-slate-900">Items</p>
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span>{item.quantity}x {item.menuItem?.name || "Item"}</span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                <p className="font-semibold text-emerald-800 mb-2">Price Breakdown</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(selectedOrder.subtotal)}</span></div>
                  <div className="flex justify-between"><span>Delivery Fee</span><span>{formatCurrency(selectedOrder.deliveryFee)}</span></div>
                  {selectedOrder.platformFee > 0 && <div className="flex justify-between"><span>Platform Fee</span><span>{formatCurrency(selectedOrder.platformFee)}</span></div>}
                  {selectedOrder.packagingFee > 0 && <div className="flex justify-between"><span>Packaging</span><span>{formatCurrency(selectedOrder.packagingFee)}</span></div>}
                  <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-emerald-200"><span>Total</span><span>{formatCurrency(selectedOrder.totalAmount)}</span></div>
                </div>
              </div>

              {(user.role === "VENDOR" || user.role === "RIDER") && selectedOrder.status === "DELIVERED" && (
                <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
                  <p className="font-semibold text-amber-800">Your Earnings from this Order</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">
                    {formatCurrency(user.role === "VENDOR" ? selectedOrder.vendorEarnings : selectedOrder.riderEarnings)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserDetails;