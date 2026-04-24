import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Sidebar from "../pages/customer/Sidebar.jsx";

const CustomerLayout = () => {
  const [sidebar, setSidebar] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F7FB] pt-24 md:pt-28">
      <nav className="sticky top-24 z-30 flex min-h-14 w-full items-center justify-between border-b border-indigo-800 bg-indigo-900 px-4 sm:hidden">
        {sidebar ? (
          <X onClick={() => setSidebar(false)} className="h-6 w-6 text-white" />
        ) : (
          <Menu onClick={() => setSidebar(true)} className="h-6 w-6 text-white" />
        )}
        <span className="text-sm font-semibold text-white">My Account</span>
      </nav>

      <div className="w-full">
        <Sidebar sidebar={sidebar} setSidebar={setSidebar} />
        <div className="min-h-[calc(100vh-7rem)] bg-[#F4F7FB] pb-24 sm:pl-80 sm:pb-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default CustomerLayout;
