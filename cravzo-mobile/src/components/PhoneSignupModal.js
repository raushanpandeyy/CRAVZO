import React, { useCallback, useEffect, useRef, useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useDispatch } from "react-redux";
import { Bike, Mail, Lock, Store, User, X } from "lucide-react-native";

import { API_ENDPOINTS } from "../constants/apiEndpoints";
import { apiRequest } from "../services/api";
import { colors } from "../constants/colors";
import { setUser } from "../store/slices/userSlice";
import { persistSession, normalizeUser, login as loginApi } from "../services/authService";

const ROLES = [
  { key: "CUSTOMER", label: "Customer", icon: User, desc: "Order food" },
  { key: "RIDER", label: "Rider", icon: Bike, desc: "Deliver orders" },
  { key: "VENDOR", label: "Business", icon: Store, desc: "Partner restaurant" },
];

const OtpInput = ({ otp, setOtp, inputRef }) => (
  <View className="mb-6">
    <View className="flex-row justify-center gap-3">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          className={`h-14 w-12 items-center justify-center rounded-xl border-2 ${
            otp[i] ? "border-indigo-950 bg-indigo-50" : "border-indigo-300 bg-slate-50"
          }`}
        >
          <Text className="text-xl font-black text-slate-900">{otp[i] || ""}</Text>
        </View>
      ))}
    </View>
    <TextInput
      ref={inputRef}
      value={otp}
      onChangeText={(t) => {
        const digits = t.replace(/[^0-9]/g, "").slice(0, 6);
        setOtp(digits);
      }}
      keyboardType="number-pad"
      maxLength={6}
      className="absolute inset-0 opacity-0"
      autoFocus
    />
  </View>
);

