import React, { useRef } from "react";

export default function OtpInput({ otp, setOtp }) {
  const otpRefs = useRef([]);
  const fillOtp = (digits) => {
    const nextOtp = [...Array(6)].map((_, index) => digits[index] || "");
    setOtp(nextOtp);
    return nextOtp;
  };

  const handleOtpChange = (e, index) => {
    const value = e.target.value.replace(/\D/g, "");

    if (value.length > 1) {
      const otpArray = value.slice(0, 6).split("");
      fillOtp(otpArray);
      otpRefs.current[Math.min(otpArray.length - 1, 5)]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (otp[index] === "") {
        if (index > 0) otpRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "");
    const otpArray = pasteData.slice(0, 6).split("");
    fillOtp(otpArray);
    otpRefs.current[Math.min(otpArray.length - 1, 5)]?.focus();
  };

  return (
    <div className="flex justify-center gap-2">
      {otp.map((digit, index) => (
        <input
          key={index}
          value={digit}
          maxLength="1"
          type="tel"
          inputMode="numeric"
          autoComplete="one-time-code"
          className="h-11 w-11 rounded-2xl border-2 border-indigo-200 bg-slate-50 text-center text-lg font-bold text-indigo-950 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 sm:h-12 sm:w-12"
          onChange={(e) => handleOtpChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          ref={(el) => (otpRefs.current[index] = el)}
        />
      ))}
    </div>
  );
}
