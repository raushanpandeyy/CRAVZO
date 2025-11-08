import React, { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Sidebar from '../pages/customer/Sidebar'
const CustomerLayout = () => {
  const navigate = useNavigate();
  const [sidebar, setSidebar] = useState(false);

  return (
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
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default CustomerLayout;