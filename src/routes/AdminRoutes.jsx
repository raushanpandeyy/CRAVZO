import React from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "../components/common/Navbar.jsx";
import AdminDashboard from "../pages/admin/AdminDashboard.jsx";

const AdminRoutes = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex-1 pt-24 px-4 md:px-8 pb-8">
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<AdminDashboard />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminRoutes;
