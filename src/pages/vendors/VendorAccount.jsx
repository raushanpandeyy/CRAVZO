import React from 'react'
import { Outlet } from 'react-router-dom'
import VendorSidebar from './VendorSidebar.jsx'
const VendorAccount = () => {
  return (
    <div className='flex flex-col min-h-[calc(100vh-10rem)] bg-[#F4F7FB] md:h-screen'>
      {/* Fixed Sidebar + Content Area */}
      <div className='flex flex-1 overflow-hidden'>
        {/* Sidebar */}
        <VendorSidebar />
        
        {/* Main Content - Shifted Right on Desktop */}
        <div className='flex-1 overflow-y-auto pt-4 sm:ml-80 sm:pt-24'>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default VendorAccount;
