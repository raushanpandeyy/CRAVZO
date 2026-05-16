import React, { lazy, Suspense } from "react";

import AccessPending from "./components/common/AccessPending";
import AppLoader from "./components/common/AppLoader";
import { useAuth } from "./hooks/useAuth";

const AdminRoutes = lazy(() => import("./routes/AdminRoutes"));
const CustomerRoutes = lazy(() => import("./routes/CustomerRoutes"));
const RiderRoutes = lazy(() => import("./routes/RiderRoutes"));
const VendorRoutes = lazy(() => import("./routes/VendorRoutes"));

const App = () => {
  const { user, isHydrating } = useAuth();

  if (isHydrating) {
    return <AppLoader />;
  }

  if (user && user.isLoggedIn) {
    const isPartnerPending =
      (user.accountType === "vendor" || user.accountType === "rider") &&
      user.status !== "ACTIVE";

    if (isPartnerPending) {
      return <AccessPending user={user} />;
    }

    return (
      <Suspense fallback={<AppLoader />}>
        {(() => {
          switch (user.accountType) {
            case "rider":
              return <RiderRoutes />;
            case "vendor":
              return <VendorRoutes />;
            case "admin":
              return <AdminRoutes />;
            case "customer":
            default:
              return <CustomerRoutes />;
          }
        })()}
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<AppLoader />}>
      <CustomerRoutes />
    </Suspense>
  );
};

export default App;
