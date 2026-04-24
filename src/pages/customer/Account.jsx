import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
<<<<<<< HEAD
import Sidebar from './Sidebar.jsx'
=======
import Sidebar from './Sidebar'
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
const Account = () => {
  const [sidebar, setSidebar] = useState(false);

  return (
    <div className='flex flex-col items-start justify-start h-screen'>
      <nav className='w-full px-8 min-h-14 flex items-center justify-between border-b border-gray-200'>
        
        {
          sidebar ? <X  onClick={() => setSidebar(false)} className='w-6 h-6 text-gray-600 sm:hidden'/>
          :<Menu onClick={()=> setSidebar(true)} className='w-6 h-6 text-gray-600 sm:hidden'/> 
        }
      </nav>

      <div className='flex-1 w-full flex h-[calc(100vh-64px)]'>
        <Sidebar sidebar={sidebar} setSidebar={setSidebar} />
<<<<<<< HEAD
        <div className='flex-1 bg-[#F4F7FB] pt-16 pb-16 sm:pb-0 overflow-y-auto'>
=======
        <div className='flex-1 bg-[#F4F7FB]'>
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default Account;
