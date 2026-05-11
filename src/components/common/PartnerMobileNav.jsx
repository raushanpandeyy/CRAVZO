import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Headphones,
  Home,
  LogOut,
  MessageCircle,
  PackageCheck,
  ReceiptText,
  Star,
  Store,
  User,
  Utensils,
} from "lucide-react";

import {cravzologo} from "../../assets/images/logos.js";
import { useAuth } from "../../hooks/useAuth.js";

const roleConfig = {
  rider: {
    title: "Rider",
    homePath: "/rider-dashboard",
    items: [
      { label: "Home", to: "/rider-dashboard", icon: Home },
      { label: "History", to: "/rider-analytics", icon: BarChart3 },
      { label: "Reviews", to: "/rider-reviews", icon: Star },
      { label: "Support", to: "/rider-contacts", icon: Headphones },
      { label: "Chat", to: "/rider-chat", icon: MessageCircle },
      { label: "Profile", to: "/rider-profile", icon: User },
    ],
  },
  vendor: {
    title: "Business",
    homePath: "/vendor-dashboard",
    items: [
      { label: "Home", to: "/vendor-dashboard", icon: Store },
      { label: "Orders", to: "/vendor-dashboard/orders", icon: ReceiptText },
      { label: "Menu", to: "/vendor-dashboard/menu", icon: Utensils },
      { label: "Profile", to: "/vendor-dashboard/profile", icon: PackageCheck },
      { label: "Chat", to: "/vendor-dashboard/chat", icon: MessageCircle },
    ],
  },
};

const PartnerMobileTopNav = ({ role }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const config = roleConfig[role];
  const activeItem = config.items.find((item) =>
    item.to === config.homePath ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );

  const handleLogout = async () => {
    await logout();
    navigate("/signin", { replace: true });
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-100 bg-white px-4 py-2 shadow-sm shadow-slate-200/80 md:hidden">
      <div className="mx-auto flex max-w-md items-center gap-3">
        <button type="button" onClick={() => navigate(config.homePath)} className="shrink-0">
          <img src={cravzologo} alt="Cravzo Logo" className="h-9 w-9 rounded-xl object-cover" />
        </button>

        <button
          type="button"
          onClick={() => navigate(config.homePath)}
          className="min-w-0 flex-1 rounded-2xl bg-slate-50 px-3 py-2 text-left"
        >
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {config.title}
          </span>
          <span className="block truncate text-sm font-extrabold leading-5 text-slate-950">
            {activeItem?.label || user?.name || "Dashboard"}
          </span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-950 text-white shadow-md"
          aria-label="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </nav>
  );
};

const PartnerMobileBottomNav = ({ role }) => {
  const location = useLocation();
  const config = roleConfig[role];

  return (
    <nav className="fixed inset-x-0 bottom-3 z-50 px-4 md:hidden">
      <div className="mx-auto flex max-w-md gap-1 overflow-x-auto rounded-3xl border border-slate-100 bg-white/95 p-2 shadow-xl shadow-slate-900/15 backdrop-blur">
        {config.items.map(({ label, icon, to }) => {
          const NavIcon = icon;
          const isActive = to === config.homePath ? location.pathname === to : location.pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              className={`flex min-w-[64px] flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-1.5 text-[10px] font-extrabold transition-all duration-200 active:scale-95 ${
                isActive ? "text-indigo-950" : "text-slate-500"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-2xl ${
                  isActive ? "bg-indigo-950 text-white shadow-md shadow-indigo-950/20" : "text-slate-500"
                }`}
              >
                <NavIcon className="h-5 w-5" />
              </span>
              <span className="whitespace-nowrap">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

const PartnerMobileNav = ({ role }) => (
  <>
    <PartnerMobileTopNav role={role} />
    <PartnerMobileBottomNav role={role} />
  </>
);

export default PartnerMobileNav;
