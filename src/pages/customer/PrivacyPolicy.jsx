import React from "react";
import { ArrowLeft, Cookie, Database, Eye, Gift, Lock, Mail, Shield, Trash2, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: Shield,
      title: "Information We Collect",
      content: "We collect account details, phone number, email address, delivery addresses, order details, payment status, support messages, notification tokens, approximate location when permitted, and profile information you choose to provide.",
    },
    {
      icon: Eye,
      title: "How We Use Information",
      content: "We use data to create accounts, verify OTPs, process orders, deliver food, show order history, provide customer support, send service notifications, prevent abuse, comply with legal duties, and improve CRAVZO.",
    },
    {
      icon: Lock,
      title: "Anti-Fraud & Device Information",
      content: "For referral and payment abuse prevention, we may collect a device fingerprint hash, hashed IP address, user-agent, signup time, referral code, and referral voucher activity. Raw IP addresses are not stored for this purpose. These signals are used to detect same-device self-referrals, mass fake accounts, voucher misuse, and suspicious signup patterns.",
    },
    {
      icon: Gift,
      title: "Referral Terms",
      content: "Referral rewards unlock only when the invited user verifies the account and completes a first paid order. Self-referrals, same-device abuse, fake accounts, duplicate accounts, cancelled orders, refunded orders, or suspicious activity may be rejected or held for review. Referral vouchers are non-transferable, cannot be exchanged for cash, and expire as shown in the app.",
    },
    {
      icon: Database,
      title: "Retention",
      content: "We keep personal data only as long as needed for account services, orders, tax/accounting records, dispute handling, fraud prevention, and legal compliance. Device fingerprint and IP hashes used for anti-fraud checks are intended to be retained for a limited period after last activity, normally up to 90 days where operationally feasible, unless needed for security, dispute, or legal reasons.",
    },
    {
      icon: Users,
      title: "Sharing",
      content: "We share only what is needed with restaurants, delivery partners, payment processors, cloud/hosting providers, analytics or notification providers, support tools, and legal authorities when required. We do not sell your personal data.",
    },
    {
      icon: Cookie,
      title: "Cookies & Similar Technologies",
      content: "We use cookies, local storage, session storage, and similar technologies for login, cart, OTP flow, referral code capture, app preferences, security, and performance. You can control cookies in your browser, but disabling essential storage may break account or checkout features.",
    },
    {
      icon: Trash2,
      title: "Your Rights & Account Deletion",
      content: "You can request access, correction, update, consent withdrawal, grievance redressal, and deletion of your account data. Customers can use Profile > Delete Account, or contact us. Some records may be retained where required for tax, fraud prevention, disputes, or legal compliance.",
    },
    {
      icon: Mail,
      title: "Grievance Contact",
      content: "For privacy requests, account deletion help, or grievances, email yushpandey3@gmail.com or call Raushan Pandey at +91 9984185916 or Yash Chauhan at +91 8527879902. We aim to respond within 30 days. This policy is intended to align with India's Digital Personal Data Protection Act, 2023 and related rules as applicable.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-10">
      <div className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Privacy Policy</h1>
            <p className="text-xs text-slate-500">Last updated: July 9, 2026</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6 rounded-[28px] bg-indigo-950 p-6 text-white shadow-xl shadow-indigo-950/10">
          <h2 className="text-2xl font-black">Your Privacy Matters</h2>
          <p className="mt-2 text-sm leading-6 text-indigo-100">
            CRAVZO processes personal data for food ordering, delivery, account security, referral fraud prevention, and legal compliance.
          </p>
        </div>

        <div className="space-y-4">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.title} className="rounded-[24px] bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">{section.title}</h3>
                </div>
                <p className="text-sm leading-7 text-slate-600">{section.content}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-[24px] bg-slate-100 p-6 text-center">
          <p className="text-sm font-semibold text-slate-600">Want to delete your account or raise a privacy request?</p>
          <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/account/profile" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-950 px-6 py-3 font-black text-white">
              <Trash2 className="h-4 w-4" /> Account Settings
            </Link>
            <Link to="/contact" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 font-black text-indigo-950">
              <Mail className="h-4 w-4" /> Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
