import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import Rider from "../../assets/images/Rider.webp";
import faqs from "../../assets/data/RiderFAQs.json";
<<<<<<< HEAD
import ForgotPasswordForm from "../../components/common/ForgotPasswordForm.jsx";
=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
import OtpInput from "../../components/common/OtpInput.jsx";
import { login, sendOtp, signup, verifyOtp } from "../../services/authService.js";

const emptyOtp = ["", "", "", "", "", ""];

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
  const [isOtpVerified, setIsOtpVerified] = useState(false);
<<<<<<< HEAD
  const [isForgotPassword, setIsForgotPassword] = useState(false);
=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594

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
    setIsOtpVerified(false);
<<<<<<< HEAD
    setIsForgotPassword(false);
=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
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
        },
      });
      setMessage("OTP sent to your email.");
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
      setIsOtpVerified(true);
      setStep(2);
      setMessage("OTP verified. Complete the remaining rider onboarding details.");
    } catch (error) {
      setMessage(error.message || "Invalid OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayment = async () => {
    setMessage("");
    setIsSubmitting(true);

    try {
      if (!isOtpVerified) {
        throw new Error("Verify OTP before completing rider signup");
      }

      localStorage.setItem(
        "cravzoRiderOnboardingDraft",
        JSON.stringify({
          ...form,
          phone,
        })
      );

      setMessage("Rider authentication complete. Your account is pending admin approval.");
      navigate("/rider-dashboard");
    } catch (error) {
      setMessage(error.message || "Rider signup failed");
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
<<<<<<< HEAD
          {isForgotPassword ? (
            <ForgotPasswordForm
              role="RIDER"
              onBack={() => {
                setIsForgotPassword(false);
                setMessage("");
              }}
              buttonClassName="w-full rounded-xl bg-purple-700 py-3 font-bold text-white disabled:opacity-70"
            />
          ) : (
            <>
=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
          <input
            placeholder="Email"
            type="email"
            className="w-full rounded-xl border p-3"
            value={form.email}
            onChange={(event) => updateForm("email", event.target.value)}
          />
          <input
            placeholder="Password"
            type="password"
            className="w-full rounded-xl border p-3"
            value={form.password}
            onChange={(event) => updateForm("password", event.target.value)}
          />
          <button
            onClick={handleLogin}
            disabled={isSubmitting}
            className="w-full rounded-xl bg-purple-700 py-3 font-bold text-white disabled:opacity-70"
          >
            {isSubmitting ? "Please wait..." : "Login"}
          </button>
<<<<<<< HEAD
          <button
            type="button"
            onClick={() => setIsForgotPassword(true)}
            className="w-full text-center text-sm text-indigo-700"
          >
            Forgot password?
          </button>
          </>
          )}
=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
        </div>
      );
    }

    return (
      <>
        {step === 1 ? (
          <div className="space-y-4">
            <input
              placeholder="Enter Name"
              className="w-full rounded-xl border p-3"
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
            />

            <select
              className="w-full rounded-xl border p-3"
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
              className="w-full rounded-xl border p-3"
              value={phone}
              onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
            />

            <input
              placeholder="Email"
              type="email"
              className="w-full rounded-xl border p-3"
              value={form.email}
              onChange={(event) => updateForm("email", event.target.value)}
            />

            <input
              placeholder="Password"
              type="password"
              className="w-full rounded-xl border p-3"
              value={form.password}
              onChange={(event) => updateForm("password", event.target.value)}
            />

            <button
              onClick={handleRequestOtp}
              disabled={isSubmitting}
              className="w-full rounded-xl bg-gray-200 py-3 font-bold disabled:opacity-70"
            >
              {isSubmitting ? "Please wait..." : "Get OTP"}
            </button>

            <OtpInput otp={otp} setOtp={setOtp} />

            <div className="flex gap-2">
              <button
                onClick={handleVerifyOtp}
                disabled={isSubmitting}
                className="w-full rounded-xl bg-purple-700 py-3 font-bold text-white disabled:opacity-70"
              >
                Verify OTP
              </button>
              <button
                onClick={handleResendOtp}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-purple-200 py-3 font-bold text-purple-700 disabled:opacity-70"
              >
                Resend OTP
              </button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <select
              className="w-full rounded-xl border p-3"
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
                  className="w-full rounded-xl border p-3"
                  value={form.vehicleNumber}
                  onChange={(event) => updateForm("vehicleNumber", event.target.value)}
                />
                <input
                  placeholder="Driving License"
                  className="w-full rounded-xl border p-3"
                  value={form.drivingLicense}
                  onChange={(event) => updateForm("drivingLicense", event.target.value)}
                />
              </>
            ) : null}

            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="w-1/2 rounded-xl bg-gray-300 py-3">
                Back
              </button>
              <button onClick={() => setStep(3)} className="w-1/2 rounded-xl bg-purple-700 py-3 text-white">
                Next
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <textarea
              placeholder="Address"
              className="w-full rounded-xl border p-3"
              value={form.address}
              onChange={(event) => updateForm("address", event.target.value)}
            />

            <select
              className="w-full rounded-xl border p-3"
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
              <button onClick={() => setStep(2)} className="w-1/2 rounded-xl bg-gray-300 py-3">
                Back
              </button>
              <button onClick={() => setStep(4)} className="w-1/2 rounded-xl bg-purple-700 py-3 text-white">
                Next
              </button>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4 text-center">
            <h3 className="font-bold">Pay 1000</h3>
            <button
              onClick={handlePayment}
              disabled={isSubmitting}
              className="w-full rounded-xl bg-green-600 py-3 text-white disabled:opacity-70"
            >
              {isSubmitting ? "Please wait..." : "Pay"}
            </button>
          </div>
        ) : null}
      </>
    );
  };

  return (
    <div className="bg-white font-sans">
      <div className="relative h-screen w-full overflow-hidden">
        <img src={Rider} className="h-full w-full object-cover" alt="Rider" />

        <div className="absolute inset-0 flex items-center bg-gradient-to-r from-black/60 to-transparent px-6 lg:px-20">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-extrabold text-white lg:text-6xl">
              Join India&apos;s <span className="text-orange-500">Largest</span> platform!
            </h1>
            <p className="mt-4 text-xl text-white">Earn up to 30,000/month with Cravzo</p>
          </div>
        </div>

        <div className="absolute top-10 right-6 hidden md:block lg:right-20">
          <div className="w-[380px] rounded-2xl bg-white p-8 shadow-2xl">
            <h2 className="mb-6 text-center text-xl font-bold">
<<<<<<< HEAD
              {isForgotPassword ? "Reset Rider Password" : isLogin ? "Rider Login" : "Register as Cravzo Partner"}
=======
              {isLogin ? "Rider Login" : "Register as Cravzo Partner"}
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
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
<<<<<<< HEAD
            {!isForgotPassword && message ? <p className="mb-4 text-sm text-indigo-700">{message}</p> : null}
=======
            {message ? <p className="mb-4 text-sm text-indigo-700">{message}</p> : null}
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
            {renderFormContent()}
          </div>
        </div>
      </div>

      <div className="relative z-30 -mt-10 px-4 md:hidden">
        <div className="rounded-2xl border bg-white p-6 shadow-xl">
          <h2 className="mb-4 text-center text-xl font-bold">
<<<<<<< HEAD
            {isForgotPassword ? "Reset Rider Password" : isLogin ? "Rider Login" : "Register as Cravzo Partner"}
=======
            {isLogin ? "Rider Login" : "Register as Cravzo Partner"}
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
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
<<<<<<< HEAD
          {!isForgotPassword && message ? <p className="mb-4 text-sm text-indigo-700">{message}</p> : null}
=======
          {message ? <p className="mb-4 text-sm text-indigo-700">{message}</p> : null}
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
          {renderFormContent()}
        </div>
      </div>

      {!isLogin ? (
        <div className="fixed right-5 bottom-5 z-50">
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
