import React, { useState } from "react";

import OtpInput from "./OtpInput.jsx";
import { requestPasswordReset, resetPassword } from "../../services/authService.js";

const emptyOtp = ["", "", "", "", "", ""];

const ForgotPasswordForm = ({ role = "CUSTOMER", onBack, buttonClassName = "w-full rounded bg-indigo-600 py-2 text-white disabled:opacity-70" }) => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(emptyOtp);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      await requestPasswordReset({ email, role });
      setOtpSent(true);
      setOtp(emptyOtp);
      setMessage("Password reset OTP sent to your email.");
    } catch (error) {
      setMessage(error.message || "Failed to send password reset OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword({
        email,
        otp: otp.join(""),
        password,
        role,
      });
      setMessage("Password reset successfully. Please login.");
      setOtpSent(false);
      setOtp(emptyOtp);
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setMessage(error.message || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={otpSent ? handleResetPassword : handleRequestOtp} className="space-y-4">
      {message ? <p className="text-center text-sm text-indigo-700">{message}</p> : null}

      <input
        type="email"
        placeholder="Email"
        className="w-full rounded border p-2"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={otpSent}
        required
      />

      {otpSent ? (
        <>
          <OtpInput otp={otp} setOtp={setOtp} />
          <input
            type="password"
            placeholder="New Password"
            className="w-full rounded border p-2"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            className="w-full rounded border p-2"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </>
      ) : null}

      <button type="submit" disabled={isSubmitting} className={buttonClassName}>
        {isSubmitting ? "Please wait..." : otpSent ? "Reset Password" : "Send Reset OTP"}
      </button>

      <button type="button" onClick={onBack} className="w-full rounded border border-slate-300 py-2 text-slate-700">
        Back to Login
      </button>
    </form>
  );
};

export default ForgotPasswordForm;
