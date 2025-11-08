import React from 'react';
import { ShoppingBag, CreditCard, MapPin, Star, Bookmark, LogOut, User } from "lucide-react";
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/account/profile', label: 'Profile', Icon: User },
  { to: '/account/orders', label: 'Orders', Icon: ShoppingBag },
  { to: '/account/payments', label: 'Payments', Icon: CreditCard },
  { to: '/account/addresses', label: 'Addresses', Icon: MapPin },
  { to: '/account/favourites', label: 'Favourites', Icon: Bookmark },
  { to: '/account/reviews', label: 'Reviews', Icon: Star },
  { to: '/account/logout', label: 'Logout', Icon: LogOut },
];

const Sidebar = ({ sidebar, setSidebar }) => {
  return (
    <>
      {/* Desktop/Tablet Sidebar */}
      <div
        className={`w-80 pt-20 h-screen bg-indigo-900 flex-col items-start fixed top-0 left-0
          max-sm:hidden
          ${sidebar ? 'translate-x-0' : 'max-sm:-translate-x-full'}
          transition-transform duration-200 ease-in-out`}
      >
        <div className="my-7 w-full" />
        <div className="px-2 text-sm text-white flex flex-col gap-2 w-full">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/account'}
              onClick={() => setSidebar(false)}
              className={({ isActive }) =>
                `px-4 py-3 flex items-center gap-3 rounded-md transition-colors w-full 
                ${isActive ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-700'}`
              }
            >
              <Icon className="w-6 h-6" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Mobile Bottom Navbar */}
      <div className="sm:hidden fixed bottom-0 left-0 w-full bg-indigo-900 flex justify-between px-2 py-2 z-50">
        {navItems.slice(0, 6).map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebar(false)}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center px-1 py-1 text-xs
              ${isActive ? 'text-indigo-300' : 'text-white'}`
            }
          >
            <Icon className="w-6 h-6 mb-1" />
            <span className="text-[10px]">{label}</span>
          </NavLink>
        ))}
      </div>
    </>
  );
};

export default Sidebar;
