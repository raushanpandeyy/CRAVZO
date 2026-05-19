import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Navbar from "../components/common/Navbar.jsx";
import AdminSidebar from "../components/common/AdminSidebar.jsx";
import AdminMobileNav from "../components/common/AdminMobileNav.jsx";

const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard.jsx"));
const AdminFeatured = lazy(() => import("../pages/admin/AdminFeatured.jsx"));
const AdminOrders = lazy(() => import("../pages/admin/AdminOrders.jsx"));
const AdminUsers = lazy(() => import("../pages/admin/AdminUsers.jsx"));
const AdminUserDetails = lazy(() => import("../pages/admin/AdminUserDetails.jsx"));
const AdminRestaurants = lazy(() => import("../pages/admin/AdminRestaurants.jsx"));
const AdminPending = lazy(() => import("../pages/admin/AdminPending.jsx"));
const AdminAnalytics = lazy(() => import("../pages/admin/AdminAnalytics.jsx"));
const AdminChatInbox = lazy(() => import("../components/AdminChatInbox.jsx"));

const AdminRoutes = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <AdminSidebar />

      <main className="flex-1 px-2 pb-20 pt-20 md:pt-16 md:pb-8 md:pl-56 md:px-6">
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
            <Route path="*" element={<Navigate to="/admin/featured" replace />} />
          </Routes>
        </Suspense>
      </main>

      <AdminMobileNav />
    </div>
  );
};

export default AdminRoutes;