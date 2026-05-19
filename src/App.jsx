import React, { lazy, Suspense, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import AccessPending from "./components/common/AccessPending";
import AppLoader from "./components/common/AppLoader";
import { useAuth } from "./hooks/useAuth";
import { useNotifications } from "./hooks/useNotifications";

const AdminRoutes = lazy(() => import("./routes/AdminRoutes"));
const CustomerRoutes = lazy(() => import("./routes/CustomerRoutes"));
const RiderRoutes = lazy(() => import("./routes/RiderRoutes"));
const VendorRoutes = lazy(() => import("./routes/VendorRoutes"));

const App = () => {
  const { user, isHydrating } = useAuth();
  const navigate = useNavigate();

  useNotifications(user);

  useEffect(() => {
    const handleNotificationClick = (event) => {
      if (event.data?.type === "CRAVZO_NOTIFICATION_CLICK" && event.data.clickUrl) {
        navigate(event.data.clickUrl);
      }
    };

    window.addEventListener("message", handleNotificationClick);
    return () => window.removeEventListener("message", handleNotificationClick);
  }, [navigate]);

  useEffect(() => {
    const handleFcmMessage = (event) => {
      const clickUrl = event.detail?.data?.clickUrl;
      if (clickUrl) {
        navigate(clickUrl);
      }
    };

    window.addEventListener("cravzo:fcm-message", handleFcmMessage);
    return () => window.removeEventListener("cravzo:fcm-message", handleFcmMessage);
  }, [navigate]);

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
