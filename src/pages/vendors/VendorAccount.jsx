import React from 'react'
import { Outlet } from 'react-router-dom'
import VendorSidebar from './VendorSidebar.jsx'
const VendorAccount = () => {
  return (
    <div className='flex min-h-screen flex-col bg-[#F4F7FB]'>
      {/* Fixed Sidebar + Content Area */}
      <div className='flex flex-1'>
        {/* Sidebar */}
        <VendorSidebar />
        
        {/* Main Content - Shifted Right on Desktop */}
        <div className='flex-1 pt-4 sm:ml-80 sm:pt-24'>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default VendorAccount;
