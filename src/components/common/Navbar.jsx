import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiMenu, FiX } from 'react-icons/fi';
import { User as UserIcon } from "lucide-react";  // Profile icon
import cravzologo from "../../assets/logos/cravzologo.png";
import Buttons from "../common/Buttons.jsx"

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [address, setAddress] = useState(""); 
  const navigate = useNavigate();

  // check user from localStorage on load
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("cravzoUser"));
    if (storedUser && storedUser.isLoggedIn) {
      setUser(storedUser);
      if (storedUser.address) {
        setAddress(storedUser.address); 
      }
    }
  }, []);

  const handleSignInClick = () => {
    navigate('/signin');
  };

  // Address Enter press karne par save
  const handleAddressKeyDown = (e) => {
    if (e.key === "Enter") {
      if (user) {
        const updatedUser = { ...user, address, isLoggedIn: true };
        localStorage.setItem("cravzoUser", JSON.stringify(updatedUser));
        setUser(updatedUser);
        alert("✅ Address saved!");
      } else {
        alert("⚠️ Please login first to save address");
        navigate("/signin");
      }
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-indigo-900 text-white shadow-md">
      <div className="max-w-[1200px] mx-auto px-4 py-4 flex justify-between items-center">
        <a href="/" className="flex items-center gap-2">
          <img src={cravzologo} alt="Cravzo Logo" className="h-12 rounded-2xl" />
          <span className="text-2xl font-bold">CRAVZO</span>
        </a>

        {/* Location Input (hidden on small screens) */}
        <div className="relative hidden md:block">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-900">
            <FiMapPin />
          </span>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={handleAddressKeyDown}
            placeholder="Enter your address..."
            className="w-[300px] pl-10 pr-4 py-2 placeholder-indigo-900 rounded-full text-indigo-900 bg-white focus:outline-none"
          />
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {/* Partner Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="bg-white text-indigo-900 px-4 py-2 rounded-full hover:bg-indigo-900 hover:text-white transition"
            >
              Partner
            </button>
            {isOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-indigo-900 rounded-md shadow-lg z-50">
                <a href="#" className="block px-4 py-2 hover:bg-indigo-900 hover:text-white">Rider</a>
                <a href="#" className="block px-4 py-2 hover:bg-indigo-900 hover:text-white">Business</a>
              </div>
            )}
          </div>

          <button className="bg-white text-indigo-900 px-4 py-2 rounded-full hover:bg-indigo-900 hover:text-white transition">
            APP
          </button>

          {/* Conditional Sign In / User */}
          {user ? (
            <div 
              onClick={() => navigate("/profile")} 
              className="flex items-center gap-2 cursor-pointer hover:text-gray-300 transition"
            >
              <UserIcon className="w-6 h-6 text-white" />
              <span className="font-semibold">
                Hello, {user.name.split(" ")[0]}
              </span>
            </div>
          ) : (
            <button
              onClick={handleSignInClick}
              className="bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800 transition"
            >
              Sign In
            </button>
          )}
        </div>
       

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-indigo-800 px-4 pb-4">
          <button className="block w-full text-left py-2 bg-white text-indigo-900 px-4 rounded-full mb-2">
            Partner
          </button>
          <button className="block w-full text-left py-2 bg-white text-indigo-900 px-4 rounded-full mb-2">
            APP
          </button>
          {user ? (
            <div 
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 px-2 py-2 cursor-pointer"
            >
              <UserIcon className="w-5 h-5 text-white" />
              <span>Hello, {user.name.split(" ")[0]}</span>
            </div>
          ) : (
            <button
              onClick={handleSignInClick}
              className="block w-full text-left py-2 bg-black text-white px-4 rounded-full"
            >
              Sign In
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;







