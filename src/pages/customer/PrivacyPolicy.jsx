import React from "react";
import { ArrowLeft, Shield, Lock, Eye, Database, Users, Mail, Cookie } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: Shield,
      title: "Information We Collect",
      content: `We collect information you provide directly to us, including:
• Name, email address, phone number
• Delivery addresses
• Payment information (processed securely via Razorpay)
• Order history and preferences
• Device location (with your permission for delivery)
• Cookies and usage data for app improvement`,
    },
    {
      icon: Eye,
      title: "How We Use Your Information",
      content: `We use the information we collect to:
• Process and deliver your food orders
• Send order updates and notifications
• Improve our services and user experience
• Communicate about promotions and offers (with consent)
• Prevent fraud and ensure security
• Comply with legal obligations`,
    },
    {
      icon: Lock,
      title: "Data Security",
      content: `We implement appropriate technical and organizational measures to protect your personal data, including:
• Encryption of sensitive data in transit and at rest
• Secure payment processing via Razorpay
• Regular security audits and assessments
• Limited access to personal information on need-to-know basis
• Staff training on data protection practices`,
    },
    {
      icon: Database,
      title: "Data Retention",
      content: `We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law. You can request deletion of your account and data at any time by contacting us.`,
    },
    {
      icon: Users,
      title: "Sharing Information",
      content: `We may share your information with:
• Restaurants (for order fulfillment)
• Delivery partners (for order delivery)
• Payment processors (for transactions)
• Service providers (for app functionality)
• Legal authorities (when required by law)
We never sell your personal information to third parties.`,
    },
    {
      icon: Eye,
      title: "Your Rights",
      content: `You have the right to:
• Access your personal information
• Correct inaccurate data
• Request deletion of your data
• Withdraw consent for marketing
• Opt out of non-essential cookies
• Lodge complaints with data protection authorities
Contact us at yushpandey3@gmail.com for any requests.`,
    },
    {
      icon: Cookie,
      title: "Cookies Policy",
      content: `Our app uses cookies and similar technologies to:
• Remember your preferences and settings
• Analyze app usage and performance
• Provide personalized content and recommendations
• Enable secure authentication
You can manage cookie preferences in your browser settings or through our app settings.`,
    },
    {
      icon: Mail,
      title: "Contact Us",
      content: `For privacy-related questions or to exercise your rights:
Email: yushpandey3@gmail.com
Phone: +91 9984185916
We respond to all privacy requests within 30 days.`,
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
            <p className="text-xs text-slate-500">Last updated: May 2026</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6 rounded-3xl bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 text-white">
          <h2 className="text-2xl font-bold">Your Privacy Matters</h2>
          <p className="mt-2 text-white/80">
            At Dodago, we are committed to protecting your personal information and being transparent about how we use it.
          </p>
        </div>

        <div className="space-y-4">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <div key={index} className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{section.title}</h3>
                </div>
                <p className="whitespace-pre-line text-sm text-slate-600 leading-relaxed">{section.content}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl bg-slate-100 p-6 text-center">
          <p className="text-sm text-slate-600">
            Have questions about our privacy practices?
          </p>
          <a href="/contact" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white hover:bg-[#ff5a47]">
            <Mail className="h-4 w-4" /> Contact Us
          </a>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;