export default function PhoneSignupModal({ visible, onClose }) {
  const dispatch = useDispatch();
  const [mode, setMode] = useState("signup");
  const [step, setStep] = useState("auth");
  const [authMethod, setAuthMethod] = useState("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CUSTOMER");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const otpInputRef = useRef(null);

  useEffect(() => {
    if (!visible) {
      setMode("signup");
      setStep("auth");
      setPhone("");
      setEmail("");
      setName("");
      setPassword("");
      setOtp("");
      setRole("CUSTOMER");
      setAuthMethod("phone");
    }
  }, [visible]);

  const handleSendOtp = useCallback(async () => {
    if (authMethod === "phone") {
      const cleaned = phone.replace(/[^0-9]/g, "");
      if (cleaned.length < 10) {
        Alert.alert("Invalid Phone", "Please enter a valid 10-digit phone number");
        return;
      }

      setLoading(true);
      try {
        await apiRequest(API_ENDPOINTS.auth.phoneSignup, {
          method: "POST",
          data: { phone: cleaned, role },
        });
        setStep("otp");
        setTimeout(() => otpInputRef.current?.focus(), 300);
      } catch (err) {
        Alert.alert("Error", err.response?.data?.message || err.message || "Failed to send OTP");
      } finally {
        setLoading(false);
      }
    } else {
      if (!name.trim()) {
        Alert.alert("Name Required", "Please enter your name");
        return;
      }
      if (!email.trim()) {
        Alert.alert("Email Required", "Please enter your email");
        return;
      }
      if (!password || password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
        Alert.alert("Weak Password", "Password must be 8+ chars with uppercase, lowercase, number & special character");
        return;
      }

      setLoading(true);
      try {
        const payload = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
        };
        await apiRequest(API_ENDPOINTS.auth.signup, {
          method: "POST",
          data: payload,
        });
        setStep("otp");
        setTimeout(() => otpInputRef.current?.focus(), 300);
      } catch (err) {
        Alert.alert("Error", err.response?.data?.message || err.message || "Failed to send OTP");
      } finally {
        setLoading(false);
      }
    }
  }, [authMethod, phone, email, name, password, role]);

  const handleLogin = useCallback(async () => {
    if (!email.trim()) {
      Alert.alert("Email Required", "Please enter your email");
      return;
    }
    if (!password) {
      Alert.alert("Password Required", "Please enter your password");
      return;
    }
    setLoading(true);
    try {
      const res = await loginApi({ email: email.trim().toLowerCase(), password });
      const data = res.data || res;
      const user = data.user || data;
      const token = data.token;
      const normalized = normalizeUser(user);
      persistSession({ user: normalized, token });
      dispatch(setUser(normalized));
      onClose();
    } catch (err) {
      Alert.alert("Login Failed", err.response?.data?.message || err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }, [email, password, dispatch, onClose]);

  const handleVerifyOtp = useCallback(async () => {
    if (otp.length !== 6) return;

    setLoading(true);
    try {
      let res;
      if (authMethod === "phone") {
        res = await apiRequest(API_ENDPOINTS.auth.verifyPhoneOtp, {
          method: "POST",
          data: { phone: phone.replace(/[^0-9]/g, ""), otp, role },
        });
      } else {
        res = await apiRequest(API_ENDPOINTS.auth.verifyOtp, {
          method: "POST",
          data: { email: email.trim().toLowerCase(), otp, role: role === "CUSTOMER" ? "CUSTOMER" : role },
        });
      }
      const data = res.data || res;
      const user = data.user || data;
      const token = data.token;
      const normalized = normalizeUser(user);
      persistSession({ user: normalized, token });
      dispatch(setUser(normalized));
      onClose();
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  }, [otp, authMethod, phone, email, role, dispatch, onClose]);

  const handleResendOtp = useCallback(async () => {
    setLoading(true);
    try {
      if (authMethod === "phone") {
        await apiRequest(API_ENDPOINTS.auth.phoneSignup, {
          method: "POST",
          data: { phone: phone.replace(/[^0-9]/g, ""), role },
        });
      } else {
        await apiRequest(API_ENDPOINTS.auth.sendOtp, {
          method: "POST",
          data: { email: email.trim().toLowerCase(), role: role === "CUSTOMER" ? "CUSTOMER" : role },
        });
      }
      setOtp("");
      Alert.alert("OTP Sent", "A new OTP has been sent to you.");
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || err.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  }, [authMethod, phone, email, role]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end bg-black/40"
      >
        <TouchableOpacity className="flex-1" onPress={onClose} />

        <View className="rounded-t-3xl bg-white px-6 pb-8 pt-6 shadow-2xl">
          <View className="mb-4 flex-row items-center justify-between">
            {step === "otp" ? (
              <Text className="text-xl font-black text-slate-900">Verify OTP</Text>
            ) : (
              <View className="flex-row gap-1 rounded-xl bg-slate-100 p-1">
                <TouchableOpacity onPress={() => { setMode("signup"); setPassword(""); }}
                  className={`px-5 py-2 rounded-lg ${mode === "signup" ? "bg-white shadow-sm" : ""}`}>
                  <Text className={`text-sm font-extrabold ${mode === "signup" ? "text-indigo-950" : "text-slate-500"}`}>Sign Up</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setMode("login"); setPassword(""); }}
                  className={`px-5 py-2 rounded-lg ${mode === "login" ? "bg-white shadow-sm" : ""}`}>
                  <Text className={`text-sm font-extrabold ${mode === "login" ? "text-indigo-950" : "text-slate-500"}`}>Log In</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity onPress={onClose} className="rounded-full bg-slate-100 p-2">
              <X size={20} color={colors.slate[500]} />
            </TouchableOpacity>
          </View>

          {step === "otp" ? (
            <>
              <Text className="mb-1 text-sm leading-5 text-slate-500">
                Enter the 6-digit code sent to
              </Text>
              <Text className="mb-6 text-base font-extrabold text-slate-900">
                {authMethod === "phone" ? `+91 ${phone}` : email}
              </Text>

              <OtpInput otp={otp} setOtp={setOtp} inputRef={otpInputRef} />

              <TouchableOpacity
                onPress={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
                className="items-center rounded-2xl bg-indigo-950 px-6 py-4 shadow-lg shadow-indigo-950/20 disabled:opacity-50"
              >
                <Text className="text-sm font-extrabold text-white">
                  {loading ? "Verifying..." : "Verify & Create Account"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleResendOtp} disabled={loading} className="mt-4 items-center">
                <Text className="text-sm font-bold text-indigo-600">Resend OTP</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setStep("auth")} className="mt-2 items-center">
                <Text className="text-sm font-bold text-slate-500">
                  {authMethod === "phone" ? "Change phone number" : "Change email"}
                </Text>
              </TouchableOpacity>
            </>
          ) : mode === "login" ? (
            <>
              <Text className="mb-4 text-sm leading-5 text-slate-500">
                Welcome back! Log in to your account.
              </Text>
              <View className="mb-4 space-y-3">
                <View className="flex-row items-center rounded-2xl border border-indigo-300 bg-slate-50 px-4 py-3">
                  <Mail size={20} color={colors.slate[400]} />
                  <TextInput
                    placeholder="Email address"
                    placeholderTextColor={colors.slate[500]}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    className="ml-3 flex-1 text-base font-medium text-slate-900" style={{ outline: "none" }}
                  />
                </View>
                <View className="flex-row items-center rounded-2xl border border-indigo-300 bg-slate-50 px-4 py-3">
                  <Lock size={20} color={colors.slate[400]} />
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor={colors.slate[500]}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    className="ml-3 flex-1 text-base font-medium text-slate-900" style={{ outline: "none" }}
                  />
                </View>
              </View>
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading || !email.trim() || !password}
                className="items-center rounded-2xl bg-indigo-950 px-6 py-4 shadow-lg shadow-indigo-950/20 disabled:opacity-50"
              >
                <Text className="text-sm font-extrabold text-white">
                  {loading ? "Logging in..." : "Log In"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text className="mb-4 text-sm leading-5 text-slate-500">
                {authMethod === "phone"
                  ? "Enter your phone number and choose your role to get started."
                  : "Enter your details and choose your role to get started."}
              </Text>

              {authMethod === "phone" ? (
                <View className="mb-4 flex-row items-center rounded-2xl border border-indigo-300 bg-slate-50 px-4 py-3">
                  <Text className="mr-2 text-xl">{String.fromCodePoint(0x1F1EE, 0x1F1F3)}</Text>
                  <Text className="mr-2 font-bold text-indigo-600">+91</Text>
                  <View className="h-6 w-px bg-slate-300" />
                  <TextInput
                    placeholder="Phone number"
                    placeholderTextColor={colors.slate[500]}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={setPhone}
                    className="ml-3 flex-1 text-base font-medium text-indigo-600" style={{ outline: "none" }}
                  />
                </View>
              ) : (
                <View className="mb-4 space-y-3">
                  <View className="flex-row items-center rounded-2xl border border-indigo-300 bg-slate-50 px-4 py-3">
                    <User size={20} color={colors.slate[400]} />
                    <TextInput
                      placeholder="Full name"
                      placeholderTextColor={colors.slate[500]}
                      value={name}
                      onChangeText={setName}
                      className="ml-3 flex-1 text-base font-medium text-slate-900" style={{ outline: "none" }}
                    />
                  </View>
                  <View className="flex-row items-center rounded-2xl border border-indigo-300 bg-slate-50 px-4 py-3">
                    <Mail size={20} color={colors.slate[400]} />
                    <TextInput
                      placeholder="Email address"
                      placeholderTextColor={colors.slate[500]}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                      className="ml-3 flex-1 text-base font-medium text-slate-900" style={{ outline: "none" }}
                    />
                  </View>
                  <View className="flex-row items-center rounded-2xl border border-indigo-300 bg-slate-50 px-4 py-3">
                    <Lock size={20} color={colors.slate[400]} />
                    <TextInput
                      placeholder="Password (min 8 characters)"
                      placeholderTextColor={colors.slate[500]}
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                      className="ml-3 flex-1 text-base font-medium text-slate-900" style={{ outline: "none" }}
                    />
                  </View>
                </View>
              )}

              <Text className="mb-3 text-sm font-bold text-slate-700">I want to</Text>
              <View className="mb-4 gap-2">
                {ROLES.filter((option) => authMethod !== "phone" || option.key !== "VENDOR").map((r) => {
                  const Icon = r.icon;
                  const selected = role === r.key;
                  return (
                    <TouchableOpacity
                      key={r.key}
                      onPress={() => setRole(r.key)}
                      className={`flex-row items-center gap-3 rounded-2xl border px-4 py-3 ${
                        selected
                          ? "border-indigo-950 bg-indigo-50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <View
                        className={`h-10 w-10 items-center justify-center rounded-xl ${
                          selected ? "bg-indigo-950" : "bg-slate-100"
                        }`}
                      >
                        <Icon size={20} color={selected ? "#fff" : colors.slate[500]} />
                      </View>
                      <View className="flex-1">
                        <Text
                          className={`text-sm font-extrabold ${
                            selected ? "text-indigo-950" : "text-slate-900"
                          }`}
                        >
                          {r.label}
                        </Text>
                        <Text className="text-xs text-slate-500">{r.desc}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                onPress={handleSendOtp}
                disabled={
                  loading ||
                  (authMethod === "phone" ? phone.length < 10 : !name.trim() || !email.trim() || password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password))
                }
                className="items-center rounded-2xl bg-indigo-950 px-6 py-4 shadow-lg shadow-indigo-950/20 disabled:opacity-50"
              >
                <Text className="text-sm font-extrabold text-white">
                  {loading ? "Sending OTP..." : "Send OTP"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setAuthMethod(authMethod === "phone" ? "email" : "phone");
                  setName("");
                  setEmail("");
                  setPassword("");
                  setPhone("");
                }}
                className="mt-4 items-center"
              >
                <Text className="text-sm font-bold text-indigo-600">
                  {authMethod === "phone" ? "Use email instead" : "Use phone instead"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

