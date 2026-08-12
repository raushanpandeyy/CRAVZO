import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Headphones,
  ChefHat,
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

import {dodagologo} from "../../assets/images/logos.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useChatNotifications } from "../../hooks/useChatNotifications.js";

const roleConfig = {
  rider: {
    title: "Rider",
    homePath: "/rider-dashboard",
    items: [
      { label: "Home", to: "/rider-dashboard", icon: Home },
      { label: "Orders", to: "/rider-analytics", icon: BarChart3 },
      { label: "Reviews", to: "/rider-reviews", icon: Star },
      { label: "Chat", to: "/rider-chat", icon: MessageCircle },
      { label: "Profile", to: "/rider-profile", icon: User },
    ],
    bottomItems: [
      { label: "Home", to: "/rider-dashboard", icon: Home },
      { label: "Orders", to: "/rider-analytics", icon: BarChart3 },
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
      { label: "KDS", to: "/vendor-dashboard/kitchen", icon: ChefHat },
      { label: "Reports", to: "/vendor-dashboard/reports", icon: BarChart3 },
      { label: "Reviews", to: "/vendor-dashboard/reviews", icon: Star },
      { label: "Profile", to: "/vendor-dashboard/profile", icon: PackageCheck },
      { label: "Chat", to: "/vendor-dashboard/chat", icon: MessageCircle },
    ],
    bottomItems: [
      { label: "Home", to: "/vendor-dashboard", icon: Store },
      { label: "Orders", to: "/vendor-dashboard/orders", icon: ReceiptText },
      { label: "Menu", to: "/vendor-dashboard/menu", icon: Utensils },
      { label: "Profile", to: "/vendor-dashboard/profile", icon: PackageCheck },
    ],
  },
};

const PartnerMobileTopNav = ({ role }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [chatMenuOpen, setChatMenuOpen] = React.useState(false);
  const { notifications, unreadCount, getChatPath, markAllRead, markNotificationRead } = useChatNotifications(user);
  const config = roleConfig[role];
  const activeItem = config.items.find((item) =>
    item.to === config.homePath ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );

  const handleLogout = async () => {
    await logout();
    navigate("/signin", { replace: true });
  };

  const openChatNotification = (notification) => {
    markNotificationRead(notification.id);
    setChatMenuOpen(false);
    navigate(getChatPath(notification));
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-100 bg-white px-4 py-2 shadow-sm shadow-slate-200/80 md:hidden">
      <div className="mx-auto flex max-w-md items-center gap-3">
        <button type="button" onClick={() => navigate(config.homePath)} className="shrink-0">
          <img src={dodagologo} alt="Dodago Logo" className="h-9 w-9 rounded-xl object-cover" />
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

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setChatMenuOpen((current) => !current);
              if (!chatMenuOpen) markAllRead();
            }}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-950 shadow-sm"
            aria-label={`Chat notifications with ${unreadCount} unread`}
          >
            <MessageCircle className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-500 px-1 text-center text-[10px] leading-5 text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </button>

          {chatMenuOpen ? (
            <div className="absolute right-0 top-12 z-[70] w-80 overflow-hidden rounded-2xl border border-slate-100 bg-white text-slate-950 shadow-2xl">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-black">Chat notifications</p>
                <p className="text-xs text-slate-500">Tap any item to open that chat.</p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length ? (
                  notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => openChatNotification(notification)}
                      className="flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50"
                    >
                      <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
                        <MessageCircle className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black">{notification.title || "Chat message"}</span>
                        <span className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500">
                          {notification.subtitle || notification.text || "New message"}
                        </span>
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-slate-500">No new chat notifications</div>
                )}
              </div>
            </div>
          ) : null}
        </div>

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
  const { user } = useAuth();
  const { unreadCount } = useChatNotifications(user);
  const config = roleConfig[role];
  const navItems = config.bottomItems || config.items;

  return (
    <nav className="fixed inset-x-0 mobile-safe-bottom-nav z-50 px-4 md:hidden">
      <div className="mx-auto flex max-w-md gap-1 overflow-x-auto rounded-3xl border border-slate-100 bg-white/95 p-2 shadow-xl shadow-slate-900/15 backdrop-blur">
        {navItems.map(({ label, icon, to }) => {
          const NavIcon = icon;
          const isActive = to === config.homePath ? location.pathname === to : location.pathname.startsWith(to);
          const showChatBadge = label === "Chat" && unreadCount > 0;

          return (
            <NavLink
              key={to}
              to={to}
              className={`flex min-w-[64px] flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-1.5 text-[10px] font-extrabold transition-all duration-200 active:scale-95 ${
                isActive ? "text-indigo-950" : "text-slate-500"
              }`}
            >
              <span
                className={`relative flex h-9 w-9 items-center justify-center rounded-2xl ${
                  isActive ? "bg-indigo-950 text-white shadow-md shadow-indigo-950/20" : "text-slate-500"
                }`}
              >
                <NavIcon className="h-5 w-5" />
                {showChatBadge ? (
                  <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[9px] leading-4 text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
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




