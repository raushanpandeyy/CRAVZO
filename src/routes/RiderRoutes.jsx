import { Routes, Route } from "react-router-dom";
import React, { lazy, Suspense } from "react";

import ErrorBoundary from "../components/common/ErrorBoundary.jsx";
import Navbar from "../components/common/Navbar.jsx";
import PartnerMobileNav from "../components/common/PartnerMobileNav.jsx";

// Lazy Loaded Rider Pages
const RiderDashboard = lazy(() =>
  import("../pages/rider/RiderDashboard.jsx")
);

const RiderAnalytics = lazy(() =>
  import("../pages/rider/TotalOrder.jsx")
);

const RiderReview = lazy(() =>
  import("../pages/rider/Review.jsx")
);

const RiderProfile = lazy(() =>
  import("../pages/rider/RiderProfile.jsx")
);

const RiderContacts = lazy(() =>
  import("../pages/rider/Contacts.jsx")
);

const RiderChatPage = lazy(() =>
  import("../pages/rider/RiderChatPage.jsx")
);

const RiderRoutes = () => {
  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden">
      <div className="hidden md:block">
        <Navbar />
      </div>

      <PartnerMobileNav role="rider" />

      <main className="min-h-0 flex-1 overflow-y-auto pt-16 pb-24 md:p-0">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[60vh] text-slate-500 text-sm">
              Loading...
            </div>
          }
        >
          <ErrorBoundary>
            <Routes>
              {/* ================= RIDER DASHBOARD ROUTES ================= */}

              <Route
                path="/rider-dashboard"
                element={<RiderDashboard />}
              />

              <Route
                path="/rider-analytics"
                element={<RiderAnalytics />}
              />

              <Route
                path="/rider-reviews"
                element={<RiderReview />}
              />

              <Route
                path="/rider-profile"
                element={<RiderProfile />}
              />

              <Route
                path="/rider-contacts"
                element={<RiderContacts />}
              />

              <Route
                path="/rider-chat"
                element={<RiderChatPage />}
              />
            </Routes>
          </ErrorBoundary>
        </Suspense>
      </main>
    </div>
  );
};

export default RiderRoutes;
