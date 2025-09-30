import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom'; // useLocation को import किया
import Navbar from '../components/common/Navbar.jsx';
import SignIn from '../components/common/SignIn.jsx';
import Home from '../pages/customer/Home.jsx';
import Footer from '../components/common/Footer.jsx';
import DishPage from "../pages/customer/DishPage.jsx";
import Citywise from '../pages/customer/Citywise.jsx';
import Profile from '../pages/customer/Profile.jsx';
import Account from '../pages/customer/Account.jsx';
import Orders from '../pages/customer/Orders.jsx';
import Payments from '../pages/customer/Payments.jsx';
import Reviews from '../pages/customer/Reviews.jsx';
import Favourites from '../pages/customer/Favourites.jsx';
import CustomerLayout from '../layouts/CustomerLayout.jsx';
import Addresses from '../pages/customer/Addresses.jsx';

function CustomerRoutes() {
  const location = useLocation(); // वर्तमान URL (location) को get किया
  
  // चेक करें कि क्या पाथ /account से शुरू होता है (जैसे /account/profile, /account/orders, आदि)
  const hideFooter = location.pathname.startsWith('/account');

  return (
    <div className="flex flex-col  min-h-screen">
      <Navbar />

      {/* Main content will take all available space */}
      <main className="flex-1 min-h-0">
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/dish/:dishName" element={<DishPage />} />
          <Route path="/city/:cityName" element={<Citywise />} />

          {/* Account section */}
          <Route path="/account" element={<CustomerLayout />}>
            
            <Route path="profile" element={<Profile />} />
            <Route path="orders" element={<Orders />} />
            <Route path="payments" element={<Payments />} />
            <Route path="addresses" element={<Addresses />} />
            <Route path="favourites" element={<Favourites />} />
            <Route path="reviews" element={<Reviews />} />
          </Route>
        </Routes>
      </main>
      
      {/* अगर hideFooter false है (यानी /account रूट नहीं है) तो Footer को render करें */}
      {!hideFooter && <Footer />}
      
    </div>
)
}


export default CustomerRoutes;


