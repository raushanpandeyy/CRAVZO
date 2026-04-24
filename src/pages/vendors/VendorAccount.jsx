import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
<<<<<<< HEAD
import VendorSidebar from './VendorSidebar.jsx'
=======
import VendorSidebar from './VendorSidebar'
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
const VendorAccount = () => {
  const [sidebar, setSidebar] = useState(false);

  return (
    <div className='flex flex-col h-screen bg-[#F4F7FB]'>
      {/* Mobile Menu Button */}
      <nav className='w-full px-8 min-h-14 flex items-center justify-between border-b border-gray-200 bg-white sm:hidden'>
        {
          sidebar ? <X  onClick={() => setSidebar(false)} className='w-6 h-6 text-gray-600'/>
          :<Menu onClick={()=> setSidebar(true)} className='w-6 h-6 text-gray-600'/> 
        }
      </nav>

      {/* Fixed Sidebar + Content Area */}
      <div className='flex flex-1 overflow-hidden'>
        {/* Sidebar */}
        <VendorSidebar sidebar={sidebar} setSidebar={setSidebar} />
        
        {/* Main Content - Shifted Right on Desktop */}
        <div className='flex-1 overflow-y-auto pt-24 max-sm:pt-20 sm:ml-80'>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default VendorAccount;
