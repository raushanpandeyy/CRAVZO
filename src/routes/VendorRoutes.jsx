import React, { lazy, Suspense } from 'react';
import { Routes, Route } from "react-router-dom";

import ErrorBoundary from "../components/common/ErrorBoundary.jsx";
import Navbar from "../components/common/Navbar.jsx";
import PartnerMobileNav from "../components/common/PartnerMobileNav.jsx";
import VendorOrderAlertHost from "../components/vendors/VendorOrderAlertHost.jsx";

// Lazy Loaded Vendor Pages
const VendorAccount = lazy(() =>
  import('../pages/vendors/VendorAccount.jsx')
);

const VendorDashboard = lazy(() =>
  import('../pages/vendors/VendorDashboard.jsx')
);

const OrderPanel = lazy(() =>
  import('../pages/vendors/OrderPanel.jsx')
);

const ManageMenu = lazy(() =>
  import('../pages/vendors/ManageMenu.jsx')
);

const KitchenDisplay = lazy(() =>
  import('../pages/vendors/KitchenDisplay.jsx')
);

const VendorReports = lazy(() =>
  import('../pages/vendors/VendorReports.jsx')
);

const VendorReviews = lazy(() =>
  import('../pages/vendors/VendorReviews.jsx')
);

const VendorProfile = lazy(() =>
  import('../pages/vendors/VendorProfile.jsx')
);

const VendorChatPage = lazy(() =>
  import('../pages/vendors/VendorChatPage.jsx')
);

const VendorRoutes = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="hidden md:block">
        <Navbar />
      </div>

      <PartnerMobileNav role="vendor" />
      <VendorOrderAlertHost />

      <main className="min-h-0 flex-1 pt-16 mobile-safe-content-lg md:p-0">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[60vh] text-slate-500 text-sm">
              Loading...
            </div>
          }
        >
          <ErrorBoundary>
            <Routes>
              <Route
                path="/vendor-dashboard"
                element={<VendorAccount />}
              >
                <Route
                  index
                  element={<VendorDashboard />}
                />

                <Route
                  path="orders"
                  element={<OrderPanel />}
                />

                <Route
                  path="menu"
                  element={<ManageMenu />}
                />

                <Route
                  path="kitchen"
                  element={<KitchenDisplay />}
                />

                <Route
                  path="reports"
                  element={<VendorReports />}
                />

                <Route
                  path="reviews"
                  element={<VendorReviews />}
                />

                <Route
                  path="profile"
                  element={<VendorProfile />}
                />

                <Route
                  path="chat"
                  element={<VendorChatPage />}
                />
              </Route>
            </Routes>
          </ErrorBoundary>
        </Suspense>
      </main>
    </div>
  );
};

export default VendorRoutes;



