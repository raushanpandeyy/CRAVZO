import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../pages/customer/Sidebar.jsx";

const CustomerLayout = () => {
  return (
    <div className="min-h-screen bg-[#F4F7FB] pt-20 md:pt-28">
      <div className="w-full">
        <Sidebar />
        <div className="min-h-[calc(100vh-7rem)] bg-[#F4F7FB] pb-24 sm:pl-80 sm:pb-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default CustomerLayout;
