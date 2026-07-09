import React from 'react';
import { ShoppingBag, CreditCard, MapPin, Star, Bookmark, User, MessageCircle, Info, Shield, PhoneCall, Gift } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: '/account/profile', label: 'Profile', Icon: User },
  { to: '/account/orders', label: 'Orders', Icon: ShoppingBag },
  { to: '/account/payments', label: 'Payments', Icon: CreditCard },
  { to: '/account/refer', label: 'Refer & Earn', Icon: Gift },
  { to: '/account/addresses', label: 'Addresses', Icon: MapPin },
  { to: '/account/favourites', label: 'Favourites', Icon: Bookmark },
  { to: '/account/reviews', label: 'Reviews', Icon: Star },
  { to: '/account/chat', label: 'Support Chat', Icon: MessageCircle },
];

const externalLinks = [
  { to: '/account/about', label: 'About', Icon: Info },
  { to: '/account/contact', label: 'Contact', Icon: PhoneCall },
  { to: '/account/privacy', label: 'Privacy', Icon: Shield },
];

const Sidebar = () => {
  return (
    <>
      {/* Mobile Account Navigation */}
      <nav className="sticky top-14 z-40 border-b border-slate-200 bg-[#F4F7FB] px-3 py-2 shadow-sm shadow-slate-200/70 sm:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => {
            const NavIcon = item.Icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex min-w-max items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-extrabold transition-all ${
                    isActive
                      ? 'border-indigo-950 bg-indigo-950 text-white shadow-md shadow-indigo-950/15'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`
                }
              >
                <NavIcon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          {/* Divider */}
          <div className="flex items-center border-l border-slate-300 mx-1 h-8 shrink-0" />
          {externalLinks.map((item) => {
            const NavIcon = item.Icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className="flex min-w-max items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-extrabold transition-all border-indigo-950 bg-indigo-950 text-white shadow-md shadow-indigo-950/15"
              >
                <NavIcon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

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
          {/* Divider */}
          <div className="border-t border-indigo-700 my-2" />
          {externalLinks.map((item) => {
            const NavIcon = item.Icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-4 py-3 flex items-center gap-3 rounded-md transition-colors w-full 
                  ${isActive ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-700'}`
                }
              >
                <NavIcon className="w-5 h-5" />
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