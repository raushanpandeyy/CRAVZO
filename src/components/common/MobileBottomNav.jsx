import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, ReceiptText, Search, User, Phone, Info, Shield, Download } from "lucide-react";

const navItems = [
  { label: "Home", icon: Home, to: "/" },
  { label: "Search", icon: Search, to: "/restaurants" },
  { label: "Orders", icon: ReceiptText, to: "/account/orders" },
  { label: "Profile", icon: User, to: "/account/profile" },
];

const bottomLinks = [
  { label: "Contact", icon: Phone, to: "/contact" },
  { label: "About", icon: Info, to: "/about" },
  { label: "Privacy", icon: Shield, to: "/privacy" },
];

const MobileBottomNav = () => {
  const location = useLocation();

  return (
    <>
      <nav className="fixed inset-x-0 mobile-safe-bottom-rail z-50 px-4 md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-center gap-4 rounded-full bg-white/90 px-3 py-1.5 shadow-lg shadow-slate-900/10 backdrop-blur">
          {bottomLinks.map(({ label, icon, to }) => {
            const BottomIcon = icon;
            const isActive = location.pathname === to;
            return (
              <Link
                key={label}
                to={to}
                className={`flex items-center gap-1 px-2 py-1 text-[10px] font-semibold transition-colors ${
                  isActive ? "text-indigo-600" : "text-slate-500"
                }`}
              >
                <BottomIcon className="h-3 w-3" />
                {label}
              </Link>
            );
          })}
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('showInstallPrompt')); }}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-indigo-600 transition-colors"
          >
            <Download className="h-3 w-3" />
            App
          </a>
        </div>
      </nav>

      <nav className="fixed inset-x-0 mobile-safe-bottom-nav z-50 px-4 md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 rounded-3xl border border-indigo-100 bg-white/95 p-1.5 shadow-xl shadow-indigo-900/10 backdrop-blur">
          {navItems.map(({ label, icon, to }) => {
            const NavIcon = icon;
            const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

            return (
              <Link
                key={label}
                to={to}
                className={`flex flex-col items-center gap-0.5 rounded-2xl px-1 py-1.5 text-[10px] font-extrabold transition-all duration-200 active:scale-95 ${
                  isActive ? "text-indigo-950" : "text-slate-500"
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                    isActive ? "bg-indigo-950 text-white shadow-md shadow-indigo-950/20" : ""
                  }`}
                >
                  <NavIcon className="h-4 w-4" />
                </span>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default MobileBottomNav;
