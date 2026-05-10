import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BarChart3, Home, User } from "lucide-react";

const navItems = [
  { label: "Home", path: "/rider-dashboard", icon: Home },
  { label: "History", path: "/rider-analytics", icon: BarChart3 },
  { label: "Profile", path: "/rider-profile", icon: User },
];

const RiderNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-gray-200 bg-white py-3 shadow-md">
      {navItems.map(({ label, path, icon }) => {
        const NavIcon = icon;
        const isActive = location.pathname === path;

        return (
          <button
            key={path}
            type="button"
            onClick={() => navigate(path)}
            className={`flex flex-col items-center gap-1 ${isActive ? "text-indigo-700" : "text-gray-500"}`}
          >
            <NavIcon className="h-6 w-6" />
            <span className="text-[10px] font-bold">{label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default RiderNavbar;
