import { Resend } from "resend";

import { env } from "../config/env.js";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export const sendOTP = async (email, otp) => {
  if (env.EMAIL_PROVIDER !== "resend") {
    console.log(`[OTP:${email}] ${otp}`);
    return { provider: "console" };
  }

  if (!resend) {
    throw new Error("RESEND_API_KEY is missing while EMAIL_PROVIDER=resend");
  }

  const response = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: email,
    subject: "Your Dodago OTP",
    html: `
  <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 500px; margin: auto; background: #ffffff; padding: 20px; border-radius: 10px; text-align: center;">
      
      <h2 style="color: #2a2dd0;">Dodago Verification</h2>
      
      <p style="font-size: 16px; color: #333;">
        Use the following OTP to verify your account:
      </p>

      <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 20px 0; color: #000;">
        ${otp}
      </div>

      <p style="font-size: 14px; color: #777;">
        This OTP is valid for <strong>5 minutes</strong>.
      </p>

      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />

      <p style="font-size: 12px; color: #999;">
        If you didn’t request this, you can safely ignore this email.
      </p>

      <p style="font-size: 12px; color: #999;">
        © ${new Date().getFullYear()} Dodago
      </p>

    </div>
  </div>
`,
  });

  if (response?.error) {
    throw new Error(response.error.message || "Failed to send OTP");
  }

  return response;
};
