<<<<<<< HEAD
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Sidebar from "../pages/customer/Sidebar.jsx";

=======
import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Sidebar from '../pages/customer/Sidebar'
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
const CustomerLayout = () => {
  const [sidebar, setSidebar] = useState(false);

  return (
<<<<<<< HEAD
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
=======
    <div className='flex flex-col items-start justify-start h-screen'>
      <nav className='w-full px-1 min-h-20 flex items-center bg-indigo-900 justify-between border-b border-black-100'>
        
        {
          sidebar ? <X  onClick={() => setSidebar(false)} className='w-6 h-6 text-white sm:hidden'/>
          :<Menu onClick={()=> setSidebar(true)} className='w-6 h-6 text-white sm:hidden'/> 
        }
      </nav>

      <div className='flex-1 w-full overflow-y-auto flex h-[calc(100vh-64px)]'>
        <Sidebar sidebar={sidebar} setSidebar={setSidebar}  />
        <div className='flex-1 bg-[#F4F7FB] '>
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
          <Outlet />
        </div>
      </div>
    </div>
<<<<<<< HEAD
  );
};
=======
  )
}
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594

export default CustomerLayout;
