import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

// Common
import Navbar from '../components/common/Navbar.jsx';
import Footer from '../components/common/Footer.jsx';
import SignIn from '../components/common/SignIn.jsx';
import VerifyOtp from '../components/common/VerifyOtp.jsx';

// Rider Pages
import RiderSignup from '../pages/rider/SignUpPage.jsx';

// Vendor Pages
import VendorSignup from '../pages/vendors/VendorSignup.jsx';

// Customer Pages
import Home from '../pages/customer/Home.jsx';
import DishPage from "../pages/customer/DishPage.jsx";
import Citywise from '../pages/customer/Citywise.jsx';
import RestaurantPage from '../pages/customer/RestaurantPage.jsx';
import CheckoutPage from '../pages/customer/CheckoutPage.jsx';

// Account Pages
import CustomerLayout from '../layouts/CustomerLayout.jsx';
import Profile from '../pages/customer/Profile.jsx';
import Orders from '../pages/customer/Orders.jsx';
import Addresses from '../pages/customer/Addresses.jsx';
import Favourites from '../pages/customer/Favourites.jsx';
import Reviews from '../pages/customer/Reviews.jsx';
import Payments from '../pages/customer/Payments.jsx';
import ChatPage from '../pages/customer/ChatPage.jsx';

function CustomerRoutes() {
  const location = useLocation();

  // Hide footer on account pages
  const hideFooter = location.pathname.startsWith('/account');

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 min-h-0">
        <Routes>
          {/* ================= CUSTOMER ROUTES ================= */}
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/dish/:dishName" element={<DishPage />} />
          <Route path="/city/:cityName" element={<Citywise />} />
          <Route path="/restaurant/:id" element={<RestaurantPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          
          {/* ================= SIGNUP ROUTES ================= */}
          <Route path="/rider-signup" element={<RiderSignup />} />
          <Route path="/vendor-signup" element={<VendorSignup />} />

          {/* ================= ACCOUNT ROUTES ================= */}
          <Route path="/account" element={<CustomerLayout />}>
            <Route index element={<Profile />} />
            <Route path="profile" element={<Profile />} />
            <Route path="orders" element={<Orders />} />
            <Route path="addresses" element={<Addresses />} />
            <Route path="favourites" element={<Favourites />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="payments" element={<Payments />} />
            <Route path="chat" element={<ChatPage />} />
          </Route>
        </Routes>
      </main>

      {!hideFooter && <Footer />}
    </div>
  );
}

export default CustomerRoutes;


