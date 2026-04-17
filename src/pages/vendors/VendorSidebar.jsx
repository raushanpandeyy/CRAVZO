import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Menu,
  Store,
  MessageCircle
} from "lucide-react";
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '', label: 'Dashboard', Icon: LayoutDashboard },
  { to: 'orders', label: 'Orders', Icon: ShoppingBag },
  { to: 'menu', label: 'Menu', Icon: Menu },
  { to: 'profile', label: 'Profile', Icon: Store },
  { to: 'chat', label: 'Support Chat', Icon: MessageCircle },
];

const VendorSidebar = ({ sidebar, setSidebar }) => {
  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={`w-80 pt-20 h-screen bg-indigo-900 flex-col fixed top-0 left-0
          max-sm:hidden
          ${sidebar ? 'translate-x-0' : 'max-sm:-translate-x-full'}
          transition-transform duration-200 ease-in-out`}
      >
        <div className="px-2 text-sm text-white flex flex-col gap-2 w-full">
          {navItems.map((item) => {
            const NavIcon = item.Icon;

            return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebar(false)}
              className={({ isActive }) =>
                `px-4 py-3 flex items-center gap-3 rounded-md transition-colors w-full 
                ${isActive 
                  ? 'bg-indigo-600 text-white' 
                  : 'hover:bg-indigo-700 text-gray-200'}`
              }
            >
              <NavIcon className="w-6 h-6" />
              <span>{item.label}</span>
            </NavLink>
            );
          })}
        </div>

        {/* Logout Button */}
        
      </div>

      {/* Mobile Bottom Navbar */}
      <div className="sm:hidden fixed bottom-0 left-0 w-full bg-indigo-900 flex justify-between px-2 py-2 z-50">
        {navItems.slice(0, 5).map((item) => {
          const NavIcon = item.Icon;

          return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setSidebar(false)}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center px-1 py-1 text-xs
              ${isActive ? 'text-indigo-300' : 'text-white'}`
            }
          >
            <NavIcon className="w-6 h-6 mb-1" />
            <span className="text-[10px]">{item.label}</span>
          </NavLink>
          );
        })}
      </div>
    </>
  );
};

export default VendorSidebar;
