import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { User, Phone, Mail, Lock, Calendar, VenetianMask, LogOut } from "lucide-react"; 
import { useNavigate } from "react-router-dom"; 

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [message, setMessage] = useState('');
  const [accountType, setAccountType] = useState('');
  const [customerRole, setCustomerRole] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const navigate = useNavigate();

  // check login status on page load
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('cravzoUser'));
    if (storedUser && storedUser.isLoggedIn) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleAuth = (e) => {
    e.preventDefault();
    const storedUser = JSON.parse(localStorage.getItem('cravzoUser'));

    if (isSignup) {
      if (storedUser && storedUser.email === email) {
        setMessage('User already exists. Please log in.');
      } else {
        const newUser = {
          name,
          phone,
          age,
          gender,
          email,
          password,
          accountType,
          customerRole: accountType === "customer" ? customerRole : null,
          isLoggedIn: true
        };
        localStorage.setItem('cravzoUser', JSON.stringify(newUser));
        setIsLoggedIn(true); // ✅ update state
        setMessage('Sign up successful! Redirecting...');
        setTimeout(() => navigate("/"), 1000);
      }
    } else {
      if (storedUser && storedUser.email === email && storedUser.password === password) {
        storedUser.isLoggedIn = true;
        localStorage.setItem('cravzoUser', JSON.stringify(storedUser));
        setIsLoggedIn(true); // ✅ update state
        setMessage('Login successful! Redirecting...');
        setTimeout(() => navigate("/"), 1000);
      } else {
        setMessage('Invalid credentials or user does not exist.');
      }
    }
  };

  const handleLogout = () => {
    const storedUser = JSON.parse(localStorage.getItem('cravzoUser'));
    if (storedUser) {
      storedUser.isLoggedIn = false;
      localStorage.setItem('cravzoUser', JSON.stringify(storedUser));
    }
    setIsLoggedIn(false);
    navigate("/login"); // redirect back to login page
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-indigo-100 via-white to-indigo-200">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white p-8 rounded-2xl shadow-xl w-96 space-y-4"
      >
        <h2 className="text-2xl text-indigo-800 font-bold mb-2 text-center">
          {isSignup ? 'Sign Up for Cravzo' : 'Login to Cravzo'}
        </h2>

        {message && (
          <p className="text-center text-sm text-indigo-700 font-medium">{message}</p>
        )}

        {isLoggedIn ? (
          // ✅ show only logout button when logged in
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-2 rounded-xl shadow-md hover:bg-red-800 transition"
          >
            <LogOut size={18} /> Logout
          </motion.button>
        ) : (
          // ✅ show login/signup form when NOT logged in
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignup && (
              <>
                <div className="flex items-center border border-indigo-700 rounded-xl px-3">
                  <User className="text-indigo-600 mr-2" size={20} />
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full p-2 outline-none text-indigo-800 placeholder-indigo-400"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-center border border-indigo-700 rounded-xl px-3">
                  <Phone className="text-indigo-600 mr-2" size={20} />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    className="w-full p-2 outline-none text-indigo-800 placeholder-indigo-400"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-center border border-indigo-700 rounded-xl px-3">
                  <Calendar className="text-indigo-600 mr-2" size={20} />
                  <input
                    type="number"
                    placeholder="Age"
                    className="w-full p-2 outline-none text-indigo-800 placeholder-indigo-400"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-center border border-indigo-700 rounded-xl px-3">
                  <VenetianMask className="text-indigo-600 mr-2" size={20} />
                  <select
                    className="w-full p-2 outline-none text-indigo-800 bg-white"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </>
            )}

            <div className="flex items-center border border-indigo-700 rounded-xl px-3">
              <Mail className="text-indigo-600 mr-2" size={20} />
              <input
                type="email"
                placeholder="Email"
                className="w-full p-2 outline-none text-indigo-800 placeholder-indigo-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center border border-indigo-700 rounded-xl px-3">
              <Lock className="text-indigo-600 mr-2" size={20} />
              <input
                type="password"
                placeholder="Password"
                className="w-full p-2 outline-none text-indigo-800 placeholder-indigo-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {isSignup && (
              <>
                <label className="block font-medium text-indigo-700">Account Type:</label>
                <select
                  className="w-full text-white bg-indigo-800 p-2 border border-indigo-700 rounded-xl"
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  required
                >
                  <option value="">Select</option>
                  <option value="customer">Customer</option>
                  <option value="rider">Rider</option>
                  <option value="restaurant">Restaurant</option>
                </select>
              </>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 rounded-xl shadow-md hover:bg-indigo-800 transition"
            >
              {isSignup ? 'Sign Up' : 'Login'}
            </motion.button>

            <p className="text-center text-sm mt-2">
              {isSignup ? 'Already have an account?' : 'New to Cravzo?'}{' '}
              <button
                type="button"
                className="text-indigo-700 hover:underline font-semibold"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setMessage('');
                  setEmail('');
                  setPassword('');
                  setAccountType('');
                  setCustomerRole('');
                  setName('');
                  setPhone('');
                  setAge('');
                  setGender('');
                }}
              >
                {isSignup ? 'Login' : 'Sign Up'}
              </button>
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default LoginPage;




