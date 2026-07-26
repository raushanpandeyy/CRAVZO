import React, { useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import { BellRing, MapPin, Send } from "lucide-react-native";

import { colors } from "../constants/colors";
import { submitLocationLead } from "../services/locationLeadService";

export default function CoverageLeadForm({ latitude, longitude, source = "mobile_customer", user }) {
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    location: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async () => {
    setMessage("");
    setError("");
    if (!form.name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!form.phone.trim() && !form.email.trim()) {
      setError("Please enter phone or email.");
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
      setMessage("Thanks! We will notify you when Dodago reaches your location.");
    } catch (requestError) {
      setError(requestError.message || "Could not save your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm">
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 self-center">
        <BellRing size={24} color={colors.brand[600]} />
      </View>
      <Text className="mt-4 text-center text-[11px] font-black uppercase tracking-widest text-[#ff6b5f]">Coming soon</Text>
      <Text className="mt-1 text-center text-2xl font-black text-slate-950">Coming soon to your location</Text>
      <Text className="mt-2 text-center text-sm leading-6 text-slate-500">
        We are not serving restaurants within 8 km here yet. Share your details and we will notify you first.
      </Text>

      <View className="mt-5 gap-3">
        <TextInput value={form.name} onChangeText={(value) => updateField("name", value)} placeholder="Your name" placeholderTextColor="#94a3b8" className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-950" />
        <TextInput value={form.phone} onChangeText={(value) => updateField("phone", value)} placeholder="Phone number" keyboardType="phone-pad" placeholderTextColor="#94a3b8" className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-950" />
        <TextInput value={form.email} onChangeText={(value) => updateField("email", value)} placeholder="Email optional" keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#94a3b8" className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-950" />
        <View className="flex-row items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4">
          <MapPin size={16} color={colors.slate[500]} />
          <TextInput value={form.location} onChangeText={(value) => updateField("location", value)} placeholder="Area / city" placeholderTextColor="#94a3b8" className="h-12 flex-1 text-sm font-semibold text-slate-950" />
        </View>
        <TouchableOpacity onPress={handleSubmit} disabled={submitting} className="h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-indigo-600 disabled:opacity-60">
          {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Send size={16} color="#fff" />}
          <Text className="text-sm font-black text-white">{submitting ? "Saving..." : "Notify me"}</Text>
        </TouchableOpacity>
      </View>

      {message ? <Text className="mt-3 text-center text-sm font-bold text-emerald-600">{message}</Text> : null}
      {error ? <Text className="mt-3 text-center text-sm font-bold text-rose-600">{error}</Text> : null}
    </View>
  );
}
