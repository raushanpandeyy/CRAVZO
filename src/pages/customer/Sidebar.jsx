import React from 'react';
import { ShoppingBag, CreditCard, MapPin, Star, Bookmark, User, MessageCircle } from "lucide-react";
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/account/profile', label: 'Profile', Icon: User },
  { to: '/account/orders', label: 'Orders', Icon: ShoppingBag },
  { to: '/account/payments', label: 'Payments', Icon: CreditCard },
  { to: '/account/addresses', label: 'Addresses', Icon: MapPin },
  { to: '/account/favourites', label: 'Favourites', Icon: Bookmark },
  { to: '/account/reviews', label: 'Reviews', Icon: Star },
  { to: '/account/chat', label: 'Support Chat', Icon: MessageCircle },
];

const Sidebar = () => {
  return (
    <>
      {/* Desktop/Tablet Sidebar */}
      <div
        className="fixed left-0 top-28 z-20 hidden h-[calc(100vh-7rem)] w-80 flex-col items-start overflow-y-auto bg-indigo-900 pt-4 sm:flex"
      >
        <div className="px-2 text-sm text-white flex flex-col gap-2 w-full">
          {navItems.map((item) => {
            const NavIcon = item.Icon;

            return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/account'}
              className={({ isActive }) =>
                `px-4 py-3 flex items-center gap-3 rounded-md transition-colors w-full 
                ${isActive ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-700'}`
              }
            >
              <NavIcon className="w-6 h-6" />
              <span>{item.label}</span>
            </NavLink>
            );
          })}
        </div>
      </div>

    </>
  );
};

export default Sidebar;
