import React from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Headphones,
  Image,
  IndianRupee,
  ShoppingBag,
  Star,
  Store,
  UserPlus,
  Users,
} from "lucide-react";

const navItems = [
  { path: "/admin/featured", icon: Star, label: "Featured & Ads" },
  { path: "/admin/orders", icon: ShoppingBag, label: "Orders" },
  { path: "/admin/users", icon: Users, label: "Users" },
  { path: "/admin/restaurants", icon: Store, label: "Vendors" },
  { path: "/admin/pending", icon: UserPlus, label: "Pending" },
  { path: "/admin/support", icon: Headphones, label: "Support" },
  { path: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { path: "/admin/promotions", icon: Image, label: "Promotions" },
  { path: "/admin/markup-settings", icon: IndianRupee, label: "Markup Settings" },
];

const AdminSidebar = () => {
  return (
    <aside className="fixed left-0 top-16 bottom-0 w-52 bg-white border-r border-slate-200 overflow-y-auto hidden md:block">
      <nav className="p-2 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default AdminSidebar;