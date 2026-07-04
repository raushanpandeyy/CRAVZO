import React, { useState } from "react";
import { ArrowLeft, Mail, Phone, Clock, Send, CheckCircle, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api.js";

const ContactUs = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await apiRequest("/api/contact", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setSuccess(true);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      setError("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openEmail = () => {
    window.location.href = "mailto:yushpandey3@gmail.com?subject=Dodago%20Support%20Request&body=Hello%2C%0A%0AI%20need%20help%20with%3A%0A%0A";
  };

  const openPhone = () => {
    window.location.href = "tel:+919984185916";
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-10">
      <div className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Contact Us</h1>
            <p className="text-xs text-slate-500">We're here to help</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 text-white">
              <h2 className="text-xl font-bold mb-2">Get in Touch</h2>
              <p className="text-white/80 text-sm">We typically respond within 24 hours</p>
            </div>

            <button
              onClick={openEmail}
              className="w-full flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Mail className="h-6 w-6" />
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-slate-900">Email Us</p>
                <p className="text-sm text-indigo-600 font-semibold">yushpandey3@gmail.com</p>
                <p className="text-xs text-slate-500 mt-1">Tap to open email client</p>
              </div>
            </button>

            <button
              onClick={openPhone}
              className="w-full flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Phone className="h-6 w-6" />
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-slate-900">Call Us</p>
                <p className="text-sm text-indigo-600 font-semibold">+91 9984185916</p>
                <p className="text-xs text-slate-500 mt-1">Tap to call directly</p>
              </div>
            </button>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4 mb-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-600">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Support Hours</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-slate-600 ml-[4.5rem]">
                <p>Monday - Friday: 9:00 AM - 9:00 PM</p>
                <p>Saturday - Sunday: 10:00 AM - 6:00 PM</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4 mb-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-600">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Quick Help</p>
                </div>
              </div>
              <div className="space-y-2 ml-[4.5rem]">
                <p className="text-sm text-slate-600">For instant support, use the chat option in the app.</p>
                <a href="/account/chat" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline">
                  Open Support Chat
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Send us a Message</h3>
            
            {success && (
              <div className="mb-4 rounded-2xl bg-emerald-50 p-4 flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
                <div>
                  <p className="font-bold text-emerald-700">Message Sent!</p>
                  <p className="text-sm text-emerald-600">We'll get back to you soon.</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Your Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Enter your name"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#ff6b5f] focus:outline-none focus:ring-2 focus:ring-[#ff6b5f]/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Email</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#ff6b5f] focus:outline-none focus:ring-2 focus:ring-[#ff6b5f]/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Phone (optional)</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+91 XXXXXXXXXX"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#ff6b5f] focus:outline-none focus:ring-2 focus:ring-[#ff6b5f]/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Subject</label>
                <select
                  required
                  value={form.subject}
                  onChange={(e) => handleChange("subject", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#ff6b5f] focus:outline-none focus:ring-2 focus:ring-[#ff6b5f]/20"
                >
                  <option value="">Select a topic</option>
                  <option value="Order Issue">Order Issue</option>
                  <option value="Refund Request">Refund Request</option>
                  <option value="Restaurant Partner">Restaurant Partnership</option>
                  <option value="Delivery Partner">Delivery Partnership</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Feedback">Feedback</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Message</label>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  placeholder="Describe your issue or question..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#ff6b5f] focus:outline-none focus:ring-2 focus:ring-[#ff6b5f]/20 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 font-bold text-white transition hover:bg-[#ff5a47] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 rounded-3xl bg-[#fff5f3] p-6 text-center">
          <p className="text-sm text-slate-600">
            For urgent matters, call us directly at{" "}
            <button onClick={openPhone} className="font-bold text-indigo-600 hover:underline">
              +91 9984185916
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;