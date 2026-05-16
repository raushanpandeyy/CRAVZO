import React, { lazy, Suspense } from 'react';
import { Routes, Route } from "react-router-dom";

import Navbar from "../components/common/Navbar.jsx";
import PartnerMobileNav from "../components/common/PartnerMobileNav.jsx";

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

const VendorProfile = lazy(() =>
  import('../pages/vendors/VendorProfile.jsx')
);

const VendorChatPage = lazy(() =>
  import('../pages/vendors/VendorChatPage.jsx')
);

const VendorRoutes = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="hidden md:block">
        <Navbar />
      </div>

      <PartnerMobileNav role="vendor" />

      <main className="flex-1 pt-16 pb-24 md:p-0">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[60vh] text-slate-500 text-sm">
              Loading...
            </div>
          }
        >
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
                path="profile"
                element={<VendorProfile />}
              />

              <Route
                path="chat"
                element={<VendorChatPage />}
              />
            </Route>
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};

export default VendorRoutes;
