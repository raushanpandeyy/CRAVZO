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
          className="w-12 h-12 rounded-full border-2 border-indigo-500 text-center text-lg font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
          onChange={(e) => handleOtpChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          ref={(el) => (otpRefs.current[index] = el)}
        />
      ))}
    </div>
  );
}
