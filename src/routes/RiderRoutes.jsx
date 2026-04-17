import { Routes, Route } from "react-router-dom";
import React from "react";
import Navbar from '../components/common/Navbar.jsx';

// Rider Pages
import RiderDashboard from "../pages/rider/RiderDashboard.jsx";
import RiderAnalytics from "../pages/rider/TotalOrder.jsx";
import RiderReview from "../pages/rider/Review.jsx";
import RiderProfile from "../pages/rider/RiderProfile.jsx";
import RiderContacts from "../pages/rider/Contacts.jsx";
import RiderChatPage from "../pages/rider/RiderChatPage.jsx";

const RiderRoutes = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pt-24">
        <Routes>
          {/* ================= RIDER DASHBOARD ROUTES ================= */}
          <Route path="/rider-dashboard" element={<RiderDashboard />} />
          <Route path="/rider-analytics" element={<RiderAnalytics />} />
          <Route path="/rider-reviews" element={<RiderReview />} />
          <Route path="/rider-profile" element={<RiderProfile />} />
          <Route path="/rider-contacts" element={<RiderContacts />} />
          <Route path="/rider-chat" element={<RiderChatPage />} />
        </Routes>
      </main>
    </div>
  );
};

export default RiderRoutes;

