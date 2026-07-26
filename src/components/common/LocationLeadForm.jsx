import React, { useState } from "react";
import { BellRing, MapPin, Send } from "lucide-react";

import { submitLocationLead } from "../../services/locationLeadService.js";

const LocationLeadForm = ({ latitude, longitude, source = "web_customer", compact = false }) => {
  const [form, setForm] = useState({ name: "", phone: "", email: "", location: "" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!form.name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!form.phone.trim() && !form.email.trim()) {
      setError("Please enter phone or email so we can notify you.");
      return;
    }

    setSubmitting(true);
    try {
      await submitLocationLead({
        ...form,
        latitude,
        longitude,
        source,
        notes: "Customer asked to be notified when Dodago launches in this location.",
      });
      setForm({ name: "", phone: "", email: "", location: "" });
      setMessage("Thanks! We will notify you when Dodago comes to your location.");
    } catch (requestError) {
      setError(requestError.message || "Could not save your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`rounded-3xl border border-indigo-100 bg-white shadow-sm ${compact ? "p-5" : "p-6"}`}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
        <BellRing className="h-6 w-6" />
      </div>
      <div className="mt-4 text-center">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff6b5f]">Coming soon</p>
        <h3 className="mt-1 text-2xl font-black text-slate-950">Coming soon to your location</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          We are not serving restaurants within 8 km here yet. Share your details and we will inform you as soon as Dodago starts nearby.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-3 text-left sm:grid-cols-2">
        <input
          value={form.name}
          onChange={(event) => handleChange("name", event.target.value)}
          placeholder="Your name"
          className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        <input
          value={form.phone}
          onChange={(event) => handleChange("phone", event.target.value)}
          placeholder="Phone number"
          inputMode="tel"
          className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        <input
          value={form.email}
          onChange={(event) => handleChange("email", event.target.value)}
          placeholder="Email optional"
          type="email"
          className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={form.location}
            onChange={(event) => handleChange("location", event.target.value)}
            placeholder="Area / city"
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-semibold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 text-sm font-black text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
        >
          <Send className="h-4 w-4" />
          {submitting ? "Saving..." : "Notify me"}
        </button>
      </form>

      {message ? <p className="mt-3 text-center text-sm font-bold text-emerald-600">{message}</p> : null}
      {error ? <p className="mt-3 text-center text-sm font-bold text-rose-600">{error}</p> : null}
    </div>
  );
};

export default LocationLeadForm;
