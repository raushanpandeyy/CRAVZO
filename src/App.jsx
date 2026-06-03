import React, { lazy, Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, X } from "lucide-react";

import AccessPending from "./components/common/AccessPending";
import AppLoader from "./components/common/AppLoader";
import InstallAppPrompt from "./components/InstallAppPrompt";
import { useAuth } from "./hooks/useAuth";
import { useNotifications } from "./hooks/useNotifications";

const AdminRoutes = lazy(() => import("./routes/AdminRoutes"));
const CustomerRoutes = lazy(() => import("./routes/CustomerRoutes"));
const RiderRoutes = lazy(() => import("./routes/RiderRoutes"));
const VendorRoutes = lazy(() => import("./routes/VendorRoutes"));

// ── In-app notification toast ──
// Shows when a FCM message arrives while the app is open (foreground).
// Auto-dismisses after 5 seconds. Tapping navigates to the relevant page.
const InAppToast = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed top-4 left-1/2 z-[300] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 animate-slide-up">
      <div className="flex items-start gap-3 rounded-2xl bg-indigo-950 px-4 py-3 shadow-2xl">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600">
          <Bell className="h-4 w-4 text-white" />
        </div>
        <button
          type="button"
          onClick={toast.clickUrl ? toast.onClick : onDismiss}
          className="min-w-0 flex-1 text-left"
        >
          <p className="text-sm font-black text-white truncate">{toast.title}</p>
          {toast.body ? (
            <p className="mt-0.5 text-xs text-indigo-200 line-clamp-2">{toast.body}</p>
          ) : null}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-indigo-400 hover:text-white transition"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const App = () => {
  const { user, isHydrating } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);

  useNotifications(user);

  // Handle notification click from service worker (background tap)
  useEffect(() => {
    const handleNotificationClick = (event) => {
      if (event.data?.type === "CRAVZO_NOTIFICATION_CLICK" && event.data.clickUrl) {
        navigate(event.data.clickUrl);
      }
    };
    window.addEventListener("message", handleNotificationClick);
    return () => window.removeEventListener("message", handleNotificationClick);
  }, [navigate]);

  // Handle foreground FCM message — show in-app toast instead of OS notification
  useEffect(() => {
    const handleFcmMessage = (event) => {
      const payload = event.detail;
      const title =
        payload?.notification?.title || payload?.data?.title || "CRAVZO";
      const body =
        payload?.notification?.body || payload?.data?.body || null;
      const clickUrl = payload?.data?.clickUrl || null;

      setToast({
        title,
        body,
        clickUrl,
        onClick: () => {
          if (clickUrl) navigate(clickUrl);
          setToast(null);
        },
      });
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
      <>
        <Suspense fallback={<AppLoader />}>
          {(() => {
            switch (user.accountType) {
              case "rider":   return <RiderRoutes />;
              case "vendor":  return <VendorRoutes />;
              case "admin":   return <AdminRoutes />;
              case "customer":
              default:        return <CustomerRoutes />;
            }
          })()}
        </Suspense>
        <InstallAppPrompt />
        {toast && (
          <InAppToast toast={toast} onDismiss={() => setToast(null)} />
        )}
      </>
    );
  }

  return (
    <>
      <Suspense fallback={<AppLoader />}>
        <CustomerRoutes />
      </Suspense>
      <InstallAppPrompt />
      {toast && (
        <InAppToast toast={toast} onDismiss={() => setToast(null)} />
      )}
    </>
  );
};

export default App;
