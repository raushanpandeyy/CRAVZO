import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Menu,
  Store,
  MessageCircle,
  ChefHat,
  BarChart3
} from "lucide-react";
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '', label: 'Dashboard', Icon: LayoutDashboard },
  { to: 'orders', label: 'Orders', Icon: ShoppingBag },
  { to: 'menu', label: 'Menu', Icon: Menu },
  { to: 'kitchen', label: 'Kitchen Display', Icon: ChefHat },
  { to: 'reports', label: 'Reports', Icon: BarChart3 },
  { to: 'profile', label: 'Profile', Icon: Store },
  { to: 'chat', label: 'Support Chat', Icon: MessageCircle },
];

const VendorSidebar = ({ sidebar = false, setSidebar = () => {} }) => {
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
    </>
  );
};

export default VendorSidebar;

