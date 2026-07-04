import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

// Common Components
import Navbar from '../components/common/Navbar.jsx';
import Footer from '../components/common/Footer.jsx';
import MobileBottomNav from '../components/common/MobileBottomNav.jsx';
import CookiesConsent from '../components/CookiesConsent.jsx';
import ErrorBoundary from '../components/common/ErrorBoundary.jsx';

// Lazy Loaded Auth Components
const SignIn = lazy(() => import('../components/common/SignIn.jsx'));
const VerifyOtp = lazy(() => import('../components/common/VerifyOtp.jsx'));

// Lazy Loaded Rider Pages
const RiderSignup = lazy(() => import('../pages/rider/SignUpPage.jsx'));

// Lazy Loaded Vendor Pages
const VendorSignup = lazy(() => import('../pages/vendors/VendorSignup.jsx'));

// Lazy Loaded Customer Pages
const Home = lazy(() => import('../pages/customer/Home.jsx'));
const DishPage = lazy(() => import('../pages/customer/DishPage.jsx'));
const DishesListingPage = lazy(() => import('../pages/customer/DishesListingPage.jsx'));
const RestaurantListingPage = lazy(() => import('../pages/customer/RestaurantListingPage.jsx'));
const Citywise = lazy(() => import('../pages/customer/Citywise.jsx'));
const RestaurantPage = lazy(() => import('../pages/customer/RestaurantPage.jsx'));
const Cart = lazy(() => import('../pages/customer/Cart.jsx'));
const CheckoutPage = lazy(() => import('../pages/customer/CheckoutPage.jsx'));
const PrivacyPolicy = lazy(() => import('../pages/customer/PrivacyPolicy.jsx'));
const AboutUs = lazy(() => import('../pages/customer/AboutUs.jsx'));
const ContactUs = lazy(() => import('../pages/customer/ContactUs.jsx'));

// Lazy Loaded Account Pages
const CustomerLayout = lazy(() => import('../layouts/CustomerLayout.jsx'));
const Profile = lazy(() => import('../pages/customer/Profile.jsx'));
const Orders = lazy(() => import('../pages/customer/Orders.jsx'));
const Addresses = lazy(() => import('../pages/customer/Addresses.jsx'));
const Favourites = lazy(() => import('../pages/customer/Favourites.jsx'));
const Reviews = lazy(() => import('../pages/customer/Reviews.jsx'));
const Payments = lazy(() => import('../pages/customer/Payments.jsx'));
const ChatPage = lazy(() => import('../pages/customer/ChatPage.jsx'));

function CustomerRoutes() {
  const location = useLocation();

  // Hide footer on account pages
  const hideFooter = location.pathname.startsWith('/account');

  // Hide mobile nav on selected pages
  const hideMobileBottomNav = [
    '/signin',
    '/verify-otp',
    '/cart',
    '/checkout'
  ].includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 min-h-0 pb-20 md:pb-0">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[60vh] text-slate-500 text-sm">
              Loading...
            </div>
          }
        >
          <ErrorBoundary>
            <Routes>
              {/* ================= CUSTOMER ROUTES ================= */}
              <Route path="/" element={<Home />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/verify-otp" element={<VerifyOtp />} />
              <Route path="/dishes" element={<DishesListingPage />} />
              <Route path="/restaurants" element={<RestaurantListingPage />} />
              <Route path="/dish/:dishName" element={<DishPage />} />
              <Route path="/city/:cityName" element={<Citywise />} />
              <Route path="/restaurant/:id" element={<RestaurantPage />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<CheckoutPage />} />

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
                <Route path="about" element={<AboutUs />} />
                <Route path="contact" element={<ContactUs />} />
                <Route path="privacy" element={<PrivacyPolicy />} />
              </Route>

              {/* ================= PARTNER SIGNUP ROUTES ================= */}
              <Route path="/rider-signup" element={<RiderSignup />} />
              <Route path="/vendor-signup" element={<VendorSignup />} />

              {/* ================= INFO ROUTES (standalone) ================= */}
              <Route path="/about" element={<AboutUs />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
            </Routes>
          </ErrorBoundary>
        </Suspense>
      </main>

      {!hideFooter && (
        <div className="hidden md:block">
          <Footer />
        </div>
      )}

      {!hideMobileBottomNav && <MobileBottomNav />}
      <CookiesConsent />
    </div>
  );
}

export default CustomerRoutes;
