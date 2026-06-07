import React, { useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";

import { Rider } from "../../assets/images/vendorrider.js";
import faqs from "../../assets/data/RiderFAQs.json";


const ForgotPasswordForm = lazy(() =>
  import("../../components/common/ForgotPasswordForm.jsx")
);

const OtpInput = lazy(() =>
  import("../../components/common/OtpInput.jsx")
);
import { login, sendOtp, signup, verifyOtp } from "../../services/authService.js";

const emptyOtp = ["", "", "", "", "", ""];
const riderFieldClassName =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-950 outline-none transition focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100";
const riderPrimaryButtonClassName =
  "w-full rounded-2xl bg-purple-700 py-3.5 font-extrabold text-white shadow-lg shadow-purple-700/20 transition active:scale-[0.99] disabled:opacity-70";
const riderSecondaryButtonClassName =
  "w-full rounded-2xl border border-purple-200 bg-white py-3.5 font-extrabold text-purple-800 transition active:scale-[0.99] disabled:opacity-70";

const RiderSignup = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(emptyOtp);
  const [showFAQ, setShowFAQ] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    city: "",
    vehicleType: "",
    vehicleNumber: "",
    drivingLicense: "",
    address: "",
    shirtSize: "",
    email: "",
    password: "",
  });

  const updateForm = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const resetSignupState = () => {
    setStep(1);
    setOtp(emptyOtp);
    setMessage("");
    setIsForgotPassword(false);
  };

  const handleRequestOtp = async () => {
    setMessage("");
    setIsSubmitting(true);

    try {
      await signup({
        name: form.name,
        email: form.email,
        phone,
        password: form.password,
        role: "RIDER",
        onboardingData: {
          city: form.city,
          vehicleType: form.vehicleType,
          vehicleNumber: form.vehicleNumber,
          drivingLicense: form.drivingLicense,
          address: form.address,
          shirtSize: form.shirtSize,
          phone,
        },
      });
      setMessage("OTP sent to your email.");
      setStep(4);
    } catch (error) {
      setMessage(error.message || "Failed to send OTP");
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
        role: "RIDER",
      });
      setOtp(emptyOtp);
      setMessage("OTP resent to your email.");
    } catch (error) {
      setMessage(error.message || "Failed to resend OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    setMessage("");
    setIsSubmitting(true);

    try {
      await verifyOtp({
        email: form.email,
        otp: otp.join(""),
        role: "RIDER",
      });
      setMessage("Rider details submitted. Your account is pending admin approval.");
      navigate("/rider-dashboard");
    } catch (error) {
      setMessage(error.message || "Invalid OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async () => {
    setMessage("");
    setIsSubmitting(true);

    try {
      await login({
        email: form.email,
        password: form.password,
      });
      setMessage("Login successful!");
      navigate("/rider-dashboard");
    } catch (error) {
      setMessage(error.message || "Rider login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormContent = () => {
    if (isLogin) {
      return (
        <div className="space-y-4">
          {isForgotPassword ? (
            <Suspense fallback={<div>Loading...</div>}>
              <ForgotPasswordForm
                role="RIDER"
                onBack={() => {
                  setIsForgotPassword(false);
                  setMessage("");
              }}
              buttonClassName="w-full rounded-xl bg-purple-700 py-3 font-bold text-white disabled:opacity-70"
            />
           </Suspense> 
          ) : (
            <>
          <input
            placeholder="Email"
            type="email"
            className={riderFieldClassName}
            value={form.email}
            onChange={(event) => updateForm("email", event.target.value)}
          />
          <input
            placeholder="Password"
            type="password"
            className={riderFieldClassName}
            value={form.password}
            onChange={(event) => updateForm("password", event.target.value)}
          />
          <button
            onClick={handleLogin}
            disabled={isSubmitting}
            className={riderPrimaryButtonClassName}
          >
            {isSubmitting ? "Please wait..." : "Login"}
          </button>
          <button
            type="button"
            onClick={() => setIsForgotPassword(true)}
            className="w-full text-center text-sm text-indigo-700"
          >
            Forgot password?
          </button>
          </>
          )}
        </div>
      );
    }

    return (
      <>
        {step === 1 ? (
          <div className="space-y-4">
            <input
              placeholder="Enter Name"
              className={riderFieldClassName}
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
            />

            <select
              className={riderFieldClassName}
              value={form.city}
              onChange={(event) => updateForm("city", event.target.value)}
            >
              <option value="">Select City</option>
              <option value="Delhi">Delhi</option>
              <option value="Noida">Noida</option>
              <option value="Ghaziabad">Ghaziabad</option>
            </select>

            <input
              placeholder="Mobile Number"
              className={riderFieldClassName}
              value={phone}
              onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
            />

            <input
              placeholder="Email"
              type="email"
              className={riderFieldClassName}
              value={form.email}
              onChange={(event) => updateForm("email", event.target.value)}
            />

            <input
              placeholder="Password"
              type="password"
              className={riderFieldClassName}
              value={form.password}
              onChange={(event) => updateForm("password", event.target.value)}
            />
            <p className="-mt-2 text-xs text-slate-400">At least 8 characters</p>

            <button onClick={() => setStep(2)} className={riderPrimaryButtonClassName}>
              Continue
            </button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <select
              className={riderFieldClassName}
              value={form.vehicleType}
              onChange={(event) => updateForm("vehicleType", event.target.value)}
            >
              <option value="">Select Vehicle Type</option>
              <option value="cycle">Cycle</option>
              <option value="bike">Bike</option>
            </select>

            {form.vehicleType === "bike" ? (
              <>
                <input
                  placeholder="Vehicle Number"
                  className={riderFieldClassName}
                  value={form.vehicleNumber}
                  onChange={(event) => updateForm("vehicleNumber", event.target.value)}
                />
                <input
                  placeholder="Driving License"
                  className={riderFieldClassName}
                  value={form.drivingLicense}
                  onChange={(event) => updateForm("drivingLicense", event.target.value)}
                />
              </>
            ) : null}

            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="w-1/2 rounded-2xl bg-slate-200 py-3 font-bold text-slate-800">
                Back
              </button>
              <button onClick={() => setStep(3)} className="w-1/2 rounded-2xl bg-purple-700 py-3 font-bold text-white">
                Next
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <textarea
              placeholder="Address"
              className={`${riderFieldClassName} min-h-24 resize-none`}
              value={form.address}
              onChange={(event) => updateForm("address", event.target.value)}
            />

            <select
              className={riderFieldClassName}
              value={form.shirtSize}
              onChange={(event) => updateForm("shirtSize", event.target.value)}
            >
              <option value="">Select Shirt Size</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
            </select>

            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="w-1/2 rounded-2xl bg-slate-200 py-3 font-bold text-slate-800">
                Back
              </button>
              <button onClick={handleRequestOtp} disabled={isSubmitting} className="w-1/2 rounded-2xl bg-purple-700 py-3 font-bold text-white disabled:opacity-70">
                {isSubmitting ? "Please wait..." : "Send OTP"}
              </button>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <h3 className="font-extrabold text-emerald-900">Verify and submit</h3>
              <p className="mt-1 text-sm font-medium text-emerald-700">Admin approval starts after this OTP step.</p>
            </div>
            <Suspense fallback={<div>Loading OTP...</div>}>
              <OtpInput otp={otp} setOtp={setOtp} />
            </Suspense>
            <div className="flex gap-2">
              <button onClick={handleVerifyOtp} disabled={isSubmitting} className={riderPrimaryButtonClassName}>
                {isSubmitting ? "Please wait..." : "Verify & Submit"}
              </button>
              <button onClick={handleResendOtp} disabled={isSubmitting} className={riderSecondaryButtonClassName}>
                Resend
              </button>
            </div>
            <button
              onClick={() => setStep(3)}
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-slate-200 py-3 font-bold text-slate-800"
            >
              Back
            </button>
          </div>
        ) : null}
      </>
    );
  };

  return (
    <div className="bg-[#F4F7FB] pb-8 font-sans md:bg-white md:pb-0">
      <div className="relative h-[360px] w-full overflow-hidden md:h-screen">
        <img src={Rider}  className="h-full w-full object-cover" alt="Rider" />

        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/35 to-transparent px-5 pb-24 md:items-center md:bg-gradient-to-r md:from-black/60 md:to-transparent md:px-6 md:pb-0 lg:px-20">
          <div className="max-w-2xl">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white md:hidden">
              Rider Partner
            </span>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight text-white lg:text-6xl">
              Join India&apos;s <span className="text-orange-500">Largest</span> platform!
            </h1>
            <p className="mt-3 text-base font-semibold text-white/90 md:text-xl">Earn up to 30,000/month with Cravzo</p>
          </div>
        </div>

        <div className="absolute top-10 right-6 hidden md:block lg:right-20">
          <div className="w-[380px] rounded-2xl bg-white p-8 shadow-2xl">
            <h2 className="mb-6 text-center text-xl font-bold">
              {isForgotPassword ? "Reset Rider Password" : isLogin ? "Rider Login" : "Register as Cravzo Partner"}
            </h2>
            <div className="mb-4 text-center">
              <button
                onClick={() => {
                  setIsLogin((current) => !current);
                  resetSignupState();
                }}
                className="text-sm text-indigo-700"
              >
                {isLogin ? "Need a new rider account? Sign up" : "Already registered? Login"}
              </button>
            </div>
            {!isForgotPassword && message ? <p className="mb-4 text-sm text-indigo-700">{message}</p> : null}
            {renderFormContent()}
          </div>
        </div>
      </div>

      <div className="relative z-30 -mt-20 px-4 md:hidden">
        <div className="mx-auto max-w-md rounded-[28px] border border-white/80 bg-white p-5 shadow-2xl shadow-slate-900/15">
          <h2 className="mb-2 text-center text-2xl font-extrabold text-slate-950">
            {isForgotPassword ? "Reset Rider Password" : isLogin ? "Rider Login" : "Register as Cravzo Partner"}
          </h2>
          <p className="mb-4 text-center text-sm font-medium leading-6 text-slate-500">
            {isLogin ? "Access deliveries, earnings, and profile." : "Create your rider profile and verify with OTP."}
          </p>
          <div className="mb-4 text-center">
            <button
              onClick={() => {
                setIsLogin((current) => !current);
                resetSignupState();
              }}
              className="rounded-full bg-purple-50 px-4 py-2 text-sm font-bold text-purple-800"
            >
              {isLogin ? "Need a new rider account? Sign up" : "Already registered? Login"}
            </button>
          </div>
          {!isForgotPassword && message ? <p className="mb-4 rounded-2xl bg-purple-50 px-4 py-3 text-sm font-semibold text-purple-800">{message}</p> : null}
          {renderFormContent()}
        </div>
      </div>

      {!isLogin ? (
        <div className="fixed right-5 bottom-5 z-50 md:bottom-5">
          <button
            onClick={() => setShowFAQ(true)}
            className="rounded-full bg-indigo-700 px-5 py-3 font-bold text-white shadow-lg hover:bg-indigo-800"
          >
            FAQs
          </button>
        </div>
      ) : null}

      {showFAQ ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowFAQ(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="mb-3 text-lg font-bold">Rider FAQs</h2>

            {faqs.map((faq, index) => (
              <div key={faq.question} className="mb-2">
                <div
                  className="rounded bg-gray-100 p-2 font-semibold"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                >
                  {faq.question}
                </div>

                {openIndex === index ? <div className="p-2 text-gray-600">{faq.answer}</div> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default RiderSignup;
