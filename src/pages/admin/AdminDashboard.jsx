
import React, { useEffect, useMemo, useState } from "react";
import { CalendarRange, PackageCheck, Search, Store, UserCheck, Users, X } from "lucide-react";

import { API_ENDPOINTS } from "../../constants/apiEndpoints";
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

function PendingList({ title, users, onApprove, loading }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">Approve pending partner requests from here.</p>
        </div>
        <span className="text-sm font-semibold text-slate-500">{loading ? "Loading..." : `${users.length} pending`}</span>
      </div>

      {users.length ? (
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-slate-900">{user.name}</p>
                <p className="text-sm text-slate-600">{user.email}</p>
                <p className="text-xs text-slate-500">{user.phone || "No phone added"}</p>
              </div>
              <button onClick={() => onApprove(user.id)} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                Approve
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">No pending requests right now.</div>
      )}
    </section>
  );
}

function PaginationControls({ page, totalPages, onPageChange }) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600">
      <p>
        Page <span className="font-semibold text-slate-900">{page}</span> of <span className="font-semibold text-slate-900">{totalPages}</span>
      </p>
      <div className="flex gap-2">
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
      </div>
    </div>
  );
}

const formatCurrency = (amount) => `Rs ${Number(amount || 0).toFixed(0)}`;
const DEFAULT_PAGE_META = { page: 1, totalPages: 1, total: 0, limit: 8 };

const useDebouncedValue = (value, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeoutId);
  }, [value, delay]);

  return debouncedValue;
};

