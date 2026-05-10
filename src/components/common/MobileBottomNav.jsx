import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, ReceiptText, Search, User } from "lucide-react";

const navItems = [
  { label: "Home", icon: Home, to: "/" },
  { label: "Search", icon: Search, to: "/restaurants" },
  { label: "Orders", icon: ReceiptText, to: "/account/orders" },
  { label: "Profile", icon: User, to: "/account/profile" },
];

const MobileBottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed inset-x-0 bottom-3 z-50 px-4 md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 rounded-3xl border border-slate-100 bg-white/95 p-2 shadow-xl shadow-slate-900/15 backdrop-blur">
        {navItems.map(({ label, icon, to }) => {
          const NavIcon = icon;
          const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

          return (
            <Link
              key={label}
              to={to}
              className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-1.5 text-[11px] font-extrabold transition-all duration-200 active:scale-95 ${
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
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
