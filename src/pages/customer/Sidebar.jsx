import React from 'react';
import { ShoppingBag, CreditCard, MapPin, Star, Bookmark, LogOut, User } from "lucide-react";
import {NavLink} from 'react-router-dom';





const navItems = [
  { to: '/account/profile', label: 'Profile', Icon:User },
  { to: '/account/orders', label: 'Orders', Icon: ShoppingBag },
  { to: '/account/payments', label: 'Payments', Icon: CreditCard},
  { to: '/account/addresses', label: 'Addresses', Icon: MapPin },
  { to: '/account/favourites', label: 'Favourites', Icon: Bookmark },
  { to: '/account/reviews', label: 'Reviews', Icon: Star },
  { to: '/account/logout', label: 'Logout', Icon: LogOut },
]








const Sidebar = ({sidebar, setSidebar}) => {
  return (
 
  

    <div className={`w-60 h-full bg-gray-100 flex flex-col  items-start max-sm:absolute bottom-0 
      ${sidebar ? 'translate-x-0' : 'max-sm:-translate-x-full'} 
      transition-all duration-300 ease-in-out`}>
      <div className='my-7 w-full'>

      </div>
       <div className="px-2 text-sm text-gray-600 font-medium  flex flex-col justify-center">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/account'}
            onClick={() => setSidebar(false)}
            className={({ isActive }) =>
              `px-3.5 py-2.5 flex items-center gap-3 rounded-md transition-colors 
              ${isActive ? 'bg-indigo-800 text-white' : 'hover:bg-gray-100'}`
            }
          >
            {({ isActive }) => {
              const active = isActive;
              return (
                <>
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-600'}`} />
                  <span>{label}</span>
                </>
              )
            }}
          </NavLink>
        ))}
      </div>
    </div>
  )
}

export default Sidebar