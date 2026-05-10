import React, { useState } from "react";
import { Lock, MapPin, Store, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

import VendorImage from "../../assets/images/VendorImage.webp";
import faqs from "../../assets/data/VendorFAQs.json";
import ForgotPasswordForm from "../../components/common/ForgotPasswordForm.jsx";
import OtpInput from "../../components/common/OtpInput";
import { login, sendOtp, signup, verifyOtp } from "../../services/authService.js";

const steps = ["Basic Info", "OTP Verification", "Location", "Business", "Account"];
const emptyOtp = ["", "", "", "", "", ""];
const vendorPrimaryButtonClassName =
  "rounded-2xl bg-indigo-950 py-3.5 font-extrabold text-white shadow-lg shadow-indigo-950/20 transition active:scale-[0.99] disabled:opacity-70";

function FormInput({ label, icon: Icon, value, onChange, type = "text" }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-bold text-slate-600">{label}</label>
      <div className="relative">
        {Icon ? <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /> : null}
        <input
          type={type}
          value={value}
          onChange={onChange}
          className={`w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pr-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 ${
            Icon ? "pl-12" : "pl-4"
          }`}
        />
      </div>
    </div>
  );
}

export default function VendorSignup() {
  const [step, setStep] = useState(1);
  const [isLogin, setIsLogin] = useState(false);
  const [otp, setOtp] = useState(emptyOtp);
  const [phone, setPhone] = useState("");
  const [openIndex, setOpenIndex] = useState(null);
  const [showFAQ, setShowFAQ] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const [form, setForm] = useState({
    restaurantName: "",
    ownerName: "",
    address: "",
    pincode: "",
    cuisine: "",
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

  const back = () => setStep((currentStep) => Math.max(currentStep - 1, 1));

  const handleContinue = async () => {
    if (step === 1) {
      setMessage("");
      setIsSubmitting(true);

      try {
        await signup({
          name: form.ownerName,
          email: form.email,
          phone,
          password: form.password,
          role: "VENDOR",
          onboardingData: {
            restaurantName: form.restaurantName,
          },
        });
        setStep(2);
        setMessage("OTP sent to your email.");
      } catch (error) {
        setMessage(error.message || "Failed to start vendor signup");
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    if (step === 2) {
      setMessage("");
      setIsSubmitting(true);

      try {
        await verifyOtp({
          email: form.email,
          otp: otp.join(""),
          role: "VENDOR",
        });
        setIsOtpVerified(true);
        setStep(3);
        setMessage("OTP verified. Complete your vendor onboarding details.");
      } catch (error) {
        setMessage(error.message || "Invalid OTP");
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    if (step < 5) {
      setStep((currentStep) => currentStep + 1);
      return;
    }

    await saveVendor();
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

  const saveVendor = async () => {
    setMessage("");
    setIsSubmitting(true);

    try {
      if (!isOtpVerified) {
        throw new Error("Verify OTP before completing vendor signup");
      }

      localStorage.setItem(
        "cravzoVendorOnboardingDraft",
        JSON.stringify({
          ...form,
          phone,
        })
      );

      setMessage("Vendor authentication complete. Your account is pending admin approval.");
      navigate("/vendor-dashboard");
    } catch (error) {
      setMessage(error.message || "Vendor signup failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSignupState = () => {
    setStep(1);
    setOtp(emptyOtp);
    setPhone("");
    setMessage("");
    setIsOtpVerified(false);
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
            Grow your restaurant with <span className="text-indigo-300">Cravzo</span>
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
              {isForgotPassword ? "Reset Vendor Password" : isLogin ? "Vendor Login" : steps[step - 1]}
            </h2>
            <p className="mb-4 text-center text-sm font-medium leading-6 text-slate-500">
              {isLogin ? "Access orders, menu, and restaurant settings." : "Verify your account and complete onboarding."}
            </p>
            {!isForgotPassword && message ? <p className="mb-4 rounded-2xl bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-800">{message}</p> : null}

            {isForgotPassword ? (
              <ForgotPasswordForm
                role="VENDOR"
                onBack={() => {
                  setIsForgotPassword(false);
                  setMessage("");
                }}
                buttonClassName="w-full rounded-xl bg-indigo-600 py-3 text-white disabled:opacity-70"
              />
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
                {step === 1 ? (
                  <>
                    <FormInput
                      label="Restaurant Name"
                      icon={Store}
                      value={form.restaurantName}
                      onChange={(event) => updateForm("restaurantName", event.target.value)}
                    />
                    <FormInput
                      label="Owner Name"
                      icon={User}
                      value={form.ownerName}
                      onChange={(event) => updateForm("ownerName", event.target.value)}
                    />
                    <input
                      placeholder="Phone"
                      value={phone}
                      onChange={handlePhoneChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-950 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />
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
                  </>
                ) : null}

                {step === 2 ? (
                  <>
                    <OtpInput otp={otp} setOtp={setOtp} />
                    <button
                      onClick={handleResendOtp}
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-indigo-300 py-3 text-indigo-700 disabled:opacity-70"
                    >
                      Resend OTP
                    </button>
                  </>
                ) : null}

                {step === 3 ? (
                  <>
                    <FormInput
                      label="Address"
                      icon={MapPin}
                      value={form.address}
                      onChange={(event) => updateForm("address", event.target.value)}
                    />
                    <FormInput
                      label="Pincode"
                      value={form.pincode}
                      onChange={(event) => updateForm("pincode", event.target.value)}
                    />
                  </>
                ) : null}

                {step === 4 ? (
                  <FormInput
                    label="Cuisine"
                    value={form.cuisine}
                    onChange={(event) => updateForm("cuisine", event.target.value)}
                  />
                ) : null}

                {step === 5 ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                    OTP verified. Finalize signup to enter the vendor dashboard while admin approval is pending.
                  </div>
                ) : null}
              </div>
            )}

            {!isLogin ? (
              <div className="mt-6 flex gap-3">
                {step > 1 ? (
                  <button onClick={back} className="flex-1 rounded-2xl border border-slate-200 py-3 font-bold text-slate-700">
                    Back
                  </button>
                ) : null}
                <button
                  onClick={handleContinue}
                  disabled={isSubmitting}
                  className={`flex-[2] ${vendorPrimaryButtonClassName}`}
                >
                  {isSubmitting ? "Please wait..." : step === 2 ? "Verify OTP" : step === 5 ? "Finish Signup" : "Continue"}
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
