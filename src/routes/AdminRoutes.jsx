import React, { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AlertTriangle, Bell, X } from "lucide-react";

import Navbar from "../components/common/Navbar.jsx";
import AdminSidebar from "../components/common/AdminSidebar.jsx";
import AdminMobileNav from "../components/common/AdminMobileNav.jsx";
import { onAdminOrderAlert } from "../services/chatSocket.js";

const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard.jsx"));
const AdminFeatured = lazy(() => import("../pages/admin/AdminFeatured.jsx"));
const AdminOrders = lazy(() => import("../pages/admin/AdminOrders.jsx"));
const AdminUsers = lazy(() => import("../pages/admin/AdminUsers.jsx"));
const AdminUserDetails = lazy(() => import("../pages/admin/AdminUserDetails.jsx"));
const AdminRestaurants = lazy(() => import("../pages/admin/AdminRestaurants.jsx"));
const AdminPending = lazy(() => import("../pages/admin/AdminPending.jsx"));
const AdminAnalytics = lazy(() => import("../pages/admin/AdminAnalytics.jsx"));
const AdminChatInbox = lazy(() => import("../components/AdminChatInbox.jsx"));
const AdminPromotions = lazy(() => import("../pages/admin/AdminPromotions.jsx"));

const AdminRoutes = () => {
  const navigate = useNavigate();
  const [orderAlert, setOrderAlert] = useState(null);

  useEffect(() => {
    const unsubscribe = onAdminOrderAlert((alert) => {
      setOrderAlert({
        ...alert,
        receivedAt: Date.now(),
      });
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!orderAlert || orderAlert.severity === "danger") return undefined;

    const timeout = window.setTimeout(() => setOrderAlert(null), 6000);
    return () => window.clearTimeout(timeout);
  }, [orderAlert]);

  const isDanger = orderAlert?.severity === "danger";

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <AdminSidebar />

      {orderAlert && (
        <div className="fixed left-3 right-3 top-20 z-[70] md:left-auto md:right-6 md:w-[26rem]">
          <div
            className={`border p-4 shadow-2xl ${
              isDanger
                ? "border-red-500 bg-red-600 text-white"
                : "border-indigo-200 bg-white text-slate-900"
            } rounded-lg`}
            role="alert"
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  isDanger ? "bg-white text-red-600" : "bg-indigo-50 text-indigo-700"
                }`}
              >
                {isDanger ? <AlertTriangle className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
              </div>
              <button
                type="button"
                onClick={() => {
                  setOrderAlert(null);
                  navigate(`/admin/orders${orderAlert.order?.id ? `?orderId=${orderAlert.order.id}` : ""}`);
                }}
                className="min-w-0 flex-1 text-left"
              >
                <p className="text-sm font-black">{orderAlert.title || "Order update"}</p>
                <p className={`mt-1 text-sm leading-5 ${isDanger ? "text-red-50" : "text-slate-600"}`}>
                  {orderAlert.message || "A live order was updated."}
                </p>
                {orderAlert.order?.restaurant?.name && (
                  <p className={`mt-2 text-xs font-bold ${isDanger ? "text-white" : "text-indigo-700"}`}>
                    {orderAlert.order.restaurant.name} · #{orderAlert.order.id?.slice(-6)}
                  </p>
                )}
              </button>
              <button
                type="button"
                onClick={() => setOrderAlert(null)}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  isDanger ? "bg-red-700 text-white hover:bg-red-800" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                aria-label="Close order alert"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 px-2 mobile-safe-content pt-20 md:pt-16 md:pb-8 md:pl-56 md:px-6">
        <Suspense fallback={<div className="p-4 text-center text-slate-500">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Navigate to="/admin/featured" replace />} />
            <Route path="/admin" element={<Navigate to="/admin/featured" replace />} />
            <Route path="/admin/featured" element={<AdminFeatured />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/users/:userId" element={<AdminUserDetails />} />
            <Route path="/admin/restaurants" element={<AdminRestaurants />} />
            <Route path="/admin/pending" element={<AdminPending />} />
            <Route path="/admin/support" element={<AdminChatInbox />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/promotions" element={<AdminPromotions />} />
            <Route path="*" element={<Navigate to="/admin/featured" replace />} />
          </Routes>
        </Suspense>
      </main>

      <AdminMobileNav />
    </div>
  );
};

export default AdminRoutes;