const downloadCsv = (filename, rows) => {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const escapeCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(","))].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const AdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [overviewMeta, setOverviewMeta] = useState(DEFAULT_PAGE_META);
  const [pendingVendors, setPendingVendors] = useState([]);
  const [pendingRiders, setPendingRiders] = useState([]);
  const [usersPageData, setUsersPageData] = useState([]);
  const [usersMeta, setUsersMeta] = useState(DEFAULT_PAGE_META);
  const [restaurantsPageData, setRestaurantsPageData] = useState([]);
  const [restaurantsMeta, setRestaurantsMeta] = useState(DEFAULT_PAGE_META);
  const [loading, setLoading] = useState(true);
  const [supportQuery, setSupportQuery] = useState("");
  const [supportResult, setSupportResult] = useState(null);
  const [supportLoading, setSupportLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [restaurantSearch, setRestaurantSearch] = useState("");
  const [restaurantStatusFilter, setRestaurantStatusFilter] = useState("");
  const [restaurantPage, setRestaurantPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [orderFromDate, setOrderFromDate] = useState("");
  const [orderToDate, setOrderToDate] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const debouncedUserSearch = useDebouncedValue(userSearch);
  const debouncedRestaurantSearch = useDebouncedValue(restaurantSearch);

  const resetStatusMessages = () => {
    setMessage("");
    setError("");
  };
  const loadOverview = async () => {
    const response = await apiRequest(
      API_ENDPOINTS.admin.overview({
        page: orderPage,
        limit: 8,
        from: orderFromDate,
        to: orderToDate,
        status: orderStatusFilter,
        paymentMethod: paymentMethodFilter,
        paymentStatus: paymentStatusFilter,
      }),
    );

    setOverview(response.data);
    setOverviewMeta(response.meta?.recentOrders || DEFAULT_PAGE_META);
  };

  const loadPending = async () => {
    const [vendorsResponse, ridersResponse] = await Promise.all([
      apiRequest(API_ENDPOINTS.admin.pendingVendors),
      apiRequest(API_ENDPOINTS.admin.pendingRiders),
    ]);

    setPendingVendors(vendorsResponse.data || []);
    setPendingRiders(ridersResponse.data || []);
  };

  const loadUsers = async () => {
    const response = await apiRequest(
      API_ENDPOINTS.admin.users({
        page: userPage,
        limit: 8,
        query: debouncedUserSearch,
        role: userRoleFilter,
        status: userStatusFilter,
      }),
    );

    setUsersPageData((response.data || []).filter((user) => user.role !== "ADMIN"));
    setUsersMeta(response.meta || DEFAULT_PAGE_META);
  };

  const loadRestaurants = async () => {
    const response = await apiRequest(
      API_ENDPOINTS.admin.restaurants({
        page: restaurantPage,
        limit: 8,
        query: debouncedRestaurantSearch,
        status: restaurantStatusFilter,
      }),
    );

    setRestaurantsPageData(response.data || []);
    setRestaurantsMeta(response.meta || DEFAULT_PAGE_META);
  };

  const loadAdminData = async () => {
    setLoading(true);
    resetStatusMessages();

    try {
      await Promise.all([loadOverview(), loadPending(), loadUsers(), loadRestaurants()]);
    } catch (requestError) {
      setError(requestError.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    loadOverview().catch((requestError) => setError(requestError.message || "Failed to load recent orders"));
  }, [orderPage, orderFromDate, orderToDate, orderStatusFilter, paymentMethodFilter, paymentStatusFilter]);

  useEffect(() => {
    loadUsers().catch((requestError) => setError(requestError.message || "Failed to load users"));
  }, [userPage, debouncedUserSearch, userRoleFilter, userStatusFilter]);

  useEffect(() => {
    loadRestaurants().catch((requestError) => setError(requestError.message || "Failed to load restaurants"));
  }, [restaurantPage, debouncedRestaurantSearch, restaurantStatusFilter]);

  const approveVendor = async (vendorId) => {
    resetStatusMessages();
    try {
      await apiRequest(API_ENDPOINTS.admin.approveVendor(vendorId), { method: "PATCH" });
      setMessage("Vendor approved successfully.");
      await Promise.all([loadPending(), loadOverview()]);
    } catch (requestError) {
      setError(requestError.message || "Failed to approve vendor");
    }
  };

  const approveRider = async (riderId) => {
    resetStatusMessages();
    try {
      await apiRequest(API_ENDPOINTS.admin.approveRider(riderId), { method: "PATCH" });
      setMessage("Rider approved successfully.");
      await Promise.all([loadPending(), loadOverview()]);
    } catch (requestError) {
      setError(requestError.message || "Failed to approve rider");
    }
  };

  const refreshSupportResult = async () => {
    if (!supportResult?.user) return;

    const lookupValue = supportResult.user.phone || supportResult.user.email;
    const response = await apiRequest(API_ENDPOINTS.admin.supportUserSearch(lookupValue));
    setSupportResult(response.data);
  };

  const updateUserStatus = async (userId, status) => {
    resetStatusMessages();
    try {
      await apiRequest(API_ENDPOINTS.admin.userStatus(userId), {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setMessage(`User marked as ${status.toLowerCase()} successfully.`);
      await Promise.all([loadUsers(), supportResult ? refreshSupportResult() : Promise.resolve()]);
    } catch (requestError) {
      setError(requestError.message || "Failed to update user status");
    }
  };

  const updateRestaurantStatus = async (restaurantId, status) => {
    resetStatusMessages();
    try {
      await apiRequest(API_ENDPOINTS.admin.restaurantStatus(restaurantId), {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setMessage(`Restaurant marked as ${status.toLowerCase()} successfully.`);
      await Promise.all([loadRestaurants(), loadOverview()]);
    } catch (requestError) {
      setError(requestError.message || "Failed to update restaurant status");
    }
  };

  const handleSupportLookup = async (event) => {
    event.preventDefault();
    if (!supportQuery.trim()) {
      setError("Enter a phone number or email to search support details.");
      return;
    }

    setSupportLoading(true);
    resetStatusMessages();

    try {
      const response = await apiRequest(API_ENDPOINTS.admin.supportUserSearch(supportQuery.trim()));
      setSupportResult(response.data);
    } catch (requestError) {
      setSupportResult(null);
      setError(requestError.message || "Failed to find user details");
    } finally {
      setSupportLoading(false);
    }
  };

  const metrics = useMemo(() => {
    const totals = overview?.totals;
    if (!totals) return [];
    return [
      { title: "Total Users", value: totals.totalUsers, subtitle: `${totals.totalCustomers} customers`, icon: Users, color: "bg-slate-900" },
      { title: "Active Users", value: totals.activeUsers, subtitle: `${totals.totalVendors} vendors, ${totals.totalRiders} riders`, icon: UserCheck, color: "bg-emerald-600" },
      { title: "Completed Orders", value: totals.completedOrders, subtitle: `${totals.totalOrders} total orders`, icon: PackageCheck, color: "bg-indigo-600" },
      { title: "Restaurants", value: totals.totalRestaurants, subtitle: `${totals.liveOrders} live orders`, icon: Store, color: "bg-amber-500" },
    ];
  }, [overview]);

  const exportRecentOrders = () => {
    downloadCsv("admin-recent-orders.csv", (overview?.recentOrders || []).map((order) => ({
      orderId: order.id,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      totalAmount: Number(order.totalAmount || 0),
      customer: order.customer?.name || "",
      customerPhone: order.customer?.phone || "",
      restaurant: order.restaurant?.name || "",
      vendor: order.restaurant?.vendor?.name || "",
      rider: order.rider?.name || "",
      createdAt: order.createdAt,
    })));
  };

  const exportUsers = () => {
    downloadCsv("admin-users.csv", usersPageData.map((user) => ({ userId: user.id, name: user.name, email: user.email, phone: user.phone || "", role: user.role, status: user.status, createdAt: user.createdAt })));
  };

  const exportRestaurants = () => {
    downloadCsv("admin-restaurants.csv", restaurantsPageData.map((restaurant) => ({ restaurantId: restaurant.id, name: restaurant.name, status: restaurant.status, city: restaurant.city || "", state: restaurant.state || "", vendor: restaurant.vendor?.name || "", vendorPhone: restaurant.vendor?.phone || "", vendorEmail: restaurant.vendor?.email || "" })));
  };
  const renderOrderCard = (order, accent = "bg-slate-100") => (
    <button key={order.id} onClick={() => setSelectedOrder(order)} className="w-full rounded-2xl border border-slate-200 p-4 text-left hover:border-indigo-300">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">Order #{order.id.slice(-6)}</p>
          <p className="text-sm text-slate-600">{order.customer?.name || "Customer"} • {order.restaurant?.name || "Restaurant"}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold text-slate-700 ${accent}`}>{order.status.replaceAll("_", " ")}</span>
      </div>
      <div className="mt-3 text-sm text-slate-600">
        <p>Vendor: {order.restaurant?.vendor?.name || "NA"}</p>
        <p>Rider: {order.rider?.name || "Not assigned"}</p>
        <p>Amount: {formatCurrency(order.totalAmount)}</p>
      </div>
    </button>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="rounded-[2rem] bg-slate-900 p-8 text-white">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-300">Admin Console</p>
        <h1 className="mt-3 text-3xl font-black md:text-4xl">Operations overview and support desk</h1>
        <p className="mt-3 max-w-3xl text-slate-300">Search-first admin panel designed for scale. Load only what you need, filter by time, and drill into details only when support requires it.</p>
      </div>

      {message ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-red-700">{error}</div> : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <MetricCard key={metric.title} {...metric} />)}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <PendingList title="Pending Vendors" users={pendingVendors} onApprove={approveVendor} loading={loading} />
        <PendingList title="Pending Riders" users={pendingRiders} onApprove={approveRider} loading={loading} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Recent Orders</h2>
                <p className="text-sm text-slate-500">Filter by date, status, and payment before drilling into details.</p>
              </div>
              <button onClick={exportRecentOrders} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Export CSV</button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600"><CalendarRange className="h-4 w-4" /><input type="date" value={orderFromDate} onChange={(event) => { setOrderPage(1); setOrderFromDate(event.target.value); }} className="bg-transparent outline-none" /></label>
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600"><CalendarRange className="h-4 w-4" /><input type="date" value={orderToDate} onChange={(event) => { setOrderPage(1); setOrderToDate(event.target.value); }} className="bg-transparent outline-none" /></label>
              <select value={orderStatusFilter} onChange={(event) => { setOrderPage(1); setOrderStatusFilter(event.target.value); }} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"><option value="">All order statuses</option><option value="PENDING">Pending</option><option value="ACCEPTED">Accepted</option><option value="PREPARING">Preparing</option><option value="READY_FOR_PICKUP">Ready for Pickup</option><option value="OUT_FOR_DELIVERY">Out for Delivery</option><option value="DELIVERED">Delivered</option><option value="CANCELLED">Cancelled</option><option value="REJECTED">Rejected</option></select>
              <select value={paymentMethodFilter} onChange={(event) => { setOrderPage(1); setPaymentMethodFilter(event.target.value); }} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"><option value="">All payment methods</option><option value="COD">COD</option><option value="CARD">Card</option><option value="UPI">UPI</option></select>
              <select value={paymentStatusFilter} onChange={(event) => { setOrderPage(1); setPaymentStatusFilter(event.target.value); }} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"><option value="">All payment statuses</option><option value="PENDING">Pending</option><option value="PAID">Paid</option><option value="FAILED">Failed</option><option value="REFUNDED">Refunded</option></select>
            </div>
          </div>

          {loading ? <div className="py-10 text-center text-sm text-slate-500">Loading recent orders...</div> : <div className="space-y-3">{(overview?.recentOrders || []).map((order) => renderOrderCard(order))}</div>}
          {!loading && !(overview?.recentOrders || []).length ? <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">No orders found for this filter set.</div> : null}
          <PaginationControls page={overviewMeta.page || 1} totalPages={overviewMeta.totalPages || 1} onPageChange={setOrderPage} />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">Support Lookup</h2>
            <p className="text-sm text-slate-500">Search by mobile number or email to inspect the account and order trail.</p>
          </div>
          <form onSubmit={handleSupportLookup} className="flex gap-3">
            <input value={supportQuery} onChange={(event) => setSupportQuery(event.target.value)} placeholder="Enter phone or email" className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            <button type="submit" disabled={supportLoading} className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"><Search className="h-4 w-4" />{supportLoading ? "Searching..." : "Search"}</button>
          </form>

          {supportResult ? (
            <div className="mt-6 space-y-5">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{supportResult.user.name}</p>
                    <p className="text-sm text-slate-600">{supportResult.user.email}</p>
                    <p className="text-sm text-slate-600">{supportResult.user.phone || "No phone"}</p>
                    <p className="mt-2 text-xs text-slate-500">Role: {supportResult.user.role} • Status: {supportResult.user.status}</p>
                  </div>
                  {supportResult.user.role !== "ADMIN" ? <button onClick={() => updateUserStatus(supportResult.user.id, supportResult.user.status === "BLOCKED" ? "ACTIVE" : "BLOCKED")} className={`rounded-full px-4 py-2 text-sm font-semibold text-white ${supportResult.user.status === "BLOCKED" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`}>{supportResult.user.status === "BLOCKED" ? "Unblock User" : "Block User"}</button> : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-600"><p className="font-semibold text-slate-900">Saved Addresses</p><p className="mt-2">{supportResult.addresses.length ? `${supportResult.addresses.length} address(es) on file` : "No saved addresses"}</p></div>
                <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-600"><p className="font-semibold text-slate-900">Order Summary</p><p className="mt-2">Customer orders: {supportResult.customerOrders.length}</p><p>Rider orders: {supportResult.riderOrders.length}</p><p>Restaurants: {supportResult.restaurants.length}</p></div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900">Order trail</h3>
                <div className="mt-2 space-y-3">
                  {[...supportResult.customerOrders, ...supportResult.riderOrders].slice(0, 6).map((order) => renderOrderCard(order, "bg-indigo-50"))}
                  {!supportResult.customerOrders.length && !supportResult.riderOrders.length ? <div className="text-sm text-slate-500">No orders found.</div> : null}
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">User Search</h2>
              <p className="text-sm text-slate-500">Server-side search with pagination for customers, vendors, and riders. Typing is debounced automatically.</p>
            </div>
            <button onClick={exportUsers} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Export CSV</button>
          </div>
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <input value={userSearch} onChange={(event) => { setUserPage(1); setUserSearch(event.target.value); }} placeholder="Search by name, phone, email" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            <select value={userRoleFilter} onChange={(event) => { setUserPage(1); setUserRoleFilter(event.target.value); }} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"><option value="">All roles</option><option value="CUSTOMER">Customer</option><option value="VENDOR">Vendor</option><option value="RIDER">Rider</option></select>
            <select value={userStatusFilter} onChange={(event) => { setUserPage(1); setUserStatusFilter(event.target.value); }} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="PENDING">Pending</option><option value="BLOCKED">Blocked</option></select>
          </div>
          <div className="space-y-3 text-sm">
            {usersPageData.map((user) => (
              <div key={user.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{user.name}</p>
                  <p className="text-slate-600">{user.email}</p>
                  <p className="text-xs text-slate-500">{user.phone || "No phone"} • {user.role} • {user.status}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setSupportQuery(user.phone || user.email); setSupportResult(null); }} className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700">Lookup</button>
                  <button onClick={() => updateUserStatus(user.id, user.status === "BLOCKED" ? "ACTIVE" : "BLOCKED")} className={`rounded-full px-4 py-2 text-xs font-semibold text-white ${user.status === "BLOCKED" ? "bg-emerald-600" : "bg-rose-600"}`}>{user.status === "BLOCKED" ? "Unblock" : "Block"}</button>
                </div>
              </div>
            ))}
            {!usersPageData.length ? <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">No matching users found.</div> : null}
          </div>
          <PaginationControls page={usersMeta.page || 1} totalPages={usersMeta.totalPages || 1} onPageChange={setUserPage} />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Restaurant Search</h2>
              <p className="text-sm text-slate-500">Search restaurants or owners with paginated results. Typing is debounced automatically.</p>
            </div>
            <button onClick={exportRestaurants} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Export CSV</button>
          </div>
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <input value={restaurantSearch} onChange={(event) => { setRestaurantPage(1); setRestaurantSearch(event.target.value); }} placeholder="Search by restaurant, city, vendor, phone" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            <select value={restaurantStatusFilter} onChange={(event) => { setRestaurantPage(1); setRestaurantStatusFilter(event.target.value); }} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="PENDING_APPROVAL">Pending Approval</option><option value="DRAFT">Draft</option><option value="REJECTED">Rejected</option></select>
          </div>
          <div className="space-y-3 text-sm">
            {restaurantsPageData.map((restaurant) => (
              <div key={restaurant.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{restaurant.name}</p>
                    <p className="text-slate-600">{[restaurant.addressLine1, restaurant.city, restaurant.state].filter(Boolean).join(", ") || "Address not set"}</p>
                    <p className="mt-1 text-xs text-slate-500">Vendor: {restaurant.vendor?.name || "NA"} • {restaurant.vendor?.phone || restaurant.vendor?.email || "No contact"}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{restaurant.status}</span>
                    <button onClick={() => updateRestaurantStatus(restaurant.id, restaurant.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")} className={`rounded-full px-4 py-2 text-xs font-semibold text-white ${restaurant.status === "ACTIVE" ? "bg-rose-600" : "bg-emerald-600"}`}>{restaurant.status === "ACTIVE" ? "Suspend" : "Activate"}</button>
                  </div>
                </div>
              </div>
            ))}
            {!restaurantsPageData.length ? <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">No matching restaurants found.</div> : null}
          </div>
          <PaginationControls page={restaurantsMeta.page || 1} totalPages={restaurantsMeta.totalPages || 1} onPageChange={setRestaurantPage} />
        </section>
      </div>

      {selectedOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Order details</p>
                <h3 className="mt-1 text-2xl font-bold text-slate-900">Order #{selectedOrder.id.slice(-6)}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 text-sm text-slate-700">
              <div className="rounded-2xl bg-slate-50 p-4"><p><strong>Status:</strong> {selectedOrder.status.replaceAll("_", " ")}</p><p><strong>Payment:</strong> {selectedOrder.paymentMethod} / {selectedOrder.paymentStatus}</p><p><strong>Total:</strong> {formatCurrency(selectedOrder.totalAmount)}</p></div>
              <div className="rounded-2xl border border-slate-200 p-4"><p><strong>Customer:</strong> {selectedOrder.customer?.name || "NA"}</p><p><strong>Phone:</strong> {selectedOrder.customer?.phone || "NA"}</p></div>
              <div className="rounded-2xl border border-slate-200 p-4"><p><strong>Restaurant:</strong> {selectedOrder.restaurant?.name || "NA"}</p><p><strong>Vendor:</strong> {selectedOrder.restaurant?.vendor?.name || "NA"}</p><p><strong>Vendor Phone:</strong> {selectedOrder.restaurant?.vendor?.phone || "NA"}</p></div>
              <div className="rounded-2xl border border-slate-200 p-4"><p><strong>Rider:</strong> {selectedOrder.rider?.name || "Not assigned"}</p><p><strong>Rider Phone:</strong> {selectedOrder.rider?.phone || "NA"}</p></div>
              <div className="rounded-2xl border border-slate-200 p-4"><p><strong>Address:</strong> {[selectedOrder.address?.line1, selectedOrder.address?.line2, selectedOrder.address?.city, selectedOrder.address?.state, selectedOrder.address?.postalCode].filter(Boolean).join(", ") || "NA"}</p></div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminDashboard;
