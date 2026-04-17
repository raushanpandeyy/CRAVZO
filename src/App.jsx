import React from "react";

import AccessPending from "./components/common/AccessPending";
import AdminRoutes from "./routes/AdminRoutes";
import CustomerRoutes from "./routes/CustomerRoutes";
import RiderRoutes from "./routes/RiderRoutes";
import VendorRoutes from "./routes/VendorRoutes";
import { useAuth } from "./hooks/useAuth";

const App = () => {
  const { user, isHydrating } = useAuth();

  if (isHydrating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
        Loading...
      </div>
    );
  }

  if (user && user.isLoggedIn) {
    const isPartnerPending =
      (user.accountType === "vendor" || user.accountType === "rider") && user.status !== "ACTIVE";

    if (isPartnerPending) {
      return <AccessPending user={user} />;
    }

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
  }

  return <CustomerRoutes />;
};

export default App;
