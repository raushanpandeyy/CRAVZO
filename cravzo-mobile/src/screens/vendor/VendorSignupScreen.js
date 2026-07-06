import React, { useState, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Modal,
} from "react-native";
import { ChevronLeft, Store, User, Phone, Mail, MapPin, ShieldCheck, HelpCircle, X } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { signup, requestPasswordReset, resetPassword } from "../../services/authService";
import { storage } from "../../services/storage";

const FAQS = [
  { q: "What is DODAGO?", a: "DODAGO is a food delivery platform that connects restaurants with customers using a fair and transparent pricing model." },
  { q: "How is DODAGO different?", a: "Unlike Zomato and Swiggy, DODAGO charges 0% commission per order. We follow a simple monthly subscription model." },
  { q: "Do I pay commission per order?", a: "No. DODAGO charges 0% commission on all orders. You keep 100% of your earnings." },
  { q: "Who handles delivery?", a: "DODAGO provides its own delivery network using independent student delivery partners." },
  { q: "How will I receive payments?", a: "Payments are settled quickly and transparently. You can track all transactions in your dashboard." },
  { q: "Can I cancel anytime?", a: "Yes. The subscription is flexible, and you can opt out anytime." },
];

const STEPS = ["Personal Info", "Restaurant Details", "Verification"];

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function VendorSignupScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [fpEmail, setFpEmail] = useState("");
  const [fpOtp, setFpOtp] = useState(["", "", "", "", "", ""]);
  const [fpPassword, setFpPassword] = useState("");
  const [fpConfirmPassword, setFpConfirmPassword] = useState("");
  const [fpOtpSent, setFpOtpSent] = useState(false);
  const [fpMessage, setFpMessage] = useState("");
  const [fpSubmitting, setFpSubmitting] = useState(false);
  const fpOtpRefs = useRef([]);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "",
    restaurantName: "", cuisine: "", city: "", address: "",
  });

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSignup = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      Alert.alert("Missing details", "Complete all personal information before continuing.");
      return;
    }
    if (!PASSWORD_PATTERN.test(form.password)) {
      Alert.alert("Weak password", "Use 8+ characters with uppercase, lowercase, number and symbol.");
      return;
    }
    if (!form.restaurantName.trim() || !form.cuisine.trim() || !form.city.trim() || !form.address.trim()) {
      Alert.alert("Restaurant details required", "Complete the restaurant information before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await signup({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: "VENDOR",
        onboardingData: {
          restaurantName: form.restaurantName,
          cuisine: form.cuisine,
          city: form.city,
          address: form.address,
        },
      });
      storage.set("otpEmail", form.email);
      storage.set("otpRole", "VENDOR");
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
              { key: "password", label: "Password", icon: ShieldCheck, placeholder: "8+ chars, upper/lower/number/symbol", secure: true },
            ].map(({ key, label, icon: Icon, placeholder, keyboard, secure }) => (
              <View key={key}>
                <Text className="text-xs font-bold text-slate-700 mb-1">{label}</Text>
                <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-200 px-4">
                  <Icon size={16} color={colors.slate[400]} />
                  <TextInput className="flex-1 ml-2 py-3 text-sm" placeholder={placeholder}
                    placeholderTextColor="#94a3b8"
                      value={form[key]} onChangeText={(v) => update(key, v)}
                    keyboardType={keyboard || "default"} secureTextEntry={secure} />
                </View>
              </View>
            ))}
            <TouchableOpacity onPress={() => setShowForgotPassword(true)}>
              <Text className="text-xs font-bold text-indigo-600 text-right mt-1">Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        );
      case 1:
        return (
          <View className="space-y-4">
              <Text className="text-lg font-extrabold text-slate-900">Restaurant Details</Text>
            {[
              { key: "restaurantName", label: "Restaurant Name", icon: Store, placeholder: "Your restaurant name" },
              { key: "cuisine", label: "Cuisine Type", icon: Store, placeholder: "e.g. North Indian, Chinese" },
              { key: "city", label: "City", icon: MapPin, placeholder: "e.g. Noida" },
              { key: "address", label: "Full Address", icon: MapPin, placeholder: "Complete address" },
            ].map(({ key, label, icon: Icon, placeholder }) => (
              <View key={key}>
                <Text className="text-xs font-bold text-slate-700 mb-1">{label}</Text>
                <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-200 px-4">
                  <Icon size={16} color={colors.slate[400]} />
                  <TextInput className="flex-1 ml-2 py-3 text-sm" placeholder={placeholder}
                    placeholderTextColor="#94a3b8"
                    value={form[key]} onrhangeText={(v) => update(key, v)} />
                </View>
              </View>
            ))}
          </View>
        );
      case 2:
        return (
          <View className="items-center py-8">
            <ShieldCheck size={64} color={colors.brand[600]} />
            <Text className="text-xl font-extrabold text-slate-900 mt-4">Almost done!</Text>
            <Text className="text-sm text-slate-500 text-center mt-2 px-4">
              Review your details and submit. You'll receive an OTP to verify your email.
            </Text>
            <View className="w-full bg-slate-50 rounded-2xl p-4 mt-6 space-y-2">
              <Text className="text-sm"><Text className="font-bold">Name:</Text> {form.name}</Text>
              <Text className="text-sm"><Text className="font-bold">Email:</Text> {form.email}</Text>
              <Text className="text-sm"><Text className="font-bold">Restaurant:</Text> {form.restaurantName}</Text>
              <Text className="text-sm"><Text className="font-bold">Cuisine:</Text> {form.cuisine}</Text>
              <Text className="text-sm"><Text className="font-bold">City:</Text> {form.city}</Text>
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
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowFAQ(true)} className="ml-auto h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <HelpCircle size={20} color={colors.slate[900]} />
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

      {/* Forgot Password Modal */}
      <Modal visible={showForgotPassword} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 pb-10">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-extrabold text-slate-900">Reset Vendor Password</Text>
              <TouchableOpacity onPress={() => { setShowForgotPassword(false); setFpOtpSent(false); setFpOtp(["", "", "", "", "", ""]); setFpMessage(""); }}>
                <X size={24} color={colors.slate[500]} />
              </TouchableOpacity>
            </View>
            {fpMessage ? (
              <View className="bg-indigo-50 rounded-2xl px-4 py-3 mb-4">
                <Text className="text-sm text-indigo-700">{fpMessage}</Text>
              </View>
            ) : null}
            {!fpOtpSent ? (
              <View className="gap-4">
                <View>
                  <Text className="text-xs font-bold text-slate-700 mb-1">Email</Text>
                  <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-200 px-4">
                    <Mail size={16} color={colors.slate[400]} />
                    <TextInput className="flex-1 ml-2 py-3 text-sm" placeholder="email@example.com"
                      placeholderTextColor="#94a3b8"
                      value={fpEmail} onChangeText={setFpEmail}
                      keyboardType="email-address" autoCapitalize="none" />
                  </View>
                </View>
                <TouchableOpacity onPress={async () => {
                  if (!fpEmail) { setFpMessage("Please enter your email"); return; }
                  setFpSubmitting(true); setFpMessage("");
                  try {
                    await requestPasswordReset({ email: fpEmail, role: "VENDOR" });
                    setFpOtpSent(true);
                    setFpMessage("Password reset OTP sent to your email.");
                  } catch (err) { setFpMessage(err.message || "Failed to send OTP"); }
                  finally { setFpSubmitting(false); }
                }} disabled={fpSubmitting}
                  className="rounded-2xl bg-indigo-600 py-3.5 items-center disabled:opacity-60">
                  <Text className="font-extrabold text-white">{fpSubmitting ? "Sending..." : "Send Reset OTP"}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="gap-4">
                <View>
                  <Text className="text-xs font-bold text-slate-700 mb-1">OTP</Text>
                  <View className="flex-row gap-2">
                    {fpOtp.map((digit, i) => (
                      <TextInput key={i}
                        value={digit}
                        onChangeText={(v) => {
                          const newOtp = [...fpOtp];
                          newOtp[i] = v.replace(/\D/g, "").slice(0, 1);
                          setFpOtp(newOtp);
                          if (v && i < 5) {
                            const ref = fpOtpRefs.current[i + 1];
                            if (ref) ref.focus();
                          }
                        }}
                        onKeyPress={({ nativeEvent }) => {
                          if (nativeEvent.key === "Backspace" && !fpOtp[i] && i > 0) {
                            const ref = fpOtpRefs.current[i - 1];
                            if (ref) ref.focus();
                          }
                        }}
                        ref={(el) => { fpOtpRefs.current[i] = el; }}
                        className="flex-1 h-12 rounded-xl bg-slate-50 border border-slate-200 text-center text-lg font-extrabold"
                        keyboardType="numeric" maxLength={1} />
                    ))}
                  </View>
                </View>
                <View>
                  <Text className="text-xs font-bold text-slate-700 mb-1">New Password</Text>
                  <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-200 px-4">
                    <ShieldCheck size={16} color={colors.slate[400]} />
                    <TextInput className="flex-1 ml-2 py-3 text-sm" placeholder="8+ chars, upper/lower/number/symbol"
                      placeholderTextColor="#94a3b8"
                      value={fpPassword} onChangeText={setFpPassword} secureTextEntry />
                  </View>
                </View>
                <View>
                  <Text className="text-xs font-bold text-slate-700 mb-1">Confirm Password</Text>
                  <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-200 px-4">
                    <ShieldCheck size={16} color={colors.slate[400]} />
                    <TextInput className="flex-1 ml-2 py-3 text-sm" placeholder="Re-enter password"
                      placeholderTextColor="#94a3b8"
                      value={fpConfirmPassword} onChangeText={setFpConfirmPassword} secureTextEntry />
                  </View>
                </View>
                <TouchableOpacity onPress={async () => {
                  if (fpPassword !== fpConfirmPassword) { setFpMessage("Passwords do not match"); return; }
                  if (fpPassword.length < 6) { setFpMessage("Password must be at least 6 characters"); return; }
                  const otpStr = fpOtp.join("");
                  if (otpStr.length < 6) { setFpMessage("Please enter the complete OTP"); return; }
                  setFpSubmitting(true); setFpMessage("");
                  try {
                    await resetPassword({ email: fpEmail, otp: otpStr, password: fpPassword, role: "VENDOR" });
                    setFpMessage("Password reset successfully! You can now login.");
                    setTimeout(() => { setShowForgotPassword(false); setFpOtpSent(false); setFpOtp(["", "", "", "", "", ""]); setFpPassword(""); setFpConfirmPassword(""); }, 2000);
                  } catch (err) { setFpMessage(err.message || "Failed to reset password"); }
                  finally { setFpSubmitting(false); }
                }} disabled={fpSubmitting}
                  className="rounded-2xl bg-indigo-600 py-3.5 items-center disabled:opacity-60">
                  <Text className="font-extrabold text-white">{fpSubmitting ? "Resetting..." : "Reset Password"}</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity onPress={() => { setShowForgotPassword(false); setFpOtpSent(false); setFpOtp(["", "", "", "", "", ""]); setFpMessage(""); }}
              className="rounded-2xl border border-slate-300 py-3.5 items-center mt-3">
              <Text className="font-extrabold text-slate-700">Back to Signup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
                    <ChevronLeft size={16} color={colors.slate[400]}
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



