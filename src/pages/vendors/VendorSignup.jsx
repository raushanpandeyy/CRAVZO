import React, { useState, lazy, Suspense } from "react";
import { Lock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { VendorImage } from "../../assets/images/vendorrider.js";
import faqs from "../../assets/data/VendorFAQs.json";
const ForgotPasswordForm = lazy(() =>
  import("../../components/common/ForgotPasswordForm.jsx")
);

const OtpInput = lazy(() =>
  import("../../components/common/OtpInput.jsx")
);
import { login, sendOtp, signup, verifyOtp } from "../../services/authService.js";

const emptyOtp = ["", "", "", "", "", ""];
const vendorPrimaryButtonClassName =
  "rounded-2xl bg-indigo-950 py-3.5 font-extrabold text-white shadow-lg shadow-indigo-950/20 transition active:scale-[0.99] disabled:opacity-70";

function FormInput({ label, icon: Icon, value, onChange, type = "text", placeholder }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-bold text-slate-600">{label}</label>
      <div className="relative">
        {Icon ? <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /> : null}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pr-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 ${
            Icon ? "pl-12" : "pl-4"
          }`}
        />
      </div>
    </div>
  );
}

export default function VendorSignup() {
  const [step, setStep] = useState("form");
  const [isLogin, setIsLogin] = useState(false);
  const [otp, setOtp] = useState(emptyOtp);
  const [phone, setPhone] = useState("");
  const [openIndex, setOpenIndex] = useState(null);
  const [showFAQ, setShowFAQ] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const updateForm = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handlePhoneChange = (event) => {
    setPhone(event.target.value.replace(/\D/g, "").slice(0, 10));
  };

  const handleContinue = async () => {
    if (step === "form") {
      if (!form.name || !form.email || !phone || !form.password) {
        setMessage("Please fill all fields");
        return;
      }
      setMessage("");
      setIsSubmitting(true);

      try {
        await signup({
          name: form.name,
          email: form.email,
          phone,
          password: form.password,
          role: "VENDOR",
        });
        setStep("otp");
        setMessage("OTP sent to your email.");
      } catch (error) {
        setMessage(error.message || "Failed to start vendor signup");
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    if (step === "otp") {
      setMessage("");
      setIsSubmitting(true);

      try {
        await verifyOtp({
          email: form.email,
          otp: otp.join(""),
          role: "VENDOR",
        });
        navigate("/vendor-dashboard");
      } catch (error) {
        setMessage(error.message || "Invalid OTP");
      } finally {
        setIsSubmitting(false);
      }

      return;
    }
  };

  const handleVendorLogin = async () => {
    setMessage("");
    setIsSubmitting(true);

    try {
      await login({
        email: form.email,
        password: form.password,
      });
      setMessage("Login successful!");
      navigate("/vendor-dashboard");
    } catch (error) {
      setMessage(error.message || "Vendor login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setMessage("");
    setIsSubmitting(true);

    try {
      await sendOtp({
        email: form.email,
        role: "VENDOR",
      });
      setOtp(emptyOtp);
      setMessage("OTP resent to your email.");
    } catch (error) {
      setMessage(error.message || "Failed to resend OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSignupState = () => {
    setStep("form");
    setOtp(emptyOtp);
    setPhone("");
    setMessage("");
    setIsForgotPassword(false);
  };

  return (
    <div className="relative min-h-screen bg-[#F4F7FB] md:bg-transparent">
      <div className="absolute inset-x-0 top-0 h-[360px] bg-cover bg-center md:inset-0 md:h-auto" style={{ backgroundImage: `url(${VendorImage})` }} />
      <div className="absolute inset-x-0 top-0 h-[360px] bg-gradient-to-t from-black/80 via-black/45 to-black/20 md:inset-0 md:h-auto md:bg-black/60" />

      <div className="relative z-10 flex min-h-screen flex-col md:flex-row">
        <div className="px-5 pb-24 pt-28 text-white md:hidden">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
            Business Partner
          </span>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight">
            Grow your restaurant with <span className="text-indigo-300">Dodago</span>
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-white/90">
            Manage orders, menu, payouts, and support from one dashboard.
          </p>
        </div>

        <div className="hidden w-2/3 items-center px-16 text-white md:flex">
          <h1 className="text-5xl font-extrabold">
            Join India&apos;s <span className="text-indigo-400">fastest growing</span> platform!
          </h1>
        </div>

        <div className="w-full px-4 pb-8 md:w-1/3 md:p-4 md:pt-24">
          <div className="mx-auto -mt-20 w-full max-w-md rounded-[28px] border border-white/80 bg-white p-5 shadow-2xl shadow-slate-900/15 md:mt-0 md:p-6">
            <div className="mb-4 text-center">
              <button
                onClick={() => {
                  setIsLogin((current) => !current);
                  resetSignupState();
                }}
                className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-800"
              >
                {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
              </button>
            </div>

            <h2 className="mb-2 text-center text-2xl font-extrabold text-slate-950">
              {isForgotPassword ? "Reset Vendor Password" : isLogin ? "Vendor Login" : step === "otp" ? "Verify OTP" : "Create Account"}
            </h2>
            <p className="mb-4 text-center text-sm font-medium leading-6 text-slate-500">
              {isLogin ? "Access orders, menu, and restaurant settings." : "Enter your details to get started."}
            </p>
            {!isForgotPassword && message ? <p className="mb-4 rounded-2xl bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-800">{message}</p> : null}

            {isForgotPassword ? (
              <Suspense fallback={<div>Loading reset form...</div>}>
  <ForgotPasswordForm
    role="VENDOR"
    onBack={() => {
      setIsForgotPassword(false);
      setMessage("");
    }}
    buttonClassName="w-full rounded-xl bg-indigo-600 py-3 text-white disabled:opacity-70"
  />
</Suspense>
            ) : isLogin ? (
              <div className="space-y-4">
                <FormInput
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateForm("email", event.target.value)}
                />
                <FormInput
                  label="Password"
                  icon={Lock}
                  type="password"
                  value={form.password}
                  onChange={(event) => updateForm("password", event.target.value)}
                />
                <button
                  onClick={handleVendorLogin}
                  disabled={isSubmitting}
                  className={`w-full ${vendorPrimaryButtonClassName}`}
                >
                  {isSubmitting ? "Please wait..." : "Login"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="w-full text-center text-sm text-indigo-600"
                >
                  Forgot password?
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {step === "form" ? (
                  <>
                    <FormInput
                      label="Name"
                      icon={User}
                      value={form.name}
                      onChange={(event) => updateForm("name", event.target.value)}
                      placeholder="Your full name"
                    />
                    <input
                      placeholder="Mobile Number"
                      value={phone}
                      onChange={handlePhoneChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-950 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />
                    <FormInput
                      label="Email"
                      type="email"
                      value={form.email}
                      onChange={(event) => updateForm("email", event.target.value)}
                      placeholder="your@email.com"
                    />
                    <FormInput
                      label="Password"
                      icon={Lock}
                      type="password"
                      value={form.password}
                      onChange={(event) => updateForm("password", event.target.value)}
                      placeholder="Create password"
                    />
                    <p className="text-xs text-slate-400">At least 8 characters</p>
                  </>
                ) : null}

                {step === "otp" ? (
                  <>
                    <Suspense fallback={<div>Loading OTP...</div>}>
                      <OtpInput otp={otp} setOtp={setOtp} />
                    </Suspense>
                    <button
                      onClick={handleResendOtp}
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-indigo-300 py-3 text-indigo-700 disabled:opacity-70"
                    >
                      Resend OTP
                    </button>
                  </>
                ) : null}
              </div>
            )}

            {!isLogin ? (
              <div className="mt-6">
                <button
                  onClick={handleContinue}
                  disabled={isSubmitting}
                  className={`w-full ${vendorPrimaryButtonClassName}`}
                >
                  {isSubmitting ? "Please wait..." : step === "otp" ? "Verify & Create Account" : "Create Account"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {!isLogin ? (
        <button
          onClick={() => setShowFAQ(true)}
          className="fixed right-5 bottom-5 z-50 rounded-full bg-indigo-950 px-5 py-3 font-bold text-white shadow-lg hover:bg-indigo-800"
        >
          FAQs
        </button>
      ) : null}

      {showFAQ ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowFAQ(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="mb-4 text-2xl font-bold text-slate-900">Vendor FAQs</h2>

            {faqs.map((faq, index) => (
              <div key={faq.question} className="mb-3 overflow-hidden rounded-xl border">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full bg-slate-50 px-4 py-3 text-left font-semibold"
                >
                  {faq.question}
                </button>
                {openIndex === index ? <div className="px-4 py-3 text-sm text-slate-600">{faq.answer}</div> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
