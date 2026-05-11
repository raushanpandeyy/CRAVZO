import React, { useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";



const OtpInput = lazy(() =>
  import("./OtpInput.jsx")
);
import { verifyOtp } from "../../services/authService.js";

export default function VerifyOtp() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async () => {
    const email = localStorage.getItem("otpEmail");
    const role = localStorage.getItem("otpRole") || "CUSTOMER";

    if (!email) {
      setMessage("Email not found for OTP verification.");
      return;
    }

    setMessage("");
    setIsSubmitting(true);

    try {
      const user = await verifyOtp({
        email,
        otp: otp.join(""),
        role,
      });

      navigate(user.accountType === "vendor" ? "/vendor-dashboard" : user.accountType === "rider" ? "/rider-dashboard" : "/");
    } catch (error) {
      setMessage(error.message || "Invalid OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-20 flex flex-col items-center gap-6">
      <h2 className="text-2xl font-bold">Enter OTP</h2>
      {message ? <p className="text-sm text-red-600">{message}</p> : null}
      <Suspense fallback={<div>Loading OTP input...</div>}>
        <OtpInput otp={otp} setOtp={setOtp} />
      </Suspense>
      <button
        onClick={handleVerify}
        disabled={isSubmitting}
        className="rounded-lg bg-indigo-500 px-6 py-2 text-white disabled:opacity-70"
      >
        {isSubmitting ? "Verifying..." : "Verify OTP"}
      </button>
    </div>
  );
}
