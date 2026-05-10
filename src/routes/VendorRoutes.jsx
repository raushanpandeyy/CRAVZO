import React from 'react';
import { Routes, Route } from "react-router-dom";
import Navbar from "../components/common/Navbar.jsx";
import PartnerMobileNav from "../components/common/PartnerMobileNav.jsx";

// Vendor Pages
import VendorAccount from '../pages/vendors/VendorAccount.jsx';
import VendorDashboard from '../pages/vendors/VendorDashboard.jsx';
import OrderPanel from '../pages/vendors/OrderPanel.jsx';
import ManageMenu from '../pages/vendors/ManageMenu.jsx';
import VendorProfile from '../pages/vendors/VendorProfile.jsx';
import VendorChatPage from '../pages/vendors/VendorChatPage.jsx';

const VendorRoutes = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="hidden md:block">
        <Navbar />
      </div>
      <PartnerMobileNav role="vendor" />
      <main className="flex-1 pt-16 pb-24 md:p-0">
        <Routes>
  <Route path="/vendor-dashboard" element={<VendorAccount />}>
    <Route index element={<VendorDashboard />} />
    <Route path="orders" element={<OrderPanel />} />
    <Route path="menu" element={<ManageMenu />} />
    <Route path="profile" element={<VendorProfile />} />
    <Route path="chat" element={<VendorChatPage />} />
  </Route>
</Routes>
      </main>
    </div>
  );
};

export default VendorRoutes;
