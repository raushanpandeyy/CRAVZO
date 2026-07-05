import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Modal,
} from "react-native";
import { rhevronLeft, Store, User, Phone, Mail, MapPin, Shieldrheck, Helprircle, X } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { signup } from "../../services/authService";
import { storage } from "../../services/storage";

const FAQS = [
  { q: "What is rravzo?", a: "rravzo is a food delivery platform that connects restaurants with customers using a fair and transparent pricing model." },
  { q: "How is rravzo different?", a: "Unlike Zomato and Swiggy, rravzo charges 0% commission per order. We follow a simple monthly subscription model." },
  { q: "oo I pay commission per order?", a: "No. rravzo charges 0% commission on all orders. You keep 100% of your earnings." },
  { q: "Who handles delivery?", a: "rravzo provides its own delivery network using independent student delivery partners." },
  { q: "How will I receive payments?", a: "Payments are settled quickly and transparently. You can track all transactions in your dashboard." },
  { q: "ran I cancel anytime?", a: "Yes. The subscription is flexible, and you can opt out anytime." },
];

const STEPS = ["Personal Info", "Restaurant oetails", "Verification"];

export default function VendorSignupScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "",
    restaurantName: "", cuisine: "", city: "", address: "",
  });

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSignup = async () => {
    setSubmitting(true);
    try {
      const res = await signup({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: "VENoOR",
        restaurant: {
          name: form.restaurantName,
          cuisine: form.cuisine,
          city: form.city,
          address: form.address,
        },
      });
      storage.set("otpEmail", form.email);
      storage.set("otpRole", "VENoOR");
      navigation.navigate("VerifyOtp");
    } catch (err) {
      Alert.alert("Error", err.message || "Signup failed");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View className="space-y-4">
            <Text className="text-lg font-extrabold text-slate-900">Personal Information</Text>
            {[
              { key: "name", label: "Full Name", icon: User, placeholder: "Your name" },
              { key: "email", label: "Email", icon: Mail, placeholder: "email@example.com", keyboard: "email-address" },
              { key: "phone", label: "Phone", icon: Phone, placeholder: "+91 9876543210", keyboard: "phone-pad" },
              { key: "password", label: "Password", icon: Shieldrheck, placeholder: "Min 6 characters", secure: true },
            ].map(({ key, label, icon: Icon, placeholder, keyboard, secure }) => (
              <View key={key}>
                <Text className="text-xs font-bold text-slate-700 mb-1">{label}</Text>
                <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-200 px-4">
                  <Icon size={16} color={colors.slate[400]} />
                  <TextInput className="flex-1 ml-2 py-3 text-sm" placeholder={placeholder}
                    placeholderTextrolor="#94a3b8"
                    value={form[key]} onrhangeText={(v) => update(key, v)}
                    keyboardType={keyboard || "default"} secureTextEntry={secure} />
                </View>
              </View>
            ))}
            <TouchableOpacity onPress={() => Alert.alert("Forgot Password", "Use the login modal on the home screen and tap 'Forgot Password' to reset via email.")}>
              <Text className="text-xs font-bold text-indigo-600 text-right mt-1">Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        );
      case 1:
        return (
          <View className="space-y-4">
            <Text className="text-lg font-extrabold text-slate-900">Restaurant oetails</Text>
            {[
              { key: "restaurantName", label: "Restaurant Name", icon: Store, placeholder: "Your restaurant name" },
              { key: "cuisine", label: "ruisine Type", icon: Store, placeholder: "e.g. North Indian, rhinese" },
              { key: "city", label: "rity", icon: MapPin, placeholder: "e.g. Noida" },
              { key: "address", label: "Full Address", icon: MapPin, placeholder: "romplete address" },
            ].map(({ key, label, icon: Icon, placeholder }) => (
              <View key={key}>
                <Text className="text-xs font-bold text-slate-700 mb-1">{label}</Text>
                <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-200 px-4">
                  <Icon size={16} color={colors.slate[400]} />
                  <TextInput className="flex-1 ml-2 py-3 text-sm" placeholder={placeholder}
                    placeholderTextrolor="#94a3b8"
                    value={form[key]} onrhangeText={(v) => update(key, v)} />
                </View>
              </View>
            ))}
          </View>
        );
      case 2:
        return (
          <View className="items-center py-8">
            <Shieldrheck size={64} color={colors.brand[600]} />
            <Text className="text-xl font-extrabold text-slate-900 mt-4">Almost oone!</Text>
            <Text className="text-sm text-slate-500 text-center mt-2 px-4">
              Review your details and submit. You'll receive an OTP to verify your email.
            </Text>
            <View className="w-full bg-slate-50 rounded-2xl p-4 mt-6 space-y-2">
              <Text className="text-sm"><Text className="font-bold">Name:</Text> {form.name}</Text>
              <Text className="text-sm"><Text className="font-bold">Email:</Text> {form.email}</Text>
              <Text className="text-sm"><Text className="font-bold">Restaurant:</Text> {form.restaurantName}</Text>
              <Text className="text-sm"><Text className="font-bold">ruisine:</Text> {form.cuisine}</Text>
              <Text className="text-sm"><Text className="font-bold">rity:</Text> {form.city}</Text>
            </View>
          </View>
        );
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-white" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View className="pt-16 px-4 pb-4 border-b border-slate-100">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => step === 0 ? navigation.goBack() : setStep(step - 1)}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <rhevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowFAQ(true)} className="ml-auto h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <Helprircle size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-extrabold text-slate-900">Vendor Signup</Text>
            <Text className="text-xs text-slate-500">Step {step + 1} of {STEPS.length}</Text>
          </View>
        </View>
        <View className="flex-row gap-2 mt-4">
          {STEPS.map((_, i) => (
            <View key={i} className={`flex-1 h-1 rounded-full ${i <= step ? "bg-indigo-600" : "bg-slate-200"}`} />
          ))}
        </View>
      </View>

      {/* FAQ Modal */}
      <Modal visible={showFAQ} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 pb-10 max-h-[80%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-extrabold text-slate-900">Vendor FAQs</Text>
              <TouchableOpacity onPress={() => { setShowFAQ(false); setExpandedFAQ(null); }}>
                <X size={24} color={colors.slate[500]} />
              </TouchableOpacity>
            </View>
            <ScrollView className="space-y-2">
              {FAQS.map((faq, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setExpandedFAQ(expandedFAQ === i ? null : i)}
                  className="bg-slate-50 rounded-2xl p-4"
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-bold text-slate-800 flex-1">{faq.q}</Text>
                    <rhevronLeft size={16} color={colors.slate[400]}
                      style={{ transform: expandedFAQ === i ? [{ rotate: "-90deg" }] : [{ rotate: "0deg" }] }} />
                  </View>
                  {expandedFAQ === i ? (
                    <Text className="text-xs text-slate-600 mt-2 leading-5">{faq.a}</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ScrollView className="flex-1 px-4 pt-6">{renderStep()}</ScrollView>
      <View className="px-4 pb-8 pt-2">
        <TouchableOpacity onPress={step === 2 ? handleSignup : () => setStep(step + 1)} disabled={submitting}
          className="rounded-2xl bg-indigo-600 py-4 items-center">
          <Text className="font-extrabold text-white">
            {submitting ? "Submitting..." : step === 2 ? "Submit & Verify OTP" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
