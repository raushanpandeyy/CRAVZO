import React, { useCallback, useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, Phone, ShieldCheck, User } from "lucide-react";



const ForgotPasswordForm = lazy(() =>
  import("./ForgotPasswordForm.jsx")
);

const OtpInput = lazy(() =>
  import("./OtpInput.jsx")
);

import {dodagologo} from "../../assets/images/logos.js";
import { clearSession, login, sendOtp, signup, verifyOtp } from "../../services/authService.js";

const emptyOtp = ["", "", "", "", "", ""];

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-950 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100";

const AuthInput = ({ icon: Icon, className = "", ...props }) => (
  <div className="relative">
    {Icon ? <Icon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /> : null}
    <input {...props} className={`${inputClassName} ${Icon ? "pl-12" : ""} ${className}`} />
  </div>
);

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
    const user = JSON.parse(localStorage.getItem("dodagoCurrentUser"));

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

  const title = isForgotPassword ? "Reset Password" : isSignup ? "Create Customer Account" : "Welcome Back";
  const subtitle = isForgotPassword
    ? "Enter your email and set a fresh password securely."
    : isSignup
      ? "Sign up to order faster, save addresses, and track deliveries."
      : "Login to continue ordering your favourite food.";

  return (
    <div className="min-h-screen bg-[#F4F7FB] px-4 pb-8 pt-24 md:flex md:items-center md:justify-center md:bg-gradient-to-br md:from-indigo-100 md:via-white md:to-indigo-200">
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-2xl shadow-indigo-950/10">
        <div className="bg-indigo-950 px-6 pb-8 pt-7 text-white">
          <div className="mb-5 flex items-center justify-between">
            <img src={dodagologo} alt="Dodago Logo" className="h-12 w-12 rounded-2xl object-cover" />
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide">
              Customer
            </span>
          </div>
          <h2 className="text-3xl font-extrabold leading-tight">{title}</h2>
          <p className="mt-2 text-sm font-medium leading-6 text-indigo-100">{subtitle}</p>
        </div>

        <div className="space-y-5 p-5 sm:p-7">
          {!isForgotPassword && message ? (
            <p className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-center text-sm font-semibold text-indigo-800">
              {message}
            </p>
          ) : null}

          {isForgotPassword ? (
            <Suspense fallback={<div>Loading reset form...</div>}>
              <ForgotPasswordForm
                role="CUSTOMER"
                onBack={() => {
                  setIsForgotPassword(false);
                  setMessage("");
                }}
              />
            </Suspense>
          ) : isLoggedIn ? (
            <button onClick={handleLogout} className="w-full rounded-2xl bg-red-500 py-3 font-bold text-white">
              Logout
            </button>
          ) : (
            <form onSubmit={handleAuth} className="space-y-4">
              {isSignup ? (
                <>
                  <AuthInput
                    type="text"
                    placeholder="Name"
                    icon={User}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                  <AuthInput
                    type="tel"
                    placeholder="Phone"
                    icon={Phone}
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    required
                  />
                </>
              ) : null}

              <AuthInput
                type="email"
                placeholder="Email"
                icon={Mail}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />

              <AuthInput
                type="password"
                placeholder="Password"
                icon={Lock}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <p className="-mt-2 text-xs text-slate-400">At least 8 characters</p>

              {showOtp ? (
                <>
                  <Suspense fallback={<div>Loading OTP...</div>}>
                    <OtpInput otp={otp} setOtp={setOtp} />
                  </Suspense>
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-3.5 font-bold text-white disabled:opacity-70"
                  >
                    <ShieldCheck className="h-5 w-5" />
                    Verify OTP
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isSubmitting}
                    className="w-full rounded-2xl border border-indigo-200 py-3 font-bold text-indigo-800 disabled:opacity-70"
                  >
                    Resend OTP
                  </button>
                </>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-indigo-950 py-3.5 font-extrabold text-white shadow-lg shadow-indigo-950/20 disabled:opacity-70"
              >
                {isSubmitting ? "Please wait..." : isSignup ? "Create Account" : "Login"}
              </button>

              {!isSignup ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setMessage("");
                  }}
                  className="w-full text-center text-sm font-bold text-indigo-700"
                >
                  Forgot password?
                </button>
              ) : null}
            </form>
          )}

          <button type="button" onClick={() => {
            setIsSignup((current) => !current);
            setIsForgotPassword(false);
            setMessage("");
            setShowOtp(false);
            setOtp(emptyOtp);
          }} className="w-full rounded-2xl bg-slate-100 px-4 py-3 text-center text-sm font-extrabold text-indigo-950">
            {isSignup ? "Already have an account? Login" : "New user? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
