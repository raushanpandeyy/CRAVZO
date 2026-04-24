import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import ForgotPasswordForm from "./ForgotPasswordForm.jsx";
import OtpInput from "./OtpInput.jsx";
import { clearSession, login, sendOtp, signup, verifyOtp } from "../../services/authService.js";

const emptyOtp = ["", "", "", "", "", ""];

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(emptyOtp);
  const [showOtp, setShowOtp] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const navigate = useNavigate();

  const redirectForAccountType = useCallback((accountType) => {
    if (accountType === "admin") {
      navigate("/admin");
      return;
    }

    if (accountType === "vendor") {
      navigate("/vendor-dashboard");
      return;
    }

    if (accountType === "rider") {
      navigate("/rider-dashboard");
      return;
    }

    navigate("/");
  }, [navigate]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("cravzoCurrentUser"));

    if (user?.isLoggedIn) {
      setIsLoggedIn(true);
      redirectForAccountType(user.accountType);
    }
  }, [redirectForAccountType]);

  const handleVerifyOtp = async () => {
    setMessage("");
    setIsSubmitting(true);

    try {
      const user = await verifyOtp({
        email,
        otp: otp.join(""),
        role: "CUSTOMER",
      });

      setIsLoggedIn(true);
      setMessage("OTP verified successfully.");
      redirectForAccountType(user.accountType);
    } catch (error) {
      setMessage(error.message || "Invalid OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setMessage("");
    setIsSubmitting(true);

    try {
      await sendOtp({
        email,
        role: "CUSTOMER",
      });
      setOtp(emptyOtp);
      setMessage("OTP resent to your email.");
    } catch (error) {
      setMessage(error.message || "Failed to resend OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuth = async (event) => {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      if (isSignup) {
        await signup({
          name,
          email,
          phone,
          password,
          role: "CUSTOMER",
        });
        setShowOtp(true);
        setMessage("OTP sent to your email.");
      } else {
        const user = await login({ email, password });
        setIsLoggedIn(true);
        redirectForAccountType(user.accountType);
      }
    } catch (error) {
      setMessage(error.message || "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    setIsLoggedIn(false);
    navigate("/signin");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-indigo-200 pt-20">
      <div className="w-96 space-y-4 rounded-2xl bg-white p-8 shadow-xl">
        <h2 className="text-center text-2xl font-bold text-indigo-800">
          {isForgotPassword ? "Reset Password" : isSignup ? "Sign Up" : "Login"}
        </h2>

        {!isForgotPassword && message ? <p className="text-center text-indigo-700">{message}</p> : null}

        {isForgotPassword ? (
          <ForgotPasswordForm
            role="CUSTOMER"
            onBack={() => {
              setIsForgotPassword(false);
              setMessage("");
            }}
          />
        ) : isLoggedIn ? (
          <button onClick={handleLogout} className="w-full rounded bg-red-500 py-2 text-white">
            Logout
          </button>
        ) : (
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignup ? (
              <>
                <input
                  type="text"
                  placeholder="Name"
                  className="w-full rounded border p-2"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  className="w-full rounded border p-2"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  required
                />
              </>
            ) : null}

            <input
              type="email"
              placeholder="Email"
              className="w-full rounded border p-2"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full rounded border p-2"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {showOtp ? (
              <>
                <OtpInput otp={otp} setOtp={setOtp} />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={isSubmitting}
                  className="w-full rounded bg-green-500 py-2 text-white disabled:opacity-70"
                >
                  Verify OTP
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isSubmitting}
                  className="w-full rounded border border-indigo-300 py-2 text-indigo-700 disabled:opacity-70"
                >
                  Resend OTP
                </button>
              </>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded bg-indigo-600 py-2 text-white disabled:opacity-70"
            >
              {isSignup ? "Create Account" : "Login"}
            </button>

            {!isSignup ? (
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(true);
                  setMessage("");
                }}
                className="w-full text-center text-sm text-indigo-600"
              >
                Forgot password?
              </button>
            ) : null}
          </form>
        )}

        <p onClick={() => {
          setIsSignup((current) => !current);
          setIsForgotPassword(false);
          setMessage("");
          setShowOtp(false);
          setOtp(emptyOtp);
        }} className="cursor-pointer text-center text-indigo-600">
          {isSignup ? "Already have an account? Login" : "New user? Sign Up"}
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
