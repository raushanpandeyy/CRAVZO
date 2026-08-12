import React from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Headphones,
  Image,
  ShoppingBag,
  Star,
  Store,
  UserPlus,
  Users,
} from "lucide-react";

const navItems = [
  { path: "/admin/featured", icon: Star, label: "Featured" },
  { path: "/admin/orders", icon: ShoppingBag, label: "Orders" },
  { path: "/admin/users", icon: Users, label: "Users" },
  { path: "/admin/restaurants", icon: Store, label: "Vendors" },
  { path: "/admin/pending", icon: UserPlus, label: "Pending" },
  { path: "/admin/support", icon: Headphones, label: "Support" },
  { path: "/admin/analytics", icon: BarChart3, label: "Stats" },
  { path: "/admin/promotions", icon: Image, label: "Promos" },
];

const AdminMobileNav = () => {
  return (
    <nav className="fixed left-0 right-0 mobile-safe-bottom-nav z-[100] bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] md:hidden">
      <div className="flex items-center justify-between h-14 px-0.5 overflow-x-auto [scrollbar-width:none]">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors ${
                isActive 
                  ? "text-indigo-600 bg-indigo-50" 
                  : "text-slate-400 hover:text-slate-600"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl ${isActive ? "bg-indigo-100" : ""}`}>
                  <item.icon className="h-4.5 w-4.5" />
                </div>
                <span className="text-[10px] font-bold mt-1">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default AdminMobileNav;
