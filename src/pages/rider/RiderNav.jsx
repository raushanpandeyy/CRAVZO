import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const RiderNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="fixed bottom-0 w-full bg-white border-t border-gray-200 py-3 flex justify-around items-center z-50 shadow-md">
      
      <button
        onClick={() => navigate("/rider-dashboard")}
        className={`flex flex-col items-center ${
          isActive("/rider-dashboard") ? "text-indigo-700" : "text-gray-500"
        }`}
      >
        <span className="text-2xl">🏠</span>
        <span className="text-[10px] font-bold">Home</span>
      </button>

      <button
        onClick={() => navigate("/rider-analytics")}
        className={`flex flex-col items-center ${
          isActive("/rider-analytics") ? "text-indigo-700" : "text-gray-500"
        }`}
      >
        <span className="text-2xl">📈</span>
        <span className="text-[10px] font-bold">History</span>
      </button>

      <button
        onClick={() => navigate("/rider-profile")}
        className={`flex flex-col items-center ${
          isActive("/rider-profile") ? "text-indigo-700" : "text-gray-500"
        }`}
      >
        <span className="text-2xl">⚙️</span>
        <span className="text-[10px] font-bold">Profile</span>
      </button>

    </div>
  );
};

export default RiderNavbar;