import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from '../components/common/Navbar.jsx';
import SignIn from '../components/common/SignIn.jsx';
import Home from '../pages/customer/Home.jsx';
import Footer from '../components/common/Footer.jsx';
import DishPage from "../pages/customer/DishPage.jsx";
import Citywise from '../pages/customer/Citywise.jsx';
import Profile from '../pages/customer/Profile.jsx';



function CustomerRoutes() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/dish/:dishName" element={<DishPage />} />
          <Route path="/city/:cityName" element={<Citywise />} />
            <Route path="/profile" element={<Profile />} />
          
          
          
        </Routes>
      </div>
      <Footer />
    </div>
  );
}


export default CustomerRoutes;